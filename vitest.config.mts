import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(process.cwd(), "src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    globals: false,
    css: false,
    // The suite is small. Running files serially avoids an intermittent
    // module-resolution failure seen when many jsdom workers transform and
    // read the shared Vite cache at once.
    fileParallelism: false,
  },
});
