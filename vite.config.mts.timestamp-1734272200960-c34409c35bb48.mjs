// vite.config.mts
import { ValidateEnv } from "file:///D:/dev/New%20folder/care_fe/node_modules/@julr/vite-plugin-validate-env/dist/index.mjs";
import react from "file:///D:/dev/New%20folder/care_fe/node_modules/@vitejs/plugin-react-swc/index.mjs";
import DOMPurify from "file:///D:/dev/New%20folder/care_fe/node_modules/dompurify/dist/purify.cjs.js";
import fs2 from "fs";
import { JSDOM } from "file:///D:/dev/New%20folder/care_fe/node_modules/jsdom/lib/api.js";
import { marked } from "file:///D:/dev/New%20folder/care_fe/node_modules/marked/lib/marked.esm.js";
import { createRequire } from "node:module";
import path2 from "path";
import { defineConfig, loadEnv } from "file:///D:/dev/New%20folder/care_fe/node_modules/vite/dist/node/index.js";
import checker from "file:///D:/dev/New%20folder/care_fe/node_modules/vite-plugin-checker/dist/esm/main.js";
import { VitePWA } from "file:///D:/dev/New%20folder/care_fe/node_modules/vite-plugin-pwa/dist/index.js";
import { viteStaticCopy } from "file:///D:/dev/New%20folder/care_fe/node_modules/vite-plugin-static-copy/dist/index.js";
import { z } from "file:///D:/dev/New%20folder/care_fe/node_modules/zod/lib/index.mjs";

