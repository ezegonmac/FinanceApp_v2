import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load root .env (two levels up from apps/web)
config({ path: resolve(__dirname, "../../.env") });

const port = process.env.WEB_PORT || "3000";

// Resolve the Next.js CLI entry point directly
const nextCli = resolve(__dirname, "../../node_modules/next/dist/bin/next");

// Run next dev synchronously so it blocks until exit.
// stdin is set to "ignore": when Turbo runs this task, stdin is not an
// interactive TTY, and Next.js 16's Turbopack dev server shuts itself down
// on stdin EOF. Ignoring stdin keeps the server running.
const result = spawnSync(process.execPath, [nextCli, "dev", "--port", port], {
  stdio: ["ignore", "inherit", "inherit"],
  env: process.env,
  cwd: __dirname,
});

process.exit(result.status ?? 0);
