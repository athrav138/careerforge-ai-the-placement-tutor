import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const VERSION = "v1";
const ALGORITHM = "aes-256-gcm";

function readEncryptionKey(): Buffer {
  const encodedKey = process.env.GITHUB_TOKEN_ENCRYPTION_KEY;
  if (!encodedKey) {
    throw new Error("GITHUB_TOKEN_ENCRYPTION_KEY is not configured.");
  }

  const key = Buffer.from(encodedKey, "base64");
  if (key.length !== 32 || key.toString("base64") !== encodedKey) {
    throw new Error("GITHUB_TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key.");
  }
  return key;
}

export function encryptGitHubToken(token: string): string {
  if (!token.trim()) throw new Error("GitHub access token is required.");

  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, readEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [VERSION, iv.toString("base64"), authTag.toString("base64"), ciphertext.toString("base64")].join(":");
}

export function decryptGitHubToken(encryptedToken: string): string {
  const [version, encodedIv, encodedAuthTag, encodedCiphertext, extra] = encryptedToken.split(":");
  if (version !== VERSION || !encodedIv || !encodedAuthTag || !encodedCiphertext || extra !== undefined) {
    throw new Error("Stored GitHub access token has an unsupported format.");
  }

  const decipher = createDecipheriv(ALGORITHM, readEncryptionKey(), Buffer.from(encodedIv, "base64"));
  decipher.setAuthTag(Buffer.from(encodedAuthTag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(encodedCiphertext, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
