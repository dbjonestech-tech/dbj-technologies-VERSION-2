import Anthropic from "@anthropic-ai/sdk";
import { buildAudioSummaryPrompt } from "@/lib/prompts/audio-summary";
import type { PathlightReport } from "@/lib/types/scan";
import {
  recordAnthropicUsage,
  recordElevenLabsUsage,
} from "./api-usage";

/**
 * Voice summary pipeline:
 *  1. Haiku 4.5 generates a 100-130 word spoken script grounded in the
 *     scan data (single biggest issue, conservative revenue framing,
 *     spelled-out numbers, end with one next action).
 *  2. ElevenLabs eleven_turbo_v2_5 with the Adam voice turns the
 *     script into an MP3 buffer.
 *  3. The MP3 buffer is uploaded to Vercel Blob at a stable per-scan
 *     path. The public Blob URL is returned to the caller, which
 *     persists it on scan_results.audio_summary_url.
 *
 * All three stages are best-effort. A failure at any step throws and
 * the caller (the `a5` Inngest step) catches and continues without
 * audio so the report still ships.
 *
 * Required env vars:
 *   ANTHROPIC_API_KEY      (already required for the rest of the pipeline)
 *   ELEVENLABS_API_KEY     (NEW, required for this feature)
 *   BLOB_READ_WRITE_TOKEN  (NEW, required by Vercel Blob)
 *
 * Optional:
 *   ELEVENLABS_VOICE_ID    (override the default Adam voice)
 *   ELEVENLABS_MODEL       (override eleven_turbo_v2_5)
 */

const HAIKU_MODEL = "claude-haiku-4-5-20251001";
const HAIKU_MAX_TOKENS = 600;
// ElevenLabs stock voice "Adam" -- warm male, conversational tone,
// well-suited to a senior-consultant-on-the-phone narration. Voice
// ID is the canonical public ID published in ElevenLabs's voice
// library and is safe to ship in source.
const DEFAULT_VOICE_ID = "pNInz6obpgDQGcFmaJgB";
const DEFAULT_TTS_MODEL = "eleven_turbo_v2_5";
const TTS_TIMEOUT_MS = 45_000;
const BLOB_UPLOAD_TIMEOUT_MS = 30_000;
const SCRIPT_GEN_TIMEOUT_MS = 60_000;

export type VoiceSummaryResult = {
  audioUrl: string;
  script: string;
  characters: number;
  audioBytes: number;
  durationMs: number;
};

export class VoiceSummaryError extends Error {
  constructor(
    message: string,
    readonly stage: "script" | "tts" | "upload",
    readonly cause?: unknown
  ) {
    super(message);
    this.name = "VoiceSummaryError";
  }
}

/**
 * Generate the 60-90 second narration script via Haiku. Conditioned
 * on the structured prompt in lib/prompts/audio-summary.ts. Returns
 * the trimmed plain text the TTS will read. Throws on API failure or
 * empty response. Records to api_usage_events as a Haiku call so the
 * cost dashboard captures it.
 */
