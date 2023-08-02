import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vite";
import { promises as fs } from "fs";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  envPrefix: "REACT_",
  plugins: [
    react(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "service-worker.ts",
      injectRegister: null,
      injectManifest: {
        maximumFileSizeToCacheInBytes: 7000000,
      },
      manifest: {
        name: "Care",
        short_name: "Care",
        theme_color: "#0e9f6e",
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          {
            src: "images/icons/pwa-64x64.png",
            sizes: "64x64",
            type: "image/png",
          },
          {
            src: "images/icons/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "images/icons/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "images/icons/maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
  build: {
    outDir: "build",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
      },
    },
    commonjsOptions: {
      // workaround for react-phone-input-2 https://github.com/vitejs/vite/issues/2139#issuecomment-1405624744
      defaultIsModuleExports(id) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const module = require(id);
          if (module?.default) {
            return false;
          }
          return "auto";
        } catch (error) {
          return "auto";
        }
      },
      transformMixedEsModules: true,
    },
  },
  server: {
    port: 4000,
    proxy: {
      "/api": {
        target: "https://careapi.ohc.network",
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 4000,
    proxy: {
      "/api": {
        target: "https://careapi.ohc.network",
        changeOrigin: true,
      },
    },
  },
  esbuild: {
    loader: "tsx",
    include: [/src\/.*\.[tj]sx?$/],
    exclude: [/src\/stories/],
  },

  define: {
    // for unconventional usage of global by third party libraries
    global: "window",
  },
  optimizeDeps: {
    esbuildOptions: {
      plugins: [
        // again thanks to thirdparty libraries for using jsx in js files
        {
          name: "load-js-files-as-jsx",
          setup(build) {
            build.onLoad({ filter: /src\/.*\.js$/ }, async (args) => ({
              loader: "jsx",
              contents: await fs.readFile(args.path, "utf8"),
            }));
          },
        },
      ],
    },
  },
});
