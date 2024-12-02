// vite.config.mts
import { ValidateEnv } from "file:///home/kishan2518b/Desktop/care_fe/node_modules/@julr/vite-plugin-validate-env/dist/index.mjs";
import react from "file:///home/kishan2518b/Desktop/care_fe/node_modules/@vitejs/plugin-react-swc/index.mjs";
import DOMPurify from "file:///home/kishan2518b/Desktop/care_fe/node_modules/dompurify/dist/purify.cjs.js";
import fs2 from "fs";
import { JSDOM } from "file:///home/kishan2518b/Desktop/care_fe/node_modules/jsdom/lib/api.js";
import { marked } from "file:///home/kishan2518b/Desktop/care_fe/node_modules/marked/lib/marked.esm.js";
import { createRequire } from "node:module";
import path2 from "path";
import { defineConfig, loadEnv } from "file:///home/kishan2518b/Desktop/care_fe/node_modules/vite/dist/node/index.js";
import checker from "file:///home/kishan2518b/Desktop/care_fe/node_modules/vite-plugin-checker/dist/esm/main.js";
import { VitePWA } from "file:///home/kishan2518b/Desktop/care_fe/node_modules/vite-plugin-pwa/dist/index.js";
import { viteStaticCopy } from "file:///home/kishan2518b/Desktop/care_fe/node_modules/vite-plugin-static-copy/dist/index.js";
import { z } from "file:///home/kishan2518b/Desktop/care_fe/node_modules/zod/lib/index.mjs";

// plugins/treeShakeCareIcons.ts
import * as fs from "fs";
import { globSync } from "file:///home/kishan2518b/Desktop/care_fe/node_modules/glob/dist/esm/index.js";
import * as path from "path";
var __vite_injected_original_dirname = "/home/kishan2518b/Desktop/care_fe/plugins";
function treeShakeCareIcons(options = { iconWhitelist: [] }) {
  const rootDir = path.resolve(__vite_injected_original_dirname, "..");
  const lineIconNameRegex = /"l-[a-z]+(?:-[a-z]+)*"/g;
  const allUniconPaths = JSON.parse(
    fs.readFileSync(
      path.resolve(rootDir, "src/CAREUI/icons/UniconPaths.json"),
      "utf8"
    )
  );
  function extractCareIconNames(file) {
    const fileContent = fs.readFileSync(file, "utf8");
    const lineIconNameMatches = fileContent.match(lineIconNameRegex) || [];
    const lineIconNames = lineIconNameMatches.map(
      (lineIconName) => lineIconName.slice(1, -1)
      // remove quotes
    );
    return lineIconNames;
  }
  function getAllUsedIconNames() {
    const files = globSync(path.resolve(rootDir, "{apps,src}/**/*.{tsx,res}"));
    const usedIconsArray = [];
    files.forEach((file) => {
      const iconNames = extractCareIconNames(file);
      usedIconsArray.push(...iconNames);
    });
    return new Set(usedIconsArray);
  }
  function getTreeShakenUniconPaths() {
    const usedIcons = [...getAllUsedIconNames(), ...options.iconWhitelist];
    const treeshakenCareIconPaths = {};
    for (const iconName of usedIcons) {
      const path3 = allUniconPaths[iconName];
      if (path3 === void 0) {
        throw new Error(`Icon ${iconName} is not found in UniconPaths.json`);
      } else {
        treeshakenCareIconPaths[iconName] = path3;
      }
    }
    return treeshakenCareIconPaths;
  }
  return {
    name: "tree-shake-care-icons",
    transform(_src, id) {
      if (process.env.NODE_ENV !== "production") {
        return;
      }
      if (id.endsWith("UniconPaths.json")) {
        return {
          code: `export default ${JSON.stringify(getTreeShakenUniconPaths())}`,
          map: null
        };
      }
    }
  };
}

