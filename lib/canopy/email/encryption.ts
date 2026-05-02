import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/* AES-256-GCM at-rest encryption for OAuth tokens.
 *
 * Format: 'iv:authTag:ciphertext' all hex-encoded so each row is fully
 * self-contained. IV is 12 bytes (the GCM standard); authTag is 16 bytes;
 * ciphertext is variable. Storing the IV alongside each ciphertext means
 * IV reuse is structurally impossible across rows (each call generates a
 * fresh IV via randomBytes).
 *
 * Key source: OAUTH_TOKEN_ENCRYPTION_KEY env var, 64 hex chars (32 bytes).
 * Generate with: openssl rand -hex 32 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const KEY_LENGTH = 32;

class TokenEncryptionConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TokenEncryptionConfigError";
  }
}

function loadKey(): Buffer {
  const raw = process.env.OAUTH_TOKEN_ENCRYPTION_KEY;
  if (!raw) {
    throw new TokenEncryptionConfigError(
      "OAUTH_TOKEN_ENCRYPTION_KEY is not set. Generate one with `openssl rand -hex 32` and add it to Vercel env vars."
    );
  }
  const trimmed = raw.trim();
  if (!/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    throw new TokenEncryptionConfigError(
      "OAUTH_TOKEN_ENCRYPTION_KEY must be a 64-character hex string (32 bytes). Regenerate with `openssl rand -hex 32`."
    );
  }
  return Buffer.from(trimmed, "hex");
}

export function encryptToken(plaintext: string): string {
  if (typeof plaintext !== "string" || plaintext.length === 0) {
    throw new Error("encryptToken: plaintext must be a non-empty string");
  }
  const key = loadKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${ciphertext.toString("hex")}`;
}

export function decryptToken(encrypted: string): string {
  if (typeof encrypted !== "string" || encrypted.length === 0) {
    throw new Error("decryptToken: encrypted value must be a non-empty string");
  }
  const parts = encrypted.split(":");
  if (parts.length !== 3) {
    throw new Error(
      "decryptToken: malformed ciphertext (expected iv:authTag:ciphertext)"
    );
  }
  const [ivHex, authTagHex, ciphertextHex] = parts;
  if (!ivHex || !authTagHex || !ciphertextHex) {
    throw new Error("decryptToken: malformed ciphertext (empty segment)");
  }
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const ciphertext = Buffer.from(ciphertextHex, "hex");
  if (iv.length !== IV_LENGTH) {
    throw new Error(
      `decryptToken: IV must be ${IV_LENGTH} bytes (got ${iv.length})`
    );
  }
  const key = loadKey();
  if (key.length !== KEY_LENGTH) {
    throw new Error(`decryptToken: key must be ${KEY_LENGTH} bytes`);
  }
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}

export function isTokenEncryptionConfigured(): boolean {
  try {
    loadKey();
    return true;
  } catch {
    return false;
  }
}
