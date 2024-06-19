import { defineConfig } from "vite";

export default defineConfig({
  esbuild: {
    loader: "tsx",
    include: [/src\/.*\.[tj]sx?$/, /.storybook\/.*\.[tj]sx?$/],
  },
});