// vite.config.mts
var __vite_injected_original_dirname2 = "/home/kishan2518b/Desktop/care_fe";
var __vite_injected_original_import_meta_url = "file:///home/kishan2518b/Desktop/care_fe/vite.config.mts";
var pdfWorkerPath = path2.join(
  path2.dirname(
    createRequire(__vite_injected_original_import_meta_url).resolve("pdfjs-dist/package.json")
  ),
  "build",
  "pdf.worker.min.mjs"
);
function getDescriptionHtml(description) {
  const html = marked.parse(description, {
    async: false,
    gfm: true,
    breaks: true
  });
  const purify = DOMPurify(new JSDOM("").window);
  const sanitizedHtml = purify.sanitize(html);
  return JSON.stringify(sanitizedHtml);
}
function getPluginAliases() {
  const pluginsDir = path2.resolve(__vite_injected_original_dirname2, "apps");
  if (!fs2.existsSync(pluginsDir)) {
    return {};
  }
  const pluginFolders = fs2.readdirSync(pluginsDir);
  const aliases = {};
  pluginFolders.forEach((pluginFolder) => {
    const pluginSrcPath = path2.join(pluginsDir, pluginFolder, "src");
    if (fs2.existsSync(pluginSrcPath)) {
      aliases[`@apps/${pluginFolder}`] = pluginSrcPath;
      aliases[`@app-manifest/${pluginFolder}`] = path2.join(
        pluginSrcPath,
        "manifest.ts"
      );
    }
  });
  return aliases;
}
function getPluginDependencies() {
  const pluginsDir = path2.resolve(__vite_injected_original_dirname2, "apps");
  if (!fs2.existsSync(pluginsDir)) {
    return [];
  }
  const pluginFolders = fs2.readdirSync(pluginsDir);
  const dependencies = /* @__PURE__ */ new Set();
  pluginFolders.forEach((pluginFolder) => {
    const packageJsonPath = path2.join(pluginsDir, pluginFolder, "package.json");
    if (fs2.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs2.readFileSync(packageJsonPath, "utf8"));
      const pluginDependencies = packageJson.dependencies ? Object.keys(packageJson.dependencies) : [];
      pluginDependencies.forEach((dep) => dependencies.add(dep));
    }
  });
  return Array.from(dependencies);
}
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const cdnUrls = env.REACT_CDN_URLS || [
    "https://egov-s3-facility-10bedicu.s3.amazonaws.com",
    "https://egov-s3-patient-data-10bedicu.s3.amazonaws.com",
    "http://localhost:4566"
  ].join(" ");
  return {
    envPrefix: "REACT_",
    define: {
      __CUSTOM_DESCRIPTION_HTML__: getDescriptionHtml(
        env.REACT_CUSTOM_DESCRIPTION || ""
      )
    },
    plugins: [
      ValidateEnv({
        validator: "zod",
        schema: {
          REACT_CARE_API_URL: z.string().url(),
          REACT_SENTRY_DSN: z.string().url().optional(),
          REACT_SENTRY_ENVIRONMENT: z.string().optional(),
          REACT_PLAUSIBLE_SITE_DOMAIN: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9-_.]*\.[a-zA-Z]{2,}$/).optional().describe("Domain name without protocol (e.g., sub.domain.com)"),
          REACT_PLAUSIBLE_SERVER_URL: z.string().url().optional(),
          REACT_CDN_URLS: z.string().optional().transform((val) => val?.split(" ")).pipe(z.array(z.string().url()).optional()).describe("Optional: Space-separated list of CDN URLs")
        }
      }),
      viteStaticCopy({
        targets: [
          {
            src: pdfWorkerPath,
            dest: ""
          }
        ]
      }),
      react(),
      checker({ typescript: true }),
      treeShakeCareIcons({
        iconWhitelist: ["default"]
      }),
      VitePWA({
        strategies: "injectManifest",
        srcDir: "src",
        filename: "service-worker.ts",
        injectRegister: "script-defer",
        devOptions: {
          enabled: true,
          type: "module"
        },
        injectManifest: {
          maximumFileSizeToCacheInBytes: 7e6
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
              type: "image/png"
            },
            {
              src: "images/icons/pwa-192x192.png",
              sizes: "192x192",
              type: "image/png"
            },
            {
              src: "images/icons/pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any"
            },
            {
              src: "images/icons/maskable-icon-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable"
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        ...getPluginAliases(),
        "@": path2.resolve(__vite_injected_original_dirname2, "./src"),
        "@careConfig": path2.resolve(__vite_injected_original_dirname2, "./care.config.ts"),
        "@core": path2.resolve(__vite_injected_original_dirname2, "src/")
      }
    },
    optimizeDeps: {
      include: getPluginDependencies()
    },
    build: {
      outDir: "build",
      assetsDir: "bundle",
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks(id, { getModuleInfo }) {
            if (id.includes("node_modules")) {
              let isStaticallyImportedByEntry2 = function(moduleId, visited = /* @__PURE__ */ new Set()) {
                if (visited.has(moduleId)) return false;
                visited.add(moduleId);
                const modInfo = getModuleInfo(moduleId);
                if (!modInfo) return false;
                if (modInfo.isEntry) {
                  return true;
                }
                for (const importerId of modInfo.importers) {
                  if (isStaticallyImportedByEntry2(importerId, visited)) {
                    return true;
                  }
                }
                return false;
              };
              var isStaticallyImportedByEntry = isStaticallyImportedByEntry2;
              const moduleInfo = getModuleInfo(id);
              const manualVendorChunks = /tiny-invariant/;
              if (manualVendorChunks.test(id) || isStaticallyImportedByEntry2(id)) {
                return "vendor";
              } else {
                const dynamicImporters = moduleInfo?.dynamicImporters || [];
                if (dynamicImporters && dynamicImporters.length > 0) {
                  const importerChunkName = dynamicImporters[0] ? dynamicImporters[0].split("/").pop() : "vendor".split(".")[0];
                  return `chunk-${importerChunkName}`;
                }
              }
            }
          }
        }
      }
    },
    server: {
      port: 4e3
    },
    preview: {
      headers: {
        "Content-Security-Policy-Report-Only": `default-src 'self';        script-src 'self' blob: 'nonce-f51b9742' https://plausible.10bedicu.in;        style-src 'self' 'unsafe-inline';        connect-src 'self' https://plausible.10bedicu.in;        img-src 'self' https://cdn.ohc.network ${cdnUrls};        object-src 'self' ${cdnUrls};`
      },
      port: 4e3
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcubXRzIiwgInBsdWdpbnMvdHJlZVNoYWtlQ2FyZUljb25zLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL2hvbWUva2lzaGFuMjUxOGIvRGVza3RvcC9jYXJlX2ZlXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9raXNoYW4yNTE4Yi9EZXNrdG9wL2NhcmVfZmUvdml0ZS5jb25maWcubXRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL2tpc2hhbjI1MThiL0Rlc2t0b3AvY2FyZV9mZS92aXRlLmNvbmZpZy5tdHNcIjtpbXBvcnQgeyBWYWxpZGF0ZUVudiB9IGZyb20gXCJAanVsci92aXRlLXBsdWdpbi12YWxpZGF0ZS1lbnZcIjtcbmltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3Qtc3djXCI7XG5pbXBvcnQgRE9NUHVyaWZ5IGZyb20gXCJkb21wdXJpZnlcIjtcbmltcG9ydCBmcyBmcm9tIFwiZnNcIjtcbmltcG9ydCB7IEpTRE9NIH0gZnJvbSBcImpzZG9tXCI7XG5pbXBvcnQgeyBtYXJrZWQgfSBmcm9tIFwibWFya2VkXCI7XG5pbXBvcnQgeyBjcmVhdGVSZXF1aXJlIH0gZnJvbSBcIm5vZGU6bW9kdWxlXCI7XG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBsb2FkRW52IH0gZnJvbSBcInZpdGVcIjtcbmltcG9ydCBjaGVja2VyIGZyb20gXCJ2aXRlLXBsdWdpbi1jaGVja2VyXCI7XG5pbXBvcnQgeyBWaXRlUFdBIH0gZnJvbSBcInZpdGUtcGx1Z2luLXB3YVwiO1xuaW1wb3J0IHsgdml0ZVN0YXRpY0NvcHkgfSBmcm9tIFwidml0ZS1wbHVnaW4tc3RhdGljLWNvcHlcIjtcbmltcG9ydCB7IHogfSBmcm9tIFwiem9kXCI7XG5cbmltcG9ydCB7IHRyZWVTaGFrZUNhcmVJY29ucyB9IGZyb20gXCIuL3BsdWdpbnMvdHJlZVNoYWtlQ2FyZUljb25zXCI7XG5cbmNvbnN0IHBkZldvcmtlclBhdGggPSBwYXRoLmpvaW4oXG4gIHBhdGguZGlybmFtZShcbiAgICBjcmVhdGVSZXF1aXJlKGltcG9ydC5tZXRhLnVybCkucmVzb2x2ZShcInBkZmpzLWRpc3QvcGFja2FnZS5qc29uXCIpLFxuICApLFxuICBcImJ1aWxkXCIsXG4gIFwicGRmLndvcmtlci5taW4ubWpzXCIsXG4pO1xuXG4vLyBDb252ZXJ0IGdvYWwgZGVzY3JpcHRpb24gbWFya2Rvd24gdG8gSFRNTFxuZnVuY3Rpb24gZ2V0RGVzY3JpcHRpb25IdG1sKGRlc2NyaXB0aW9uOiBzdHJpbmcpIHtcbiAgLy8gbm90ZTogZXNjYXBlZCBkZXNjcmlwdGlvbiBjYXVzZXMgaXNzdWVzIHdpdGggbWFya2Rvd24gcGFyc2luZ1xuICBjb25zdCBodG1sID0gbWFya2VkLnBhcnNlKGRlc2NyaXB0aW9uLCB7XG4gICAgYXN5bmM6IGZhbHNlLFxuICAgIGdmbTogdHJ1ZSxcbiAgICBicmVha3M6IHRydWUsXG4gIH0pO1xuICBjb25zdCBwdXJpZnkgPSBET01QdXJpZnkobmV3IEpTRE9NKFwiXCIpLndpbmRvdyk7XG4gIGNvbnN0IHNhbml0aXplZEh0bWwgPSBwdXJpZnkuc2FuaXRpemUoaHRtbCk7XG4gIHJldHVybiBKU09OLnN0cmluZ2lmeShzYW5pdGl6ZWRIdG1sKTtcbn1cblxuZnVuY3Rpb24gZ2V0UGx1Z2luQWxpYXNlcygpIHtcbiAgY29uc3QgcGx1Z2luc0RpciA9IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiYXBwc1wiKTtcbiAgLy8gTWFrZSBzdXJlIHRoZSBgYXBwc2AgZm9sZGVyIGV4aXN0c1xuICBpZiAoIWZzLmV4aXN0c1N5bmMocGx1Z2luc0RpcikpIHtcbiAgICByZXR1cm4ge307XG4gIH1cbiAgY29uc3QgcGx1Z2luRm9sZGVycyA9IGZzLnJlYWRkaXJTeW5jKHBsdWdpbnNEaXIpO1xuXG4gIGNvbnN0IGFsaWFzZXMgPSB7fTtcblxuICBwbHVnaW5Gb2xkZXJzLmZvckVhY2goKHBsdWdpbkZvbGRlcikgPT4ge1xuICAgIGNvbnN0IHBsdWdpblNyY1BhdGggPSBwYXRoLmpvaW4ocGx1Z2luc0RpciwgcGx1Z2luRm9sZGVyLCBcInNyY1wiKTtcbiAgICBpZiAoZnMuZXhpc3RzU3luYyhwbHVnaW5TcmNQYXRoKSkge1xuICAgICAgYWxpYXNlc1tgQGFwcHMvJHtwbHVnaW5Gb2xkZXJ9YF0gPSBwbHVnaW5TcmNQYXRoO1xuICAgICAgYWxpYXNlc1tgQGFwcC1tYW5pZmVzdC8ke3BsdWdpbkZvbGRlcn1gXSA9IHBhdGguam9pbihcbiAgICAgICAgcGx1Z2luU3JjUGF0aCxcbiAgICAgICAgXCJtYW5pZmVzdC50c1wiLFxuICAgICAgKTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBhbGlhc2VzO1xufVxuXG5mdW5jdGlvbiBnZXRQbHVnaW5EZXBlbmRlbmNpZXMoKTogc3RyaW5nW10ge1xuICBjb25zdCBwbHVnaW5zRGlyID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCJhcHBzXCIpO1xuICAvLyBNYWtlIHN1cmUgdGhlIGBhcHBzYCBmb2xkZXIgZXhpc3RzXG4gIGlmICghZnMuZXhpc3RzU3luYyhwbHVnaW5zRGlyKSkge1xuICAgIHJldHVybiBbXTtcbiAgfVxuICBjb25zdCBwbHVnaW5Gb2xkZXJzID0gZnMucmVhZGRpclN5bmMocGx1Z2luc0Rpcik7XG5cbiAgY29uc3QgZGVwZW5kZW5jaWVzID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgcGx1Z2luRm9sZGVycy5mb3JFYWNoKChwbHVnaW5Gb2xkZXIpID0+IHtcbiAgICBjb25zdCBwYWNrYWdlSnNvblBhdGggPSBwYXRoLmpvaW4ocGx1Z2luc0RpciwgcGx1Z2luRm9sZGVyLCBcInBhY2thZ2UuanNvblwiKTtcbiAgICBpZiAoZnMuZXhpc3RzU3luYyhwYWNrYWdlSnNvblBhdGgpKSB7XG4gICAgICBjb25zdCBwYWNrYWdlSnNvbiA9IEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKHBhY2thZ2VKc29uUGF0aCwgXCJ1dGY4XCIpKTtcbiAgICAgIGNvbnN0IHBsdWdpbkRlcGVuZGVuY2llcyA9IHBhY2thZ2VKc29uLmRlcGVuZGVuY2llc1xuICAgICAgICA/IE9iamVjdC5rZXlzKHBhY2thZ2VKc29uLmRlcGVuZGVuY2llcylcbiAgICAgICAgOiBbXTtcbiAgICAgIHBsdWdpbkRlcGVuZGVuY2llcy5mb3JFYWNoKChkZXApID0+IGRlcGVuZGVuY2llcy5hZGQoZGVwKSk7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gQXJyYXkuZnJvbShkZXBlbmRlbmNpZXMpO1xufVxuXG4vKiogQHR5cGUge2ltcG9ydCgndml0ZScpLlVzZXJDb25maWd9ICovXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiB7XG4gIGNvbnN0IGVudiA9IGxvYWRFbnYobW9kZSwgcHJvY2Vzcy5jd2QoKSwgXCJcIik7XG5cbiAgY29uc3QgY2RuVXJscyA9XG4gICAgZW52LlJFQUNUX0NETl9VUkxTIHx8XG4gICAgW1xuICAgICAgXCJodHRwczovL2Vnb3YtczMtZmFjaWxpdHktMTBiZWRpY3UuczMuYW1hem9uYXdzLmNvbVwiLFxuICAgICAgXCJodHRwczovL2Vnb3YtczMtcGF0aWVudC1kYXRhLTEwYmVkaWN1LnMzLmFtYXpvbmF3cy5jb21cIixcbiAgICAgIFwiaHR0cDovL2xvY2FsaG9zdDo0NTY2XCIsXG4gICAgXS5qb2luKFwiIFwiKTtcblxuICByZXR1cm4ge1xuICAgIGVudlByZWZpeDogXCJSRUFDVF9cIixcbiAgICBkZWZpbmU6IHtcbiAgICAgIF9fQ1VTVE9NX0RFU0NSSVBUSU9OX0hUTUxfXzogZ2V0RGVzY3JpcHRpb25IdG1sKFxuICAgICAgICBlbnYuUkVBQ1RfQ1VTVE9NX0RFU0NSSVBUSU9OIHx8IFwiXCIsXG4gICAgICApLFxuICAgIH0sXG4gICAgcGx1Z2luczogW1xuICAgICAgVmFsaWRhdGVFbnYoe1xuICAgICAgICB2YWxpZGF0b3I6IFwiem9kXCIsXG4gICAgICAgIHNjaGVtYToge1xuICAgICAgICAgIFJFQUNUX0NBUkVfQVBJX1VSTDogei5zdHJpbmcoKS51cmwoKSxcblxuICAgICAgICAgIFJFQUNUX1NFTlRSWV9EU046IHouc3RyaW5nKCkudXJsKCkub3B0aW9uYWwoKSxcbiAgICAgICAgICBSRUFDVF9TRU5UUllfRU5WSVJPTk1FTlQ6IHouc3RyaW5nKCkub3B0aW9uYWwoKSxcblxuICAgICAgICAgIFJFQUNUX1BMQVVTSUJMRV9TSVRFX0RPTUFJTjogelxuICAgICAgICAgICAgLnN0cmluZygpXG4gICAgICAgICAgICAucmVnZXgoL15bYS16QS1aMC05XVthLXpBLVowLTktXy5dKlxcLlthLXpBLVpdezIsfSQvKVxuICAgICAgICAgICAgLm9wdGlvbmFsKClcbiAgICAgICAgICAgIC5kZXNjcmliZShcIkRvbWFpbiBuYW1lIHdpdGhvdXQgcHJvdG9jb2wgKGUuZy4sIHN1Yi5kb21haW4uY29tKVwiKSxcblxuICAgICAgICAgIFJFQUNUX1BMQVVTSUJMRV9TRVJWRVJfVVJMOiB6LnN0cmluZygpLnVybCgpLm9wdGlvbmFsKCksXG4gICAgICAgICAgUkVBQ1RfQ0ROX1VSTFM6IHpcbiAgICAgICAgICAgIC5zdHJpbmcoKVxuICAgICAgICAgICAgLm9wdGlvbmFsKClcbiAgICAgICAgICAgIC50cmFuc2Zvcm0oKHZhbCkgPT4gdmFsPy5zcGxpdChcIiBcIikpXG4gICAgICAgICAgICAucGlwZSh6LmFycmF5KHouc3RyaW5nKCkudXJsKCkpLm9wdGlvbmFsKCkpXG4gICAgICAgICAgICAuZGVzY3JpYmUoXCJPcHRpb25hbDogU3BhY2Utc2VwYXJhdGVkIGxpc3Qgb2YgQ0ROIFVSTHNcIiksXG4gICAgICAgIH0sXG4gICAgICB9KSxcbiAgICAgIHZpdGVTdGF0aWNDb3B5KHtcbiAgICAgICAgdGFyZ2V0czogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogcGRmV29ya2VyUGF0aCxcbiAgICAgICAgICAgIGRlc3Q6IFwiXCIsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0pLFxuICAgICAgcmVhY3QoKSxcbiAgICAgIGNoZWNrZXIoeyB0eXBlc2NyaXB0OiB0cnVlIH0pLFxuICAgICAgdHJlZVNoYWtlQ2FyZUljb25zKHtcbiAgICAgICAgaWNvbldoaXRlbGlzdDogW1wiZGVmYXVsdFwiXSxcbiAgICAgIH0pLFxuICAgICAgVml0ZVBXQSh7XG4gICAgICAgIHN0cmF0ZWdpZXM6IFwiaW5qZWN0TWFuaWZlc3RcIixcbiAgICAgICAgc3JjRGlyOiBcInNyY1wiLFxuICAgICAgICBmaWxlbmFtZTogXCJzZXJ2aWNlLXdvcmtlci50c1wiLFxuICAgICAgICBpbmplY3RSZWdpc3RlcjogXCJzY3JpcHQtZGVmZXJcIixcbiAgICAgICAgZGV2T3B0aW9uczoge1xuICAgICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgdHlwZTogXCJtb2R1bGVcIixcbiAgICAgICAgfSxcbiAgICAgICAgaW5qZWN0TWFuaWZlc3Q6IHtcbiAgICAgICAgICBtYXhpbXVtRmlsZVNpemVUb0NhY2hlSW5CeXRlczogNzAwMDAwMCxcbiAgICAgICAgfSxcbiAgICAgICAgbWFuaWZlc3Q6IHtcbiAgICAgICAgICBuYW1lOiBcIkNhcmVcIixcbiAgICAgICAgICBzaG9ydF9uYW1lOiBcIkNhcmVcIixcbiAgICAgICAgICB0aGVtZV9jb2xvcjogXCIjMGU5ZjZlXCIsXG4gICAgICAgICAgYmFja2dyb3VuZF9jb2xvcjogXCIjZmZmZmZmXCIsXG4gICAgICAgICAgZGlzcGxheTogXCJzdGFuZGFsb25lXCIsXG4gICAgICAgICAgaWNvbnM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgc3JjOiBcImltYWdlcy9pY29ucy9wd2EtNjR4NjQucG5nXCIsXG4gICAgICAgICAgICAgIHNpemVzOiBcIjY0eDY0XCIsXG4gICAgICAgICAgICAgIHR5cGU6IFwiaW1hZ2UvcG5nXCIsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBzcmM6IFwiaW1hZ2VzL2ljb25zL3B3YS0xOTJ4MTkyLnBuZ1wiLFxuICAgICAgICAgICAgICBzaXplczogXCIxOTJ4MTkyXCIsXG4gICAgICAgICAgICAgIHR5cGU6IFwiaW1hZ2UvcG5nXCIsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBzcmM6IFwiaW1hZ2VzL2ljb25zL3B3YS01MTJ4NTEyLnBuZ1wiLFxuICAgICAgICAgICAgICBzaXplczogXCI1MTJ4NTEyXCIsXG4gICAgICAgICAgICAgIHR5cGU6IFwiaW1hZ2UvcG5nXCIsXG4gICAgICAgICAgICAgIHB1cnBvc2U6IFwiYW55XCIsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBzcmM6IFwiaW1hZ2VzL2ljb25zL21hc2thYmxlLWljb24tNTEyeDUxMi5wbmdcIixcbiAgICAgICAgICAgICAgc2l6ZXM6IFwiNTEyeDUxMlwiLFxuICAgICAgICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxuICAgICAgICAgICAgICBwdXJwb3NlOiBcIm1hc2thYmxlXCIsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICB9KSxcbiAgICBdLFxuICAgIHJlc29sdmU6IHtcbiAgICAgIGFsaWFzOiB7XG4gICAgICAgIC4uLmdldFBsdWdpbkFsaWFzZXMoKSxcbiAgICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXG4gICAgICAgIFwiQGNhcmVDb25maWdcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL2NhcmUuY29uZmlnLnRzXCIpLFxuICAgICAgICBcIkBjb3JlXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwic3JjL1wiKSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBvcHRpbWl6ZURlcHM6IHtcbiAgICAgIGluY2x1ZGU6IGdldFBsdWdpbkRlcGVuZGVuY2llcygpLFxuICAgIH0sXG4gICAgYnVpbGQ6IHtcbiAgICAgIG91dERpcjogXCJidWlsZFwiLFxuICAgICAgYXNzZXRzRGlyOiBcImJ1bmRsZVwiLFxuICAgICAgc291cmNlbWFwOiB0cnVlLFxuICAgICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgICBvdXRwdXQ6IHtcbiAgICAgICAgICBtYW51YWxDaHVua3MoaWQsIHsgZ2V0TW9kdWxlSW5mbyB9KSB7XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoXCJub2RlX21vZHVsZXNcIikpIHtcbiAgICAgICAgICAgICAgY29uc3QgbW9kdWxlSW5mbyA9IGdldE1vZHVsZUluZm8oaWQpO1xuXG4gICAgICAgICAgICAgIC8vIFJlY3Vyc2l2ZSBmdW5jdGlvbiB0byBjaGVjayBpZiB0aGUgbW9kdWxlIGlzIHN0YXRpY2FsbHkgaW1wb3J0ZWQgYnkgYW4gZW50cnkgcG9pbnRcbiAgICAgICAgICAgICAgZnVuY3Rpb24gaXNTdGF0aWNhbGx5SW1wb3J0ZWRCeUVudHJ5KFxuICAgICAgICAgICAgICAgIG1vZHVsZUlkLFxuICAgICAgICAgICAgICAgIHZpc2l0ZWQgPSBuZXcgU2V0KCksXG4gICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIGlmICh2aXNpdGVkLmhhcyhtb2R1bGVJZCkpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB2aXNpdGVkLmFkZChtb2R1bGVJZCk7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBtb2RJbmZvID0gZ2V0TW9kdWxlSW5mbyhtb2R1bGVJZCk7XG4gICAgICAgICAgICAgICAgaWYgKCFtb2RJbmZvKSByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICAvLyBDaGVjayBpZiB0aGUgbW9kdWxlIGlzIGFuIGVudHJ5IHBvaW50XG4gICAgICAgICAgICAgICAgaWYgKG1vZEluZm8uaXNFbnRyeSkge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gQ2hlY2sgYWxsIHN0YXRpYyBpbXBvcnRlcnNcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGltcG9ydGVySWQgb2YgbW9kSW5mby5pbXBvcnRlcnMpIHtcbiAgICAgICAgICAgICAgICAgIGlmIChpc1N0YXRpY2FsbHlJbXBvcnRlZEJ5RW50cnkoaW1wb3J0ZXJJZCwgdmlzaXRlZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgLy8gRGV0ZXJtaW5lIGlmIHRoZSBtb2R1bGUgc2hvdWxkIGJlIGluIHRoZSAndmVuZG9yJyBjaHVua1xuICAgICAgICAgICAgICBjb25zdCBtYW51YWxWZW5kb3JDaHVua3MgPSAvdGlueS1pbnZhcmlhbnQvO1xuICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgbWFudWFsVmVuZG9yQ2h1bmtzLnRlc3QoaWQpIHx8XG4gICAgICAgICAgICAgICAgaXNTdGF0aWNhbGx5SW1wb3J0ZWRCeUVudHJ5KGlkKVxuICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJ2ZW5kb3JcIjtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBncm91cCBsYXp5LWxvYWRlZCBkZXBlbmRlbmNpZXMgYnkgdGhlaXIgZHluYW1pYyBpbXBvcnRlclxuICAgICAgICAgICAgICAgIGNvbnN0IGR5bmFtaWNJbXBvcnRlcnMgPSBtb2R1bGVJbmZvPy5keW5hbWljSW1wb3J0ZXJzIHx8IFtdO1xuICAgICAgICAgICAgICAgIGlmIChkeW5hbWljSW1wb3J0ZXJzICYmIGR5bmFtaWNJbXBvcnRlcnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgLy8gVXNlIHRoZSBmaXJzdCBkeW5hbWljIGltcG9ydGVyIHRvIG5hbWUgdGhlIGNodW5rXG4gICAgICAgICAgICAgICAgICBjb25zdCBpbXBvcnRlckNodW5rTmFtZSA9IGR5bmFtaWNJbXBvcnRlcnNbMF1cbiAgICAgICAgICAgICAgICAgICAgPyBkeW5hbWljSW1wb3J0ZXJzWzBdLnNwbGl0KFwiL1wiKS5wb3AoKVxuICAgICAgICAgICAgICAgICAgICA6IFwidmVuZG9yXCIuc3BsaXQoXCIuXCIpWzBdO1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIGBjaHVuay0ke2ltcG9ydGVyQ2h1bmtOYW1lfWA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIElmIG5vIGR5bmFtaWMgaW1wb3J0ZXJzIGFyZSBmb3VuZCwgbGV0IFJvbGx1cCBoYW5kbGUgaXQgYXV0b21hdGljYWxseVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBzZXJ2ZXI6IHtcbiAgICAgIHBvcnQ6IDQwMDAsXG4gICAgfSxcbiAgICBwcmV2aWV3OiB7XG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIFwiQ29udGVudC1TZWN1cml0eS1Qb2xpY3ktUmVwb3J0LU9ubHlcIjogYGRlZmF1bHQtc3JjICdzZWxmJztcXFxuICAgICAgICBzY3JpcHQtc3JjICdzZWxmJyBibG9iOiAnbm9uY2UtZjUxYjk3NDInIGh0dHBzOi8vcGxhdXNpYmxlLjEwYmVkaWN1LmluO1xcXG4gICAgICAgIHN0eWxlLXNyYyAnc2VsZicgJ3Vuc2FmZS1pbmxpbmUnO1xcXG4gICAgICAgIGNvbm5lY3Qtc3JjICdzZWxmJyBodHRwczovL3BsYXVzaWJsZS4xMGJlZGljdS5pbjtcXFxuICAgICAgICBpbWctc3JjICdzZWxmJyBodHRwczovL2Nkbi5vaGMubmV0d29yayAke2NkblVybHN9O1xcXG4gICAgICAgIG9iamVjdC1zcmMgJ3NlbGYnICR7Y2RuVXJsc307YCxcbiAgICAgIH0sXG4gICAgICBwb3J0OiA0MDAwLFxuICAgIH0sXG4gIH07XG59KTtcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL2hvbWUva2lzaGFuMjUxOGIvRGVza3RvcC9jYXJlX2ZlL3BsdWdpbnNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9ob21lL2tpc2hhbjI1MThiL0Rlc2t0b3AvY2FyZV9mZS9wbHVnaW5zL3RyZWVTaGFrZUNhcmVJY29ucy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vaG9tZS9raXNoYW4yNTE4Yi9EZXNrdG9wL2NhcmVfZmUvcGx1Z2lucy90cmVlU2hha2VDYXJlSWNvbnMudHNcIjtpbXBvcnQgKiBhcyBmcyBmcm9tIFwiZnNcIjtcbmltcG9ydCB7IGdsb2JTeW5jIH0gZnJvbSBcImdsb2JcIjtcbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IFBsdWdpbiB9IGZyb20gXCJ2aXRlXCI7XG5cbi8qKlxuICogSW50ZXJmYWNlIGRlZmluaW5nIG9wdGlvbnMgZm9yIHRoZSB0cmVlU2hha2VVbmljb25QYXRoc1BsdWdpbi5cbiAqXG4gKiBAaW50ZXJmYWNlIFRyZWVTaGFrZVVuaWNvblBhdGhzUGx1Z2luT3B0aW9uc1xuICogQHByb3BlcnR5IHtzdHJpbmdbXX0gaWNvbldoaXRlbGlzdCAtIEFuIGFycmF5IG9mIGljb24gbmFtZXMgdG8gYWx3YXlzIGluY2x1ZGUsIGV2ZW4gaWYgbm90IGZvdW5kIGluIGNvZGUuXG4gKi9cblxuZXhwb3J0IGludGVyZmFjZSBUcmVlU2hha2VDYXJlSWNvbnNPcHRpb25zIHtcbiAgaWNvbldoaXRlbGlzdDogc3RyaW5nW107XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIFdlYnBhY2sgcGx1Z2luIHRoYXQgdHJlZS1zaGFrZXMgdW51c2VkIFVuaWNvbiBwYXRocyBmcm9tIFVuaWNvblBhdGhzLmpzb24gaW4gcHJvZHVjdGlvbiBidWlsZHMuXG4gKlxuICogQHBhcmFtIHtUcmVlU2hha2VDYXJlSWNvbnNPcHRpb25zfSBbb3B0aW9uc10gLSBPcHRpb25hbCBjb25maWd1cmF0aW9uIG9wdGlvbnMuIERlZmF1bHRzIHRvIGFuIGVtcHR5IGljb25XaGl0ZWxpc3QuXG4gKiBAcmV0dXJucyB7UGx1Z2lufSBXZWJwYWNrIHBsdWdpbiBvYmplY3QuXG4gKi9cblxuZXhwb3J0IGZ1bmN0aW9uIHRyZWVTaGFrZUNhcmVJY29ucyhcbiAgb3B0aW9uczogVHJlZVNoYWtlQ2FyZUljb25zT3B0aW9ucyA9IHsgaWNvbldoaXRlbGlzdDogW10gfSxcbik6IFBsdWdpbiB7XG4gIGNvbnN0IHJvb3REaXIgPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4uXCIpOyAvLyB1cGRhdGUgdGhpcyBpZiBtb3ZpbmcgdGhpcyBjb2RlIHRvIGEgZGlmZmVyZW50IGZpbGVcbiAgY29uc3QgbGluZUljb25OYW1lUmVnZXggPSAvXCJsLVthLXpdKyg/Oi1bYS16XSspKlwiL2c7XG4gIGNvbnN0IGFsbFVuaWNvblBhdGhzID0gSlNPTi5wYXJzZShcbiAgICBmcy5yZWFkRmlsZVN5bmMoXG4gICAgICBwYXRoLnJlc29sdmUocm9vdERpciwgXCJzcmMvQ0FSRVVJL2ljb25zL1VuaWNvblBhdGhzLmpzb25cIiksXG4gICAgICBcInV0ZjhcIixcbiAgICApLFxuICApO1xuXG4gIC8vIEV4dHJhY3RzIGljb24gbmFtZXMgZnJvbSBhIGdpdmVuIGZpbGUncyBjb250ZW50LlxuICAvLyBSZXR1cm5zIGFuIGFycmF5IG9mIGljb24gbmFtZXMgbGlrZSBbXCJsLWV5ZVwiLCBcImwtc3luY1wiLCBcImwtaGVhcmJlYXRcIl1cbiAgZnVuY3Rpb24gZXh0cmFjdENhcmVJY29uTmFtZXMoZmlsZTogc3RyaW5nKTogc3RyaW5nW10ge1xuICAgIGNvbnN0IGZpbGVDb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKGZpbGUsIFwidXRmOFwiKTtcblxuICAgIGNvbnN0IGxpbmVJY29uTmFtZU1hdGNoZXMgPSBmaWxlQ29udGVudC5tYXRjaChsaW5lSWNvbk5hbWVSZWdleCkgfHwgW107XG5cbiAgICBjb25zdCBsaW5lSWNvbk5hbWVzID0gbGluZUljb25OYW1lTWF0Y2hlcy5tYXAoXG4gICAgICAobGluZUljb25OYW1lKSA9PiBsaW5lSWNvbk5hbWUuc2xpY2UoMSwgLTEpLCAvLyByZW1vdmUgcXVvdGVzXG4gICAgKTtcblxuICAgIHJldHVybiBsaW5lSWNvbk5hbWVzO1xuICB9XG4gIC8vIEZpbmRzIGFsbCB1c2VkIGljb24gbmFtZXMgd2l0aGluIHRoZSBwcm9qZWN0J3Mgc291cmNlIGZpbGVzIChgLnRzeGAgb3IgYC5yZXNgIGV4dGVuc2lvbnMpLlxuICBmdW5jdGlvbiBnZXRBbGxVc2VkSWNvbk5hbWVzKCkge1xuICAgIGNvbnN0IGZpbGVzID0gZ2xvYlN5bmMocGF0aC5yZXNvbHZlKHJvb3REaXIsIFwie2FwcHMsc3JjfS8qKi8qLnt0c3gscmVzfVwiKSk7XG4gICAgY29uc3QgdXNlZEljb25zQXJyYXk6IHN0cmluZ1tdID0gW107XG5cbiAgICBmaWxlcy5mb3JFYWNoKChmaWxlKSA9PiB7XG4gICAgICBjb25zdCBpY29uTmFtZXMgPSBleHRyYWN0Q2FyZUljb25OYW1lcyhmaWxlKTtcbiAgICAgIHVzZWRJY29uc0FycmF5LnB1c2goLi4uaWNvbk5hbWVzKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBuZXcgU2V0KHVzZWRJY29uc0FycmF5KTtcbiAgfVxuICAvLyBHZW5lcmF0ZXMgYSBtYXAgb2YgdXNlZCBpY29uIG5hbWVzIHRvIHRoZWlyIHBhdGhzIGZyb20gVW5pY29uUGF0aHMuanNvbiwgaW5jbHVkaW5nIGFueSB3aGl0ZWxpc3RlZCBpY29ucy5cbiAgZnVuY3Rpb24gZ2V0VHJlZVNoYWtlblVuaWNvblBhdGhzKCkge1xuICAgIGNvbnN0IHVzZWRJY29ucyA9IFsuLi5nZXRBbGxVc2VkSWNvbk5hbWVzKCksIC4uLm9wdGlvbnMuaWNvbldoaXRlbGlzdF07XG4gICAgY29uc3QgdHJlZXNoYWtlbkNhcmVJY29uUGF0aHMgPSB7fTtcblxuICAgIGZvciAoY29uc3QgaWNvbk5hbWUgb2YgdXNlZEljb25zKSB7XG4gICAgICBjb25zdCBwYXRoID0gYWxsVW5pY29uUGF0aHNbaWNvbk5hbWVdO1xuICAgICAgaWYgKHBhdGggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEljb24gJHtpY29uTmFtZX0gaXMgbm90IGZvdW5kIGluIFVuaWNvblBhdGhzLmpzb25gKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRyZWVzaGFrZW5DYXJlSWNvblBhdGhzW2ljb25OYW1lXSA9IHBhdGg7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRyZWVzaGFrZW5DYXJlSWNvblBhdGhzO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBuYW1lOiBcInRyZWUtc2hha2UtY2FyZS1pY29uc1wiLFxuICAgIHRyYW5zZm9ybShfc3JjLCBpZCkge1xuICAgICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIFJlcGxhY2UgdGhlIFVuaWNvblBhdGhzIHdpdGggdGhlIHRyZWUtc2hha2VuIHZlcnNpb25cbiAgICAgIGlmIChpZC5lbmRzV2l0aChcIlVuaWNvblBhdGhzLmpzb25cIikpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBjb2RlOiBgZXhwb3J0IGRlZmF1bHQgJHtKU09OLnN0cmluZ2lmeShnZXRUcmVlU2hha2VuVW5pY29uUGF0aHMoKSl9YCxcbiAgICAgICAgICBtYXA6IG51bGwsXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfSxcbiAgfTtcbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBdVIsU0FBUyxtQkFBbUI7QUFDblQsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sZUFBZTtBQUN0QixPQUFPQSxTQUFRO0FBQ2YsU0FBUyxhQUFhO0FBQ3RCLFNBQVMsY0FBYztBQUN2QixTQUFTLHFCQUFxQjtBQUM5QixPQUFPQyxXQUFVO0FBQ2pCLFNBQVMsY0FBYyxlQUFlO0FBQ3RDLE9BQU8sYUFBYTtBQUNwQixTQUFTLGVBQWU7QUFDeEIsU0FBUyxzQkFBc0I7QUFDL0IsU0FBUyxTQUFTOzs7QUNaeVMsWUFBWSxRQUFRO0FBQy9VLFNBQVMsZ0JBQWdCO0FBQ3pCLFlBQVksVUFBVTtBQUZ0QixJQUFNLG1DQUFtQztBQXVCbEMsU0FBUyxtQkFDZCxVQUFxQyxFQUFFLGVBQWUsQ0FBQyxFQUFFLEdBQ2pEO0FBQ1IsUUFBTSxVQUFlLGFBQVEsa0NBQVcsSUFBSTtBQUM1QyxRQUFNLG9CQUFvQjtBQUMxQixRQUFNLGlCQUFpQixLQUFLO0FBQUEsSUFDdkI7QUFBQSxNQUNJLGFBQVEsU0FBUyxtQ0FBbUM7QUFBQSxNQUN6RDtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBSUEsV0FBUyxxQkFBcUIsTUFBd0I7QUFDcEQsVUFBTSxjQUFpQixnQkFBYSxNQUFNLE1BQU07QUFFaEQsVUFBTSxzQkFBc0IsWUFBWSxNQUFNLGlCQUFpQixLQUFLLENBQUM7QUFFckUsVUFBTSxnQkFBZ0Isb0JBQW9CO0FBQUEsTUFDeEMsQ0FBQyxpQkFBaUIsYUFBYSxNQUFNLEdBQUcsRUFBRTtBQUFBO0FBQUEsSUFDNUM7QUFFQSxXQUFPO0FBQUEsRUFDVDtBQUVBLFdBQVMsc0JBQXNCO0FBQzdCLFVBQU0sUUFBUSxTQUFjLGFBQVEsU0FBUywyQkFBMkIsQ0FBQztBQUN6RSxVQUFNLGlCQUEyQixDQUFDO0FBRWxDLFVBQU0sUUFBUSxDQUFDLFNBQVM7QUFDdEIsWUFBTSxZQUFZLHFCQUFxQixJQUFJO0FBQzNDLHFCQUFlLEtBQUssR0FBRyxTQUFTO0FBQUEsSUFDbEMsQ0FBQztBQUVELFdBQU8sSUFBSSxJQUFJLGNBQWM7QUFBQSxFQUMvQjtBQUVBLFdBQVMsMkJBQTJCO0FBQ2xDLFVBQU0sWUFBWSxDQUFDLEdBQUcsb0JBQW9CLEdBQUcsR0FBRyxRQUFRLGFBQWE7QUFDckUsVUFBTSwwQkFBMEIsQ0FBQztBQUVqQyxlQUFXLFlBQVksV0FBVztBQUNoQyxZQUFNQyxRQUFPLGVBQWUsUUFBUTtBQUNwQyxVQUFJQSxVQUFTLFFBQVc7QUFDdEIsY0FBTSxJQUFJLE1BQU0sUUFBUSxRQUFRLG1DQUFtQztBQUFBLE1BQ3JFLE9BQU87QUFDTCxnQ0FBd0IsUUFBUSxJQUFJQTtBQUFBLE1BQ3RDO0FBQUEsSUFDRjtBQUVBLFdBQU87QUFBQSxFQUNUO0FBRUEsU0FBTztBQUFBLElBQ0wsTUFBTTtBQUFBLElBQ04sVUFBVSxNQUFNLElBQUk7QUFDbEIsVUFBSSxRQUFRLElBQUksYUFBYSxjQUFjO0FBQ3pDO0FBQUEsTUFDRjtBQUdBLFVBQUksR0FBRyxTQUFTLGtCQUFrQixHQUFHO0FBQ25DLGVBQU87QUFBQSxVQUNMLE1BQU0sa0JBQWtCLEtBQUssVUFBVSx5QkFBeUIsQ0FBQyxDQUFDO0FBQUEsVUFDbEUsS0FBSztBQUFBLFFBQ1A7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRjs7O0FEN0ZBLElBQU1DLG9DQUFtQztBQUFrSSxJQUFNLDJDQUEyQztBQWdCNU4sSUFBTSxnQkFBZ0JDLE1BQUs7QUFBQSxFQUN6QkEsTUFBSztBQUFBLElBQ0gsY0FBYyx3Q0FBZSxFQUFFLFFBQVEseUJBQXlCO0FBQUEsRUFDbEU7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUNGO0FBR0EsU0FBUyxtQkFBbUIsYUFBcUI7QUFFL0MsUUFBTSxPQUFPLE9BQU8sTUFBTSxhQUFhO0FBQUEsSUFDckMsT0FBTztBQUFBLElBQ1AsS0FBSztBQUFBLElBQ0wsUUFBUTtBQUFBLEVBQ1YsQ0FBQztBQUNELFFBQU0sU0FBUyxVQUFVLElBQUksTUFBTSxFQUFFLEVBQUUsTUFBTTtBQUM3QyxRQUFNLGdCQUFnQixPQUFPLFNBQVMsSUFBSTtBQUMxQyxTQUFPLEtBQUssVUFBVSxhQUFhO0FBQ3JDO0FBRUEsU0FBUyxtQkFBbUI7QUFDMUIsUUFBTSxhQUFhQSxNQUFLLFFBQVFDLG1DQUFXLE1BQU07QUFFakQsTUFBSSxDQUFDQyxJQUFHLFdBQVcsVUFBVSxHQUFHO0FBQzlCLFdBQU8sQ0FBQztBQUFBLEVBQ1Y7QUFDQSxRQUFNLGdCQUFnQkEsSUFBRyxZQUFZLFVBQVU7QUFFL0MsUUFBTSxVQUFVLENBQUM7QUFFakIsZ0JBQWMsUUFBUSxDQUFDLGlCQUFpQjtBQUN0QyxVQUFNLGdCQUFnQkYsTUFBSyxLQUFLLFlBQVksY0FBYyxLQUFLO0FBQy9ELFFBQUlFLElBQUcsV0FBVyxhQUFhLEdBQUc7QUFDaEMsY0FBUSxTQUFTLFlBQVksRUFBRSxJQUFJO0FBQ25DLGNBQVEsaUJBQWlCLFlBQVksRUFBRSxJQUFJRixNQUFLO0FBQUEsUUFDOUM7QUFBQSxRQUNBO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGLENBQUM7QUFFRCxTQUFPO0FBQ1Q7QUFFQSxTQUFTLHdCQUFrQztBQUN6QyxRQUFNLGFBQWFBLE1BQUssUUFBUUMsbUNBQVcsTUFBTTtBQUVqRCxNQUFJLENBQUNDLElBQUcsV0FBVyxVQUFVLEdBQUc7QUFDOUIsV0FBTyxDQUFDO0FBQUEsRUFDVjtBQUNBLFFBQU0sZ0JBQWdCQSxJQUFHLFlBQVksVUFBVTtBQUUvQyxRQUFNLGVBQWUsb0JBQUksSUFBWTtBQUVyQyxnQkFBYyxRQUFRLENBQUMsaUJBQWlCO0FBQ3RDLFVBQU0sa0JBQWtCRixNQUFLLEtBQUssWUFBWSxjQUFjLGNBQWM7QUFDMUUsUUFBSUUsSUFBRyxXQUFXLGVBQWUsR0FBRztBQUNsQyxZQUFNLGNBQWMsS0FBSyxNQUFNQSxJQUFHLGFBQWEsaUJBQWlCLE1BQU0sQ0FBQztBQUN2RSxZQUFNLHFCQUFxQixZQUFZLGVBQ25DLE9BQU8sS0FBSyxZQUFZLFlBQVksSUFDcEMsQ0FBQztBQUNMLHlCQUFtQixRQUFRLENBQUMsUUFBUSxhQUFhLElBQUksR0FBRyxDQUFDO0FBQUEsSUFDM0Q7QUFBQSxFQUNGLENBQUM7QUFFRCxTQUFPLE1BQU0sS0FBSyxZQUFZO0FBQ2hDO0FBR0EsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE1BQU07QUFDeEMsUUFBTSxNQUFNLFFBQVEsTUFBTSxRQUFRLElBQUksR0FBRyxFQUFFO0FBRTNDLFFBQU0sVUFDSixJQUFJLGtCQUNKO0FBQUEsSUFDRTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDRixFQUFFLEtBQUssR0FBRztBQUVaLFNBQU87QUFBQSxJQUNMLFdBQVc7QUFBQSxJQUNYLFFBQVE7QUFBQSxNQUNOLDZCQUE2QjtBQUFBLFFBQzNCLElBQUksNEJBQTRCO0FBQUEsTUFDbEM7QUFBQSxJQUNGO0FBQUEsSUFDQSxTQUFTO0FBQUEsTUFDUCxZQUFZO0FBQUEsUUFDVixXQUFXO0FBQUEsUUFDWCxRQUFRO0FBQUEsVUFDTixvQkFBb0IsRUFBRSxPQUFPLEVBQUUsSUFBSTtBQUFBLFVBRW5DLGtCQUFrQixFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsU0FBUztBQUFBLFVBQzVDLDBCQUEwQixFQUFFLE9BQU8sRUFBRSxTQUFTO0FBQUEsVUFFOUMsNkJBQTZCLEVBQzFCLE9BQU8sRUFDUCxNQUFNLDRDQUE0QyxFQUNsRCxTQUFTLEVBQ1QsU0FBUyxxREFBcUQ7QUFBQSxVQUVqRSw0QkFBNEIsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLFNBQVM7QUFBQSxVQUN0RCxnQkFBZ0IsRUFDYixPQUFPLEVBQ1AsU0FBUyxFQUNULFVBQVUsQ0FBQyxRQUFRLEtBQUssTUFBTSxHQUFHLENBQUMsRUFDbEMsS0FBSyxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLEVBQUUsU0FBUyxDQUFDLEVBQ3pDLFNBQVMsNENBQTRDO0FBQUEsUUFDMUQ7QUFBQSxNQUNGLENBQUM7QUFBQSxNQUNELGVBQWU7QUFBQSxRQUNiLFNBQVM7QUFBQSxVQUNQO0FBQUEsWUFDRSxLQUFLO0FBQUEsWUFDTCxNQUFNO0FBQUEsVUFDUjtBQUFBLFFBQ0Y7QUFBQSxNQUNGLENBQUM7QUFBQSxNQUNELE1BQU07QUFBQSxNQUNOLFFBQVEsRUFBRSxZQUFZLEtBQUssQ0FBQztBQUFBLE1BQzVCLG1CQUFtQjtBQUFBLFFBQ2pCLGVBQWUsQ0FBQyxTQUFTO0FBQUEsTUFDM0IsQ0FBQztBQUFBLE1BQ0QsUUFBUTtBQUFBLFFBQ04sWUFBWTtBQUFBLFFBQ1osUUFBUTtBQUFBLFFBQ1IsVUFBVTtBQUFBLFFBQ1YsZ0JBQWdCO0FBQUEsUUFDaEIsWUFBWTtBQUFBLFVBQ1YsU0FBUztBQUFBLFVBQ1QsTUFBTTtBQUFBLFFBQ1I7QUFBQSxRQUNBLGdCQUFnQjtBQUFBLFVBQ2QsK0JBQStCO0FBQUEsUUFDakM7QUFBQSxRQUNBLFVBQVU7QUFBQSxVQUNSLE1BQU07QUFBQSxVQUNOLFlBQVk7QUFBQSxVQUNaLGFBQWE7QUFBQSxVQUNiLGtCQUFrQjtBQUFBLFVBQ2xCLFNBQVM7QUFBQSxVQUNULE9BQU87QUFBQSxZQUNMO0FBQUEsY0FDRSxLQUFLO0FBQUEsY0FDTCxPQUFPO0FBQUEsY0FDUCxNQUFNO0FBQUEsWUFDUjtBQUFBLFlBQ0E7QUFBQSxjQUNFLEtBQUs7QUFBQSxjQUNMLE9BQU87QUFBQSxjQUNQLE1BQU07QUFBQSxZQUNSO0FBQUEsWUFDQTtBQUFBLGNBQ0UsS0FBSztBQUFBLGNBQ0wsT0FBTztBQUFBLGNBQ1AsTUFBTTtBQUFBLGNBQ04sU0FBUztBQUFBLFlBQ1g7QUFBQSxZQUNBO0FBQUEsY0FDRSxLQUFLO0FBQUEsY0FDTCxPQUFPO0FBQUEsY0FDUCxNQUFNO0FBQUEsY0FDTixTQUFTO0FBQUEsWUFDWDtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQUEsTUFDRixDQUFDO0FBQUEsSUFDSDtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1AsT0FBTztBQUFBLFFBQ0wsR0FBRyxpQkFBaUI7QUFBQSxRQUNwQixLQUFLRixNQUFLLFFBQVFDLG1DQUFXLE9BQU87QUFBQSxRQUNwQyxlQUFlRCxNQUFLLFFBQVFDLG1DQUFXLGtCQUFrQjtBQUFBLFFBQ3pELFNBQVNELE1BQUssUUFBUUMsbUNBQVcsTUFBTTtBQUFBLE1BQ3pDO0FBQUEsSUFDRjtBQUFBLElBQ0EsY0FBYztBQUFBLE1BQ1osU0FBUyxzQkFBc0I7QUFBQSxJQUNqQztBQUFBLElBQ0EsT0FBTztBQUFBLE1BQ0wsUUFBUTtBQUFBLE1BQ1IsV0FBVztBQUFBLE1BQ1gsV0FBVztBQUFBLE1BQ1gsZUFBZTtBQUFBLFFBQ2IsUUFBUTtBQUFBLFVBQ04sYUFBYSxJQUFJLEVBQUUsY0FBYyxHQUFHO0FBQ2xDLGdCQUFJLEdBQUcsU0FBUyxjQUFjLEdBQUc7QUFJL0Isa0JBQVNFLCtCQUFULFNBQ0UsVUFDQSxVQUFVLG9CQUFJLElBQUksR0FDbEI7QUFDQSxvQkFBSSxRQUFRLElBQUksUUFBUSxFQUFHLFFBQU87QUFDbEMsd0JBQVEsSUFBSSxRQUFRO0FBRXBCLHNCQUFNLFVBQVUsY0FBYyxRQUFRO0FBQ3RDLG9CQUFJLENBQUMsUUFBUyxRQUFPO0FBR3JCLG9CQUFJLFFBQVEsU0FBUztBQUNuQix5QkFBTztBQUFBLGdCQUNUO0FBR0EsMkJBQVcsY0FBYyxRQUFRLFdBQVc7QUFDMUMsc0JBQUlBLDZCQUE0QixZQUFZLE9BQU8sR0FBRztBQUNwRCwyQkFBTztBQUFBLGtCQUNUO0FBQUEsZ0JBQ0Y7QUFFQSx1QkFBTztBQUFBLGNBQ1Q7QUF2QlMsZ0RBQUFBO0FBSFQsb0JBQU0sYUFBYSxjQUFjLEVBQUU7QUE2Qm5DLG9CQUFNLHFCQUFxQjtBQUMzQixrQkFDRSxtQkFBbUIsS0FBSyxFQUFFLEtBQzFCQSw2QkFBNEIsRUFBRSxHQUM5QjtBQUNBLHVCQUFPO0FBQUEsY0FDVCxPQUFPO0FBRUwsc0JBQU0sbUJBQW1CLFlBQVksb0JBQW9CLENBQUM7QUFDMUQsb0JBQUksb0JBQW9CLGlCQUFpQixTQUFTLEdBQUc7QUFFbkQsd0JBQU0sb0JBQW9CLGlCQUFpQixDQUFDLElBQ3hDLGlCQUFpQixDQUFDLEVBQUUsTUFBTSxHQUFHLEVBQUUsSUFBSSxJQUNuQyxTQUFTLE1BQU0sR0FBRyxFQUFFLENBQUM7QUFDekIseUJBQU8sU0FBUyxpQkFBaUI7QUFBQSxnQkFDbkM7QUFBQSxjQUVGO0FBQUEsWUFDRjtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxJQUNBLFFBQVE7QUFBQSxNQUNOLE1BQU07QUFBQSxJQUNSO0FBQUEsSUFDQSxTQUFTO0FBQUEsTUFDUCxTQUFTO0FBQUEsUUFDUCx1Q0FBdUMsc1BBSUUsT0FBTyw4QkFDNUIsT0FBTztBQUFBLE1BQzdCO0FBQUEsTUFDQSxNQUFNO0FBQUEsSUFDUjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogWyJmcyIsICJwYXRoIiwgInBhdGgiLCAiX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUiLCAicGF0aCIsICJfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSIsICJmcyIsICJpc1N0YXRpY2FsbHlJbXBvcnRlZEJ5RW50cnkiXQp9Cg==
