import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**"],
  },
  resolve: {
    alias: {
      "@/": path.resolve(__dirname, "./"),
      "@repo/utils": path.resolve(__dirname, "../../packages/utils/src/index.ts"),
      "@repo/db": path.resolve(__dirname, "../../packages/db/src/index.ts"),
    },
  },
});
