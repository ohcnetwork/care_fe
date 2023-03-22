import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "path";
import { promises as fs } from "fs";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "build",
    minify: false,

    // workaround for react-phone-input-2 https://github.com/vitejs/vite/issues/2139#issuecomment-1405624744
    commonjsOptions: {
      defaultIsModuleExports(id) {
        try {
          const module = require(id);
          if (module?.default) {
            return false;
          }
          return 'auto';
        } catch (error) {
          return 'auto';
        }
      },
      transformMixedEsModules: true,
    },
  },
  server: {
    port: 4000,
    proxy: {
      "/api": {
        target: "https://careapi.coronasafe.in",
        changeOrigin: true,
      },
    },
  },
  esbuild: {
    loader: "tsx",
    include: [/src\/.*\.[tj]sx?$/],
    exclude: [/src\/stories/],
  },

  // workarounds
  define: {
    // for unconventional usage of global by third party libraries
    global: "window",
  },
  resolve: {
    alias: [
      // to revert the above workaround for jss-plugin used by material-ui
      {
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
