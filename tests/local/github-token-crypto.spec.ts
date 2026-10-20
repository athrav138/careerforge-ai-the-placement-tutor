import { randomBytes } from "node:crypto";
import { expect, test } from "@playwright/test";

test.describe("GitHub token encryption", () => {
  test.beforeEach(() => {
    process.env.GITHUB_TOKEN_ENCRYPTION_KEY = randomBytes(32).toString("base64");
  });

  test.afterEach(() => {
    delete process.env.GITHUB_TOKEN_ENCRYPTION_KEY;
  });

  test("encrypts tokens at rest and decrypts them only with the configured key", async () => {
    const { decryptGitHubToken, encryptGitHubToken } = await import("../../src/lib/github-token-crypto");
    const token = "ghp_sensitive-token-value";
    const encrypted = encryptGitHubToken(token);

    expect(encrypted).not.toContain(token);
    expect(encrypted).toMatch(/^v1:/);
    expect(decryptGitHubToken(encrypted)).toBe(token);
  });

  test("rejects missing keys and tampered ciphertext", async () => {
    const { decryptGitHubToken, encryptGitHubToken } = await import("../../src/lib/github-token-crypto");
    const encrypted = encryptGitHubToken("ghp_sensitive-token-value");
    const [version, iv, authTag, ciphertext] = encrypted.split(":");

    process.env.GITHUB_TOKEN_ENCRYPTION_KEY = randomBytes(32).toString("base64");
    expect(() => decryptGitHubToken(encrypted)).toThrow();
    expect(() => decryptGitHubToken([version, iv, authTag, `${ciphertext}AA==`].join(":"))).toThrow();

    delete process.env.GITHUB_TOKEN_ENCRYPTION_KEY;
    expect(() => encryptGitHubToken("ghp_sensitive-token-value")).toThrow(/not configured/);
  });
});
