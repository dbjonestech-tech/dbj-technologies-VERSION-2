/* Vercel Blob upload helper for client deliverables.
 *
 * Mirrors the REST-API pattern lib/services/voice.ts uses for Pathlight
 * audio summaries: uses the documented Blob endpoint plus
 * BLOB_READ_WRITE_TOKEN, no @vercel/blob package dependency. The
 * pathname is namespaced under `clients/<projectId>/<random>/<safeName>`
 * so leaked URLs are unguessable; the gated proxy at
 * /portal/files/[id]/download is the actual access boundary.
 */

const BLOB_ENDPOINT = "https://blob.vercel-storage.com";
const UPLOAD_TIMEOUT_MS = 60_000;

export class ClientFileUploadError extends Error {
  constructor(message: string, public stage: "config" | "upload") {
    super(message);
    this.name = "ClientFileUploadError";
  }
}

export type UploadResult = {
  url: string;
  pathname: string;
};

function safeFilename(filename: string): string {
  const trimmed = filename.trim().slice(0, 200);
  return (
    trimmed.replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/^_+|_+$/g, "") ||
    "file"
  );
}

export async function uploadClientFile(args: {
  projectId: string;
  filename: string;
  contentType: string;
  data: Buffer;
}): Promise<UploadResult> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new ClientFileUploadError(
      "BLOB_READ_WRITE_TOKEN is not configured.",
      "config"
    );
  }
  const random = crypto.randomUUID();
  const pathname = `clients/${args.projectId}/${random}/${safeFilename(args.filename)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);
  try {
    const res = await fetch(`${BLOB_ENDPOINT}/${pathname}`, {
      method: "PUT",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": args.contentType || "application/octet-stream",
        "x-content-type": args.contentType || "application/octet-stream",
        "x-add-random-suffix": "0",
        "x-cache-control-max-age": "300",
      },
      body: new Uint8Array(args.data),
      signal: controller.signal,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new ClientFileUploadError(
        `Vercel Blob upload failed (${res.status}): ${detail.slice(0, 200)}`,
        "upload"
      );
    }
    const json = (await res.json().catch(() => null)) as
      | { url?: string; pathname?: string }
      | null;
    if (!json?.url) {
      throw new ClientFileUploadError(
        "Vercel Blob upload succeeded but returned no URL.",
        "upload"
      );
    }
    return {
      url: json.url,
      pathname: json.pathname ?? pathname,
    };
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new ClientFileUploadError(
        "Vercel Blob upload timed out.",
        "upload"
      );
    }
    if (err instanceof ClientFileUploadError) throw err;
    throw new ClientFileUploadError(
      err instanceof Error ? err.message : String(err),
      "upload"
    );
  } finally {
    clearTimeout(timer);
  }
}
