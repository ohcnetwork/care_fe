import path from "node:path";

/** @type {import('vite').UserConfig} */
export default {
  resolve: {
    alias: {
      "@careConfig": path.resolve(__dirname, "../care.config.ts"),
    },
  },
};
