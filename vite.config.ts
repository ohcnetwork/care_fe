import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import { resolve } from "path";
import { promises as fs } from "fs";

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
        theme_color: "#33bb17",
        background_color: "#2196f3",
        icons: [
          {
            src: "https://cdn.coronasafe.network/care-manifest/images/icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "https://cdn.coronasafe.network/care-manifest/images/icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "https://cdn.coronasafe.network/care-manifest/images/icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
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
  resolve: {
    alias: [
      {
        // to revert the above workaround for jss-plugin used by material-ui
        find: /^jss-plugin-(.*)$/,
        replacement: "$1",
        customResolver: (id) => {
          if (id === "window") {
            id = "global";
          }
          return resolve(
            __dirname,
            `./node_modules/jss-plugin-${id}/src/index.js`
          );
        },
      },
      {
        // to revert the above wokraround for global-cache used by react-dates
        find: /^(.*)-cache$/,
        replacement: "$1",
        customResolver: (id) => {
          if (id === "window") {
            id = "global";
          }
          return resolve(__dirname, `./node_modules/${id}-cache/index.js`);
        },
      },
    ],
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