async function generateScript(
  report: PathlightReport
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new VoiceSummaryError(
      "ANTHROPIC_API_KEY is not configured.",
      "script"
    );
  }
  const client = new Anthropic({ apiKey });
  const { system, user } = buildAudioSummaryPrompt(report);

  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    SCRIPT_GEN_TIMEOUT_MS
  );
  try {
    const resp = (await client.messages.create(
      {
        model: HAIKU_MODEL,
        max_tokens: HAIKU_MAX_TOKENS,
        temperature: 0.6,
        system,
        messages: [{ role: "user", content: user }],
      },
      { signal: controller.signal }
    )) as unknown as {
      content: Array<{ type: string; text?: string; [k: string]: unknown }>;
      usage?: {
        input_tokens?: number;
        output_tokens?: number;
        cache_creation_input_tokens?: number;
        cache_read_input_tokens?: number;
      };
    };

    await recordAnthropicUsage({
      scanId: report.id,
      operation: "audio-summary-script",
      model: HAIKU_MODEL,
      durationMs: Date.now() - start,
      status: "ok",
      attempt: 1,
      usage: resp.usage ?? null,
    });

    const text = resp.content
      .filter((b) => b.type === "text" && typeof b.text === "string")
      .map((b) => b.text as string)
      .join("\n")
      .trim();

    if (!text) {
      throw new VoiceSummaryError(
        "Haiku returned an empty script.",
        "script"
      );
    }
    return text;
  } catch (err) {
    if (!(err instanceof VoiceSummaryError)) {
      await recordAnthropicUsage({
        scanId: report.id,
        operation: "audio-summary-script",
        model: HAIKU_MODEL,
        durationMs: Date.now() - start,
        status: "fail",
        attempt: 1,
        usage: null,
      });
    }
    if ((err as Error).name === "AbortError") {
      throw new VoiceSummaryError(
        "Haiku script generation timed out.",
        "script",
        err
      );
    }
    if (err instanceof VoiceSummaryError) throw err;
    throw new VoiceSummaryError(
      `Haiku script generation failed: ${(err as Error).message}`,
      "script",
      err
    );
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Synthesize the script into MP3 bytes via ElevenLabs.
 * eleven_turbo_v2_5 is the best balance of quality and latency in
 * 2026 (~5-8s for 100 words at typical load). Output format is
 * mp3_44100_128 for ~1MB per 60s clip and consumer-safe bitrate.
 *
 * voice_settings tuning: stability 0.45 (less monotone, more natural
 * variation), similarity_boost 0.8 (faithful to the Adam timbre),
 * style 0.0 (no stylization, pure narration).
 */
async function synthesizeAudio(
  scanId: string,
  script: string
): Promise<Buffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new VoiceSummaryError(
      "ELEVENLABS_API_KEY is not configured.",
      "tts"
    );
  }
  const voiceId = process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID;
  const modelId = process.env.ELEVENLABS_MODEL || DEFAULT_TTS_MODEL;

  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TTS_TIMEOUT_MS);
  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "content-type": "application/json",
          accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: script,
          model_id: modelId,
          voice_settings: {
            stability: 0.45,
            similarity_boost: 0.8,
            style: 0,
            use_speaker_boost: true,
          },
        }),
        signal: controller.signal,
      }
    );

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      await recordElevenLabsUsage({
        scanId,
        operation: "tts-audio-summary",
        charactersIn: script.length,
        durationMs: Date.now() - start,
        status: "fail",
        model: modelId,
      });
      throw new VoiceSummaryError(
        `ElevenLabs TTS failed (${res.status}): ${detail.slice(0, 200)}`,
        "tts"
      );
    }

    const arrayBuffer = await res.arrayBuffer();
    const buf = Buffer.from(arrayBuffer);
    if (buf.byteLength === 0) {
      await recordElevenLabsUsage({
        scanId,
        operation: "tts-audio-summary",
        charactersIn: script.length,
        durationMs: Date.now() - start,
        status: "fail",
        model: modelId,
      });
      throw new VoiceSummaryError(
        "ElevenLabs returned empty audio bytes.",
        "tts"
      );
    }

    await recordElevenLabsUsage({
      scanId,
      operation: "tts-audio-summary",
      charactersIn: script.length,
      durationMs: Date.now() - start,
      status: "ok",
      model: modelId,
    });
    return buf;
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      await recordElevenLabsUsage({
        scanId,
        operation: "tts-audio-summary",
        charactersIn: script.length,
        durationMs: Date.now() - start,
        status: "fail",
        model: modelId,
      });
      throw new VoiceSummaryError(
        "ElevenLabs TTS timed out.",
        "tts",
        err
      );
    }
    if (err instanceof VoiceSummaryError) throw err;
    throw new VoiceSummaryError(
      `ElevenLabs TTS error: ${(err as Error).message}`,
      "tts",
      err
    );
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Upload the MP3 buffer to Vercel Blob via the REST API.
 * Path: pathlight-audio/{scanId}.mp3 -- stable per-scan so a
 * regeneration overwrites cleanly rather than littering the bucket.
 *
 * We avoid the @vercel/blob npm package and use the documented
 * REST endpoint to keep the dependency tree thin. The PUT response
 * includes the public CDN url which is what we persist on
 * scan_results.audio_summary_url.
 *
 * Vercel Blob's REST endpoint accepts the content-type header to
 * tag the stored object; setting audio/mpeg makes the URL serve
 * with the right MIME so the report's <audio> element plays
 * inline rather than triggering a download.
 */
async function uploadToBlob(
  scanId: string,
  audio: Buffer
): Promise<string> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new VoiceSummaryError(
      "BLOB_READ_WRITE_TOKEN is not configured.",
      "upload"
    );
  }
  const pathname = `pathlight-audio/${scanId}.mp3`;
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    BLOB_UPLOAD_TIMEOUT_MS
  );
  try {
    const res = await fetch(
      `https://blob.vercel-storage.com/${pathname}`,
      {
        method: "PUT",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "audio/mpeg",
          "x-content-type": "audio/mpeg",
          // Overwrite an existing blob at the same path on regeneration
          // rather than 409'ing.
          "x-add-random-suffix": "0",
          "x-allow-overwrite": "true",
          "x-cache-control-max-age": "31536000",
        },
        body: new Uint8Array(audio),
        signal: controller.signal,
      }
    );
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new VoiceSummaryError(
        `Vercel Blob upload failed (${res.status}): ${detail.slice(0, 200)}`,
        "upload"
      );
    }
    const json = (await res.json().catch(() => null)) as { url?: string } | null;
    if (!json?.url) {
      throw new VoiceSummaryError(
        "Vercel Blob upload succeeded but returned no URL.",
        "upload"
      );
    }
    return json.url;
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new VoiceSummaryError(
        "Vercel Blob upload timed out.",
        "upload",
        err
      );
    }
    if (err instanceof VoiceSummaryError) throw err;
    throw new VoiceSummaryError(
      `Vercel Blob upload error: ${(err as Error).message}`,
      "upload",
      err
    );
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Top-level driver. Generates the script, synthesizes the audio,
 * uploads to Blob, and returns the structured result for the caller
 * to persist on scan_results.
 */
export async function generateVoiceSummary(
  report: PathlightReport
): Promise<VoiceSummaryResult> {
  const start = Date.now();
  const script = await generateScript(report);
  const audio = await synthesizeAudio(report.id, script);
  const audioUrl = await uploadToBlob(report.id, audio);
  return {
    audioUrl,
    script,
    characters: script.length,
    audioBytes: audio.byteLength,
    durationMs: Date.now() - start,
  };
}
