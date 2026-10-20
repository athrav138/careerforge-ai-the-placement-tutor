import "dotenv/config";
import { defineConfig } from "@playwright/test";

const mainPooledHost = "ep-fancy-bread-axzex13s-pooler.c-4.us-east-2.aws.neon.tech";

function isExpectedDatabase(value: string | undefined, expectedHost: string): boolean {
  if (!value) return false;

  try {
    const url = new URL(value);
    return url.protocol === "postgresql:" && url.hostname === expectedHost && url.pathname === "/neondb";
  } catch {
    return false;
  }
}

if (
  process.env.PLAYWRIGHT_MAIN_NEON_AUDIT !== "true"
  || !isExpectedDatabase(process.env.DATABASE_URL, mainPooledHost)
) {
  throw new Error("Refusing database audit: explicit opt-in and the verified main Neon pooled URL are required.");
}

process.env.PLAYWRIGHT_DATABASE_INTEGRATION = "true";

export default defineConfig({
  testDir: ".",
  testMatch: "persistence-and-security.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
});
