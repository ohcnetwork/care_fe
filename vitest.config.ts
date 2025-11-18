import { resolve } from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  envPrefix: "REACT_",
  resolve: {
    alias: [
      {
        find: "@",
        replacement: resolve(__dirname),
      },
    ],
  },
  test: {
    globals: true,
    environment: "node",
    include: ["vitest/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["build", "node_modules"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
  },
});