// plugins/treeShakeCareIcons.ts
import * as fs from "fs";
import { globSync } from "file:///D:/dev/New%20folder/care_fe/node_modules/glob/dist/esm/index.js";
import * as path from "path";
var __vite_injected_original_dirname = "D:\\dev\\New folder\\care_fe\\plugins";
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
var __vite_injected_original_dirname2 = "D:\\dev\\New folder\\care_fe";
var __vite_injected_original_import_meta_url = "file:///D:/dev/New%20folder/care_fe/vite.config.mts";
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcubXRzIiwgInBsdWdpbnMvdHJlZVNoYWtlQ2FyZUljb25zLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRDpcXFxcZGV2XFxcXE5ldyBmb2xkZXJcXFxcY2FyZV9mZVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcZGV2XFxcXE5ldyBmb2xkZXJcXFxcY2FyZV9mZVxcXFx2aXRlLmNvbmZpZy5tdHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L2Rldi9OZXclMjBmb2xkZXIvY2FyZV9mZS92aXRlLmNvbmZpZy5tdHNcIjtpbXBvcnQgeyBWYWxpZGF0ZUVudiB9IGZyb20gXCJAanVsci92aXRlLXBsdWdpbi12YWxpZGF0ZS1lbnZcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcclxuaW1wb3J0IERPTVB1cmlmeSBmcm9tIFwiZG9tcHVyaWZ5XCI7XHJcbmltcG9ydCBmcyBmcm9tIFwiZnNcIjtcclxuaW1wb3J0IHsgSlNET00gfSBmcm9tIFwianNkb21cIjtcclxuaW1wb3J0IHsgbWFya2VkIH0gZnJvbSBcIm1hcmtlZFwiO1xyXG5pbXBvcnQgeyBjcmVhdGVSZXF1aXJlIH0gZnJvbSBcIm5vZGU6bW9kdWxlXCI7XHJcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XHJcbmltcG9ydCB7IGRlZmluZUNvbmZpZywgbG9hZEVudiB9IGZyb20gXCJ2aXRlXCI7XHJcbmltcG9ydCBjaGVja2VyIGZyb20gXCJ2aXRlLXBsdWdpbi1jaGVja2VyXCI7XHJcbmltcG9ydCB7IFZpdGVQV0EgfSBmcm9tIFwidml0ZS1wbHVnaW4tcHdhXCI7XHJcbmltcG9ydCB7IHZpdGVTdGF0aWNDb3B5IH0gZnJvbSBcInZpdGUtcGx1Z2luLXN0YXRpYy1jb3B5XCI7XHJcbmltcG9ydCB7IHogfSBmcm9tIFwiem9kXCI7XHJcblxyXG5pbXBvcnQgeyB0cmVlU2hha2VDYXJlSWNvbnMgfSBmcm9tIFwiLi9wbHVnaW5zL3RyZWVTaGFrZUNhcmVJY29uc1wiO1xyXG5cclxuY29uc3QgcGRmV29ya2VyUGF0aCA9IHBhdGguam9pbihcclxuICBwYXRoLmRpcm5hbWUoXHJcbiAgICBjcmVhdGVSZXF1aXJlKGltcG9ydC5tZXRhLnVybCkucmVzb2x2ZShcInBkZmpzLWRpc3QvcGFja2FnZS5qc29uXCIpLFxyXG4gICksXHJcbiAgXCJidWlsZFwiLFxyXG4gIFwicGRmLndvcmtlci5taW4ubWpzXCIsXHJcbik7XHJcblxyXG4vLyBDb252ZXJ0IGdvYWwgZGVzY3JpcHRpb24gbWFya2Rvd24gdG8gSFRNTFxyXG5mdW5jdGlvbiBnZXREZXNjcmlwdGlvbkh0bWwoZGVzY3JpcHRpb246IHN0cmluZykge1xyXG4gIC8vIG5vdGU6IGVzY2FwZWQgZGVzY3JpcHRpb24gY2F1c2VzIGlzc3VlcyB3aXRoIG1hcmtkb3duIHBhcnNpbmdcclxuICBjb25zdCBodG1sID0gbWFya2VkLnBhcnNlKGRlc2NyaXB0aW9uLCB7XHJcbiAgICBhc3luYzogZmFsc2UsXHJcbiAgICBnZm06IHRydWUsXHJcbiAgICBicmVha3M6IHRydWUsXHJcbiAgfSk7XHJcbiAgY29uc3QgcHVyaWZ5ID0gRE9NUHVyaWZ5KG5ldyBKU0RPTShcIlwiKS53aW5kb3cpO1xyXG4gIGNvbnN0IHNhbml0aXplZEh0bWwgPSBwdXJpZnkuc2FuaXRpemUoaHRtbCk7XHJcbiAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHNhbml0aXplZEh0bWwpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRQbHVnaW5BbGlhc2VzKCkge1xyXG4gIGNvbnN0IHBsdWdpbnNEaXIgPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcImFwcHNcIik7XHJcbiAgLy8gTWFrZSBzdXJlIHRoZSBgYXBwc2AgZm9sZGVyIGV4aXN0c1xyXG4gIGlmICghZnMuZXhpc3RzU3luYyhwbHVnaW5zRGlyKSkge1xyXG4gICAgcmV0dXJuIHt9O1xyXG4gIH1cclxuICBjb25zdCBwbHVnaW5Gb2xkZXJzID0gZnMucmVhZGRpclN5bmMocGx1Z2luc0Rpcik7XHJcblxyXG4gIGNvbnN0IGFsaWFzZXMgPSB7fTtcclxuXHJcbiAgcGx1Z2luRm9sZGVycy5mb3JFYWNoKChwbHVnaW5Gb2xkZXIpID0+IHtcclxuICAgIGNvbnN0IHBsdWdpblNyY1BhdGggPSBwYXRoLmpvaW4ocGx1Z2luc0RpciwgcGx1Z2luRm9sZGVyLCBcInNyY1wiKTtcclxuICAgIGlmIChmcy5leGlzdHNTeW5jKHBsdWdpblNyY1BhdGgpKSB7XHJcbiAgICAgIGFsaWFzZXNbYEBhcHBzLyR7cGx1Z2luRm9sZGVyfWBdID0gcGx1Z2luU3JjUGF0aDtcclxuICAgICAgYWxpYXNlc1tgQGFwcC1tYW5pZmVzdC8ke3BsdWdpbkZvbGRlcn1gXSA9IHBhdGguam9pbihcclxuICAgICAgICBwbHVnaW5TcmNQYXRoLFxyXG4gICAgICAgIFwibWFuaWZlc3QudHNcIixcclxuICAgICAgKTtcclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIGFsaWFzZXM7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldFBsdWdpbkRlcGVuZGVuY2llcygpOiBzdHJpbmdbXSB7XHJcbiAgY29uc3QgcGx1Z2luc0RpciA9IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiYXBwc1wiKTtcclxuICAvLyBNYWtlIHN1cmUgdGhlIGBhcHBzYCBmb2xkZXIgZXhpc3RzXHJcbiAgaWYgKCFmcy5leGlzdHNTeW5jKHBsdWdpbnNEaXIpKSB7XHJcbiAgICByZXR1cm4gW107XHJcbiAgfVxyXG4gIGNvbnN0IHBsdWdpbkZvbGRlcnMgPSBmcy5yZWFkZGlyU3luYyhwbHVnaW5zRGlyKTtcclxuXHJcbiAgY29uc3QgZGVwZW5kZW5jaWVzID0gbmV3IFNldDxzdHJpbmc+KCk7XHJcblxyXG4gIHBsdWdpbkZvbGRlcnMuZm9yRWFjaCgocGx1Z2luRm9sZGVyKSA9PiB7XHJcbiAgICBjb25zdCBwYWNrYWdlSnNvblBhdGggPSBwYXRoLmpvaW4ocGx1Z2luc0RpciwgcGx1Z2luRm9sZGVyLCBcInBhY2thZ2UuanNvblwiKTtcclxuICAgIGlmIChmcy5leGlzdHNTeW5jKHBhY2thZ2VKc29uUGF0aCkpIHtcclxuICAgICAgY29uc3QgcGFja2FnZUpzb24gPSBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhwYWNrYWdlSnNvblBhdGgsIFwidXRmOFwiKSk7XHJcbiAgICAgIGNvbnN0IHBsdWdpbkRlcGVuZGVuY2llcyA9IHBhY2thZ2VKc29uLmRlcGVuZGVuY2llc1xyXG4gICAgICAgID8gT2JqZWN0LmtleXMocGFja2FnZUpzb24uZGVwZW5kZW5jaWVzKVxyXG4gICAgICAgIDogW107XHJcbiAgICAgIHBsdWdpbkRlcGVuZGVuY2llcy5mb3JFYWNoKChkZXApID0+IGRlcGVuZGVuY2llcy5hZGQoZGVwKSk7XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiBBcnJheS5mcm9tKGRlcGVuZGVuY2llcyk7XHJcbn1cclxuXHJcbi8qKiBAdHlwZSB7aW1wb3J0KCd2aXRlJykuVXNlckNvbmZpZ30gKi9cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4ge1xyXG4gIGNvbnN0IGVudiA9IGxvYWRFbnYobW9kZSwgcHJvY2Vzcy5jd2QoKSwgXCJcIik7XHJcblxyXG4gIGNvbnN0IGNkblVybHMgPVxyXG4gICAgZW52LlJFQUNUX0NETl9VUkxTIHx8XHJcbiAgICBbXHJcbiAgICAgIFwiaHR0cHM6Ly9lZ292LXMzLWZhY2lsaXR5LTEwYmVkaWN1LnMzLmFtYXpvbmF3cy5jb21cIixcclxuICAgICAgXCJodHRwczovL2Vnb3YtczMtcGF0aWVudC1kYXRhLTEwYmVkaWN1LnMzLmFtYXpvbmF3cy5jb21cIixcclxuICAgICAgXCJodHRwOi8vbG9jYWxob3N0OjQ1NjZcIixcclxuICAgIF0uam9pbihcIiBcIik7XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICBlbnZQcmVmaXg6IFwiUkVBQ1RfXCIsXHJcbiAgICBkZWZpbmU6IHtcclxuICAgICAgX19DVVNUT01fREVTQ1JJUFRJT05fSFRNTF9fOiBnZXREZXNjcmlwdGlvbkh0bWwoXHJcbiAgICAgICAgZW52LlJFQUNUX0NVU1RPTV9ERVNDUklQVElPTiB8fCBcIlwiLFxyXG4gICAgICApLFxyXG4gICAgfSxcclxuICAgIHBsdWdpbnM6IFtcclxuICAgICAgVmFsaWRhdGVFbnYoe1xyXG4gICAgICAgIHZhbGlkYXRvcjogXCJ6b2RcIixcclxuICAgICAgICBzY2hlbWE6IHtcclxuICAgICAgICAgIFJFQUNUX0NBUkVfQVBJX1VSTDogei5zdHJpbmcoKS51cmwoKSxcclxuXHJcbiAgICAgICAgICBSRUFDVF9TRU5UUllfRFNOOiB6LnN0cmluZygpLnVybCgpLm9wdGlvbmFsKCksXHJcbiAgICAgICAgICBSRUFDVF9TRU5UUllfRU5WSVJPTk1FTlQ6IHouc3RyaW5nKCkub3B0aW9uYWwoKSxcclxuXHJcbiAgICAgICAgICBSRUFDVF9QTEFVU0lCTEVfU0lURV9ET01BSU46IHpcclxuICAgICAgICAgICAgLnN0cmluZygpXHJcbiAgICAgICAgICAgIC5yZWdleCgvXlthLXpBLVowLTldW2EtekEtWjAtOS1fLl0qXFwuW2EtekEtWl17Mix9JC8pXHJcbiAgICAgICAgICAgIC5vcHRpb25hbCgpXHJcbiAgICAgICAgICAgIC5kZXNjcmliZShcIkRvbWFpbiBuYW1lIHdpdGhvdXQgcHJvdG9jb2wgKGUuZy4sIHN1Yi5kb21haW4uY29tKVwiKSxcclxuXHJcbiAgICAgICAgICBSRUFDVF9QTEFVU0lCTEVfU0VSVkVSX1VSTDogei5zdHJpbmcoKS51cmwoKS5vcHRpb25hbCgpLFxyXG4gICAgICAgICAgUkVBQ1RfQ0ROX1VSTFM6IHpcclxuICAgICAgICAgICAgLnN0cmluZygpXHJcbiAgICAgICAgICAgIC5vcHRpb25hbCgpXHJcbiAgICAgICAgICAgIC50cmFuc2Zvcm0oKHZhbCkgPT4gdmFsPy5zcGxpdChcIiBcIikpXHJcbiAgICAgICAgICAgIC5waXBlKHouYXJyYXkoei5zdHJpbmcoKS51cmwoKSkub3B0aW9uYWwoKSlcclxuICAgICAgICAgICAgLmRlc2NyaWJlKFwiT3B0aW9uYWw6IFNwYWNlLXNlcGFyYXRlZCBsaXN0IG9mIENETiBVUkxzXCIpLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0pLFxyXG4gICAgICB2aXRlU3RhdGljQ29weSh7XHJcbiAgICAgICAgdGFyZ2V0czogW1xyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBzcmM6IHBkZldvcmtlclBhdGgsXHJcbiAgICAgICAgICAgIGRlc3Q6IFwiXCIsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIF0sXHJcbiAgICAgIH0pLFxyXG4gICAgICByZWFjdCgpLFxyXG4gICAgICBjaGVja2VyKHsgdHlwZXNjcmlwdDogdHJ1ZSB9KSxcclxuICAgICAgdHJlZVNoYWtlQ2FyZUljb25zKHtcclxuICAgICAgICBpY29uV2hpdGVsaXN0OiBbXCJkZWZhdWx0XCJdLFxyXG4gICAgICB9KSxcclxuICAgICAgVml0ZVBXQSh7XHJcbiAgICAgICAgc3RyYXRlZ2llczogXCJpbmplY3RNYW5pZmVzdFwiLFxyXG4gICAgICAgIHNyY0RpcjogXCJzcmNcIixcclxuICAgICAgICBmaWxlbmFtZTogXCJzZXJ2aWNlLXdvcmtlci50c1wiLFxyXG4gICAgICAgIGluamVjdFJlZ2lzdGVyOiBcInNjcmlwdC1kZWZlclwiLFxyXG4gICAgICAgIGRldk9wdGlvbnM6IHtcclxuICAgICAgICAgIGVuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgICB0eXBlOiBcIm1vZHVsZVwiLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgaW5qZWN0TWFuaWZlc3Q6IHtcclxuICAgICAgICAgIG1heGltdW1GaWxlU2l6ZVRvQ2FjaGVJbkJ5dGVzOiA3MDAwMDAwLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgbWFuaWZlc3Q6IHtcclxuICAgICAgICAgIG5hbWU6IFwiQ2FyZVwiLFxyXG4gICAgICAgICAgc2hvcnRfbmFtZTogXCJDYXJlXCIsXHJcbiAgICAgICAgICB0aGVtZV9jb2xvcjogXCIjMGU5ZjZlXCIsXHJcbiAgICAgICAgICBiYWNrZ3JvdW5kX2NvbG9yOiBcIiNmZmZmZmZcIixcclxuICAgICAgICAgIGRpc3BsYXk6IFwic3RhbmRhbG9uZVwiLFxyXG4gICAgICAgICAgaWNvbnM6IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIHNyYzogXCJpbWFnZXMvaWNvbnMvcHdhLTY0eDY0LnBuZ1wiLFxyXG4gICAgICAgICAgICAgIHNpemVzOiBcIjY0eDY0XCIsXHJcbiAgICAgICAgICAgICAgdHlwZTogXCJpbWFnZS9wbmdcIixcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIHNyYzogXCJpbWFnZXMvaWNvbnMvcHdhLTE5MngxOTIucG5nXCIsXHJcbiAgICAgICAgICAgICAgc2l6ZXM6IFwiMTkyeDE5MlwiLFxyXG4gICAgICAgICAgICAgIHR5cGU6IFwiaW1hZ2UvcG5nXCIsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBzcmM6IFwiaW1hZ2VzL2ljb25zL3B3YS01MTJ4NTEyLnBuZ1wiLFxyXG4gICAgICAgICAgICAgIHNpemVzOiBcIjUxMng1MTJcIixcclxuICAgICAgICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxyXG4gICAgICAgICAgICAgIHB1cnBvc2U6IFwiYW55XCIsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBzcmM6IFwiaW1hZ2VzL2ljb25zL21hc2thYmxlLWljb24tNTEyeDUxMi5wbmdcIixcclxuICAgICAgICAgICAgICBzaXplczogXCI1MTJ4NTEyXCIsXHJcbiAgICAgICAgICAgICAgdHlwZTogXCJpbWFnZS9wbmdcIixcclxuICAgICAgICAgICAgICBwdXJwb3NlOiBcIm1hc2thYmxlXCIsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICBdLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0pLFxyXG4gICAgXSxcclxuICAgIHJlc29sdmU6IHtcclxuICAgICAgYWxpYXM6IHtcclxuICAgICAgICAuLi5nZXRQbHVnaW5BbGlhc2VzKCksXHJcbiAgICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXHJcbiAgICAgICAgXCJAY2FyZUNvbmZpZ1wiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vY2FyZS5jb25maWcudHNcIiksXHJcbiAgICAgICAgXCJAY29yZVwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcInNyYy9cIiksXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gICAgb3B0aW1pemVEZXBzOiB7XHJcbiAgICAgIGluY2x1ZGU6IGdldFBsdWdpbkRlcGVuZGVuY2llcygpLFxyXG4gICAgfSxcclxuICAgIGJ1aWxkOiB7XHJcbiAgICAgIG91dERpcjogXCJidWlsZFwiLFxyXG4gICAgICBhc3NldHNEaXI6IFwiYnVuZGxlXCIsXHJcbiAgICAgIHNvdXJjZW1hcDogdHJ1ZSxcclxuICAgICAgcm9sbHVwT3B0aW9uczoge1xyXG4gICAgICAgIG91dHB1dDoge1xyXG4gICAgICAgICAgbWFudWFsQ2h1bmtzKGlkLCB7IGdldE1vZHVsZUluZm8gfSkge1xyXG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoXCJub2RlX21vZHVsZXNcIikpIHtcclxuICAgICAgICAgICAgICBjb25zdCBtb2R1bGVJbmZvID0gZ2V0TW9kdWxlSW5mbyhpZCk7XHJcblxyXG4gICAgICAgICAgICAgIC8vIFJlY3Vyc2l2ZSBmdW5jdGlvbiB0byBjaGVjayBpZiB0aGUgbW9kdWxlIGlzIHN0YXRpY2FsbHkgaW1wb3J0ZWQgYnkgYW4gZW50cnkgcG9pbnRcclxuICAgICAgICAgICAgICBmdW5jdGlvbiBpc1N0YXRpY2FsbHlJbXBvcnRlZEJ5RW50cnkoXHJcbiAgICAgICAgICAgICAgICBtb2R1bGVJZCxcclxuICAgICAgICAgICAgICAgIHZpc2l0ZWQgPSBuZXcgU2V0KCksXHJcbiAgICAgICAgICAgICAgKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodmlzaXRlZC5oYXMobW9kdWxlSWQpKSByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB2aXNpdGVkLmFkZChtb2R1bGVJZCk7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgbW9kSW5mbyA9IGdldE1vZHVsZUluZm8obW9kdWxlSWQpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFtb2RJbmZvKSByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gQ2hlY2sgaWYgdGhlIG1vZHVsZSBpcyBhbiBlbnRyeSBwb2ludFxyXG4gICAgICAgICAgICAgICAgaWYgKG1vZEluZm8uaXNFbnRyeSkge1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBDaGVjayBhbGwgc3RhdGljIGltcG9ydGVyc1xyXG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBpbXBvcnRlcklkIG9mIG1vZEluZm8uaW1wb3J0ZXJzKSB7XHJcbiAgICAgICAgICAgICAgICAgIGlmIChpc1N0YXRpY2FsbHlJbXBvcnRlZEJ5RW50cnkoaW1wb3J0ZXJJZCwgdmlzaXRlZCkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgIC8vIERldGVybWluZSBpZiB0aGUgbW9kdWxlIHNob3VsZCBiZSBpbiB0aGUgJ3ZlbmRvcicgY2h1bmtcclxuICAgICAgICAgICAgICBjb25zdCBtYW51YWxWZW5kb3JDaHVua3MgPSAvdGlueS1pbnZhcmlhbnQvO1xyXG4gICAgICAgICAgICAgIGlmIChcclxuICAgICAgICAgICAgICAgIG1hbnVhbFZlbmRvckNodW5rcy50ZXN0KGlkKSB8fFxyXG4gICAgICAgICAgICAgICAgaXNTdGF0aWNhbGx5SW1wb3J0ZWRCeUVudHJ5KGlkKVxyXG4gICAgICAgICAgICAgICkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwidmVuZG9yXCI7XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIGdyb3VwIGxhenktbG9hZGVkIGRlcGVuZGVuY2llcyBieSB0aGVpciBkeW5hbWljIGltcG9ydGVyXHJcbiAgICAgICAgICAgICAgICBjb25zdCBkeW5hbWljSW1wb3J0ZXJzID0gbW9kdWxlSW5mbz8uZHluYW1pY0ltcG9ydGVycyB8fCBbXTtcclxuICAgICAgICAgICAgICAgIGlmIChkeW5hbWljSW1wb3J0ZXJzICYmIGR5bmFtaWNJbXBvcnRlcnMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAvLyBVc2UgdGhlIGZpcnN0IGR5bmFtaWMgaW1wb3J0ZXIgdG8gbmFtZSB0aGUgY2h1bmtcclxuICAgICAgICAgICAgICAgICAgY29uc3QgaW1wb3J0ZXJDaHVua05hbWUgPSBkeW5hbWljSW1wb3J0ZXJzWzBdXHJcbiAgICAgICAgICAgICAgICAgICAgPyBkeW5hbWljSW1wb3J0ZXJzWzBdLnNwbGl0KFwiL1wiKS5wb3AoKVxyXG4gICAgICAgICAgICAgICAgICAgIDogXCJ2ZW5kb3JcIi5zcGxpdChcIi5cIilbMF07XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiBgY2h1bmstJHtpbXBvcnRlckNodW5rTmFtZX1gO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gSWYgbm8gZHluYW1pYyBpbXBvcnRlcnMgYXJlIGZvdW5kLCBsZXQgUm9sbHVwIGhhbmRsZSBpdCBhdXRvbWF0aWNhbGx5XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gICAgc2VydmVyOiB7XHJcbiAgICAgIHBvcnQ6IDQwMDAsXHJcbiAgICB9LFxyXG4gICAgcHJldmlldzoge1xyXG4gICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgXCJDb250ZW50LVNlY3VyaXR5LVBvbGljeS1SZXBvcnQtT25seVwiOiBgZGVmYXVsdC1zcmMgJ3NlbGYnO1xcXHJcbiAgICAgICAgc2NyaXB0LXNyYyAnc2VsZicgYmxvYjogJ25vbmNlLWY1MWI5NzQyJyBodHRwczovL3BsYXVzaWJsZS4xMGJlZGljdS5pbjtcXFxyXG4gICAgICAgIHN0eWxlLXNyYyAnc2VsZicgJ3Vuc2FmZS1pbmxpbmUnO1xcXHJcbiAgICAgICAgY29ubmVjdC1zcmMgJ3NlbGYnIGh0dHBzOi8vcGxhdXNpYmxlLjEwYmVkaWN1LmluO1xcXHJcbiAgICAgICAgaW1nLXNyYyAnc2VsZicgaHR0cHM6Ly9jZG4ub2hjLm5ldHdvcmsgJHtjZG5VcmxzfTtcXFxyXG4gICAgICAgIG9iamVjdC1zcmMgJ3NlbGYnICR7Y2RuVXJsc307YCxcclxuICAgICAgfSxcclxuICAgICAgcG9ydDogNDAwMCxcclxuICAgIH0sXHJcbiAgfTtcclxufSk7XHJcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRDpcXFxcZGV2XFxcXE5ldyBmb2xkZXJcXFxcY2FyZV9mZVxcXFxwbHVnaW5zXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFxkZXZcXFxcTmV3IGZvbGRlclxcXFxjYXJlX2ZlXFxcXHBsdWdpbnNcXFxcdHJlZVNoYWtlQ2FyZUljb25zLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9kZXYvTmV3JTIwZm9sZGVyL2NhcmVfZmUvcGx1Z2lucy90cmVlU2hha2VDYXJlSWNvbnMudHNcIjtpbXBvcnQgKiBhcyBmcyBmcm9tIFwiZnNcIjtcclxuaW1wb3J0IHsgZ2xvYlN5bmMgfSBmcm9tIFwiZ2xvYlwiO1xyXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCI7XHJcbmltcG9ydCB7IFBsdWdpbiB9IGZyb20gXCJ2aXRlXCI7XHJcblxyXG4vKipcclxuICogSW50ZXJmYWNlIGRlZmluaW5nIG9wdGlvbnMgZm9yIHRoZSB0cmVlU2hha2VVbmljb25QYXRoc1BsdWdpbi5cclxuICpcclxuICogQGludGVyZmFjZSBUcmVlU2hha2VVbmljb25QYXRoc1BsdWdpbk9wdGlvbnNcclxuICogQHByb3BlcnR5IHtzdHJpbmdbXX0gaWNvbldoaXRlbGlzdCAtIEFuIGFycmF5IG9mIGljb24gbmFtZXMgdG8gYWx3YXlzIGluY2x1ZGUsIGV2ZW4gaWYgbm90IGZvdW5kIGluIGNvZGUuXHJcbiAqL1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBUcmVlU2hha2VDYXJlSWNvbnNPcHRpb25zIHtcclxuICBpY29uV2hpdGVsaXN0OiBzdHJpbmdbXTtcclxufVxyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBXZWJwYWNrIHBsdWdpbiB0aGF0IHRyZWUtc2hha2VzIHVudXNlZCBVbmljb24gcGF0aHMgZnJvbSBVbmljb25QYXRocy5qc29uIGluIHByb2R1Y3Rpb24gYnVpbGRzLlxyXG4gKlxyXG4gKiBAcGFyYW0ge1RyZWVTaGFrZUNhcmVJY29uc09wdGlvbnN9IFtvcHRpb25zXSAtIE9wdGlvbmFsIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy4gRGVmYXVsdHMgdG8gYW4gZW1wdHkgaWNvbldoaXRlbGlzdC5cclxuICogQHJldHVybnMge1BsdWdpbn0gV2VicGFjayBwbHVnaW4gb2JqZWN0LlxyXG4gKi9cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB0cmVlU2hha2VDYXJlSWNvbnMoXHJcbiAgb3B0aW9uczogVHJlZVNoYWtlQ2FyZUljb25zT3B0aW9ucyA9IHsgaWNvbldoaXRlbGlzdDogW10gfSxcclxuKTogUGx1Z2luIHtcclxuICBjb25zdCByb290RGlyID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuLlwiKTsgLy8gdXBkYXRlIHRoaXMgaWYgbW92aW5nIHRoaXMgY29kZSB0byBhIGRpZmZlcmVudCBmaWxlXHJcbiAgY29uc3QgbGluZUljb25OYW1lUmVnZXggPSAvXCJsLVthLXpdKyg/Oi1bYS16XSspKlwiL2c7XHJcbiAgY29uc3QgYWxsVW5pY29uUGF0aHMgPSBKU09OLnBhcnNlKFxyXG4gICAgZnMucmVhZEZpbGVTeW5jKFxyXG4gICAgICBwYXRoLnJlc29sdmUocm9vdERpciwgXCJzcmMvQ0FSRVVJL2ljb25zL1VuaWNvblBhdGhzLmpzb25cIiksXHJcbiAgICAgIFwidXRmOFwiLFxyXG4gICAgKSxcclxuICApO1xyXG5cclxuICAvLyBFeHRyYWN0cyBpY29uIG5hbWVzIGZyb20gYSBnaXZlbiBmaWxlJ3MgY29udGVudC5cclxuICAvLyBSZXR1cm5zIGFuIGFycmF5IG9mIGljb24gbmFtZXMgbGlrZSBbXCJsLWV5ZVwiLCBcImwtc3luY1wiLCBcImwtaGVhcmJlYXRcIl1cclxuICBmdW5jdGlvbiBleHRyYWN0Q2FyZUljb25OYW1lcyhmaWxlOiBzdHJpbmcpOiBzdHJpbmdbXSB7XHJcbiAgICBjb25zdCBmaWxlQ29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhmaWxlLCBcInV0ZjhcIik7XHJcblxyXG4gICAgY29uc3QgbGluZUljb25OYW1lTWF0Y2hlcyA9IGZpbGVDb250ZW50Lm1hdGNoKGxpbmVJY29uTmFtZVJlZ2V4KSB8fCBbXTtcclxuXHJcbiAgICBjb25zdCBsaW5lSWNvbk5hbWVzID0gbGluZUljb25OYW1lTWF0Y2hlcy5tYXAoXHJcbiAgICAgIChsaW5lSWNvbk5hbWUpID0+IGxpbmVJY29uTmFtZS5zbGljZSgxLCAtMSksIC8vIHJlbW92ZSBxdW90ZXNcclxuICAgICk7XHJcblxyXG4gICAgcmV0dXJuIGxpbmVJY29uTmFtZXM7XHJcbiAgfVxyXG4gIC8vIEZpbmRzIGFsbCB1c2VkIGljb24gbmFtZXMgd2l0aGluIHRoZSBwcm9qZWN0J3Mgc291cmNlIGZpbGVzIChgLnRzeGAgb3IgYC5yZXNgIGV4dGVuc2lvbnMpLlxyXG4gIGZ1bmN0aW9uIGdldEFsbFVzZWRJY29uTmFtZXMoKSB7XHJcbiAgICBjb25zdCBmaWxlcyA9IGdsb2JTeW5jKHBhdGgucmVzb2x2ZShyb290RGlyLCBcInthcHBzLHNyY30vKiovKi57dHN4LHJlc31cIikpO1xyXG4gICAgY29uc3QgdXNlZEljb25zQXJyYXk6IHN0cmluZ1tdID0gW107XHJcblxyXG4gICAgZmlsZXMuZm9yRWFjaCgoZmlsZSkgPT4ge1xyXG4gICAgICBjb25zdCBpY29uTmFtZXMgPSBleHRyYWN0Q2FyZUljb25OYW1lcyhmaWxlKTtcclxuICAgICAgdXNlZEljb25zQXJyYXkucHVzaCguLi5pY29uTmFtZXMpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIG5ldyBTZXQodXNlZEljb25zQXJyYXkpO1xyXG4gIH1cclxuICAvLyBHZW5lcmF0ZXMgYSBtYXAgb2YgdXNlZCBpY29uIG5hbWVzIHRvIHRoZWlyIHBhdGhzIGZyb20gVW5pY29uUGF0aHMuanNvbiwgaW5jbHVkaW5nIGFueSB3aGl0ZWxpc3RlZCBpY29ucy5cclxuICBmdW5jdGlvbiBnZXRUcmVlU2hha2VuVW5pY29uUGF0aHMoKSB7XHJcbiAgICBjb25zdCB1c2VkSWNvbnMgPSBbLi4uZ2V0QWxsVXNlZEljb25OYW1lcygpLCAuLi5vcHRpb25zLmljb25XaGl0ZWxpc3RdO1xyXG4gICAgY29uc3QgdHJlZXNoYWtlbkNhcmVJY29uUGF0aHMgPSB7fTtcclxuXHJcbiAgICBmb3IgKGNvbnN0IGljb25OYW1lIG9mIHVzZWRJY29ucykge1xyXG4gICAgICBjb25zdCBwYXRoID0gYWxsVW5pY29uUGF0aHNbaWNvbk5hbWVdO1xyXG4gICAgICBpZiAocGF0aCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJY29uICR7aWNvbk5hbWV9IGlzIG5vdCBmb3VuZCBpbiBVbmljb25QYXRocy5qc29uYCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdHJlZXNoYWtlbkNhcmVJY29uUGF0aHNbaWNvbk5hbWVdID0gcGF0aDtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0cmVlc2hha2VuQ2FyZUljb25QYXRocztcclxuICB9XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICBuYW1lOiBcInRyZWUtc2hha2UtY2FyZS1pY29uc1wiLFxyXG4gICAgdHJhbnNmb3JtKF9zcmMsIGlkKSB7XHJcbiAgICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIFJlcGxhY2UgdGhlIFVuaWNvblBhdGhzIHdpdGggdGhlIHRyZWUtc2hha2VuIHZlcnNpb25cclxuICAgICAgaWYgKGlkLmVuZHNXaXRoKFwiVW5pY29uUGF0aHMuanNvblwiKSkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICBjb2RlOiBgZXhwb3J0IGRlZmF1bHQgJHtKU09OLnN0cmluZ2lmeShnZXRUcmVlU2hha2VuVW5pY29uUGF0aHMoKSl9YCxcclxuICAgICAgICAgIG1hcDogbnVsbCxcclxuICAgICAgICB9O1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gIH07XHJcbn1cclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF5USxTQUFTLG1CQUFtQjtBQUNyUyxPQUFPLFdBQVc7QUFDbEIsT0FBTyxlQUFlO0FBQ3RCLE9BQU9BLFNBQVE7QUFDZixTQUFTLGFBQWE7QUFDdEIsU0FBUyxjQUFjO0FBQ3ZCLFNBQVMscUJBQXFCO0FBQzlCLE9BQU9DLFdBQVU7QUFDakIsU0FB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O0FBQUEsUUFDYixRQUFRO0FBQUEsVUFDTixhQUFhLElBQUksRUFBRSxjQUFjLEdBQUc7QUFDbEMsZ0JBQUksR0FBRyxTQUFTLGNBQWMsR0FBRztBQUkvQixrQkFBU0UsK0JBQVQsU0FDRSxVQUNBLFVBQVUsb0JBQUksSUFBSSxHQUNsQjtBQUNBLG9CQUFJLFFBQVEsSUFBSSxRQUFRLEVBQUcsUUFBTztBQUNsQyx3QkFBUSxJQUFJLFFBQVE7QUFFcEIsc0JBQU0sVUFBVSxjQUFjLFFBQVE7QUFDdEMsb0JBQUksQ0FBQyxRQUFTLFFBQU87QUFHckIsb0JBQUksUUFBUSxTQUFTO0FBQ25CLHlCQUFPO0FBQUEsZ0JBQ1Q7QUFHQSwyQkFBVyxjQUFjLFFBQVEsV0FBVztBQUMxQyxzQkFBSUEsNkJBQTRCLFlBQVksT0FBTyxHQUFHO0FBQ3BELDJCQUFPO0FBQUEsa0JBQ1Q7QUFBQSxnQkFDRjtBQUVBLHVCQUFPO0FBQUEsY0FDVDtBQXZCUyxnREFBQUE7QUFIVCxvQkFBTSxhQUFhLGNBQWMsRUFBRTtBQTZCbkMsb0JBQU0scUJBQXFCO0FBQzNCLGtCQUNFLG1CQUFtQixLQUFLLEVBQUUsS0FDMUJBLDZCQUE0QixFQUFFLEdBQzlCO0FBQ0EsdUJBQU87QUFBQSxjQUNULE9BQU87QUFFTCxzQkFBTSxtQkFBbUIsWUFBWSxvQkFBb0IsQ0FBQztBQUMxRCxvQkFBSSxvQkFBb0IsaUJBQWlCLFNBQVMsR0FBRztBQUVuRCx3QkFBTSxvQkFBb0IsaUJBQWlCLENBQUMsSUFDeEMsaUJBQWlCLENBQUMsRUFBRSxNQUFNLEdBQUcsRUFBRSxJQUFJLElBQ25DLFNBQVMsTUFBTSxHQUFHLEVBQUUsQ0FBQztBQUN6Qix5QkFBTyxTQUFTLGlCQUFpQjtBQUFBLGdCQUNuQztBQUFBLGNBRUY7QUFBQSxZQUNGO0FBQUEsVUFDRjtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLElBQ0EsUUFBUTtBQUFBLE1BQ04sTUFBTTtBQUFBLElBQ1I7QUFBQSxJQUNBLFNBQVM7QUFBQSxNQUNQLFNBQVM7QUFBQSxRQUNQLHVDQUF1QyxzUEFJRSxPQUFPLDhCQUM1QixPQUFPO0FBQUEsTUFDN0I7QUFBQSxNQUNBLE1BQU07QUFBQSxJQUNSO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbImZzIiwgInBhdGgiLCAicGF0aCIsICJfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSIsICJwYXRoIiwgIl9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lIiwgImZzIiwgImlzU3RhdGljYWxseUltcG9ydGVkQnlFbnRyeSJdCn0K
