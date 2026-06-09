import { config } from "dotenv";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

// Load root .env (two levels up from apps/web)
config({ path: resolve(import.meta.dirname, "../../.env") });

const port = process.env.WEB_PORT || "3000";
const child = spawn("npx", ["next", "dev", "--port", port], {
  stdio: "inherit",
  shell: true,
});

child.on("close", (code) => process.exit(code ?? 1));
