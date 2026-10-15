import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

// Derive paths from this config file rather than process.cwd() so module
// resolution never depends on the working directory a worker happens to have.
const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root: rootDir,
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // Pure-logic suites run in the node environment: it is several times
    // faster than jsdom (no DOM per file) and avoids the client-environment
    // module-loading path that intermittently mis-resolves root-relative ids
    // under Vite 8. DOM tests opt in with `// @vitest-environment jsdom`.
    environment: "node",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    globals: false,
    css: false,
    // The suite is small, so run files serially.
    fileParallelism: false,
  },
});
