// vite.config.mts
import { ValidateEnv } from "file:///C:/Users/yaahg/care_fe/node_modules/@julr/vite-plugin-validate-env/dist/index.js";
import federation from "file:///C:/Users/yaahg/care_fe/node_modules/@originjs/vite-plugin-federation/dist/index.mjs";
import reactScan from "file:///C:/Users/yaahg/care_fe/node_modules/@react-scan/vite-plugin-react-scan/dist/index.js";
import react from "file:///C:/Users/yaahg/care_fe/node_modules/@vitejs/plugin-react/dist/index.mjs";
import DOMPurify from "file:///C:/Users/yaahg/care_fe/node_modules/dompurify/dist/purify.es.mjs";
import fs2 from "fs";
import { JSDOM } from "file:///C:/Users/yaahg/care_fe/node_modules/jsdom/lib/api.js";
import { marked } from "file:///C:/Users/yaahg/care_fe/node_modules/marked/lib/marked.esm.js";
import { createRequire } from "node:module";
import path2 from "path";
import { defineConfig, loadEnv } from "file:///C:/Users/yaahg/care_fe/node_modules/vite/dist/node/index.js";
import checker from "file:///C:/Users/yaahg/care_fe/node_modules/vite-plugin-checker/dist/main.js";
import { VitePWA } from "file:///C:/Users/yaahg/care_fe/node_modules/vite-plugin-pwa/dist/index.js";
import { viteStaticCopy } from "file:///C:/Users/yaahg/care_fe/node_modules/vite-plugin-static-copy/dist/index.js";
import { z } from "file:///C:/Users/yaahg/care_fe/node_modules/zod/lib/index.mjs";

// plugins/treeShakeCareIcons.ts
import * as fs from "fs";
import { globSync } from "file:///C:/Users/yaahg/care_fe/node_modules/glob/dist/esm/index.js";
import * as path from "path";
var __vite_injected_original_dirname = "C:\\Users\\yaahg\\care_fe\\plugins";
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
var __vite_injected_original_dirname2 = "C:\\Users\\yaahg\\care_fe";
var __vite_injected_original_import_meta_url = "file:///C:/Users/yaahg/care_fe/vite.config.mts";
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
function parseRemoteConfig(appConfig) {
  if (!appConfig.includes("/")) {
    throw new Error(
      `Invalid app configuration format: ${appConfig}. Expected 'org/repo' or 'org/repo@url'.`
    );
  }
  if (appConfig.includes("@")) {
    const [package_, url] = appConfig.split("@");
    const [org2, repo2] = package_.split("/");
    if (!org2 || !repo2 || !url) {
      throw new Error(
        `Invalid custom URL configuration: ${appConfig}. Expected 'org/repo@url'.`
      );
    }
    const protocol = url.includes("localhost") ? "http://" : "https://";
    const fullUrl = url.startsWith("http") ? url : `${protocol}${url}`;
    return {
      url: `${fullUrl}/assets/remoteEntry.js`,
      org: org2,
      repo: repo2
    };
  }
  const [org, repo] = appConfig.split("/");
  if (!org || !repo) {
    throw new Error(
      `Invalid GitHub Pages configuration: ${appConfig}. Expected 'org/repo'.`
    );
  }
  return {
    url: `https://${org}.github.io/${repo}/assets/remoteEntry.js`,
    org,
    repo
  };
}
function getRemotes(enabledApps) {
  if (!enabledApps) return {};
  return enabledApps.split(",").reduce((acc, app) => {
    const { repo, url } = parseRemoteConfig(app);
    console.log(`Configuring Remote Module for ${repo}:`, url);
    return {
      ...acc,
      [repo]: {
        external: `Promise.resolve("${url}")`,
        from: "vite",
        externalType: "promise"
      }
    };
  }, {});
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
      federation({
        name: "core",
        remotes: getRemotes(env.REACT_ENABLED_APPS),
        // {
        // care_livekit_fe: {
        //   external: `Promise.resolve("http://localhost:5173/assets/remoteEntry.js")`,
        //   externalType: "promise",
        //   from: "vite",
        // },
        // },
        shared: [
          "react",
          "react-dom",
          "react-i18next",
          "@tanstack/react-query"
        ]
      }),
      ValidateEnv({
        validator: "zod",
        schema: {
          REACT_CARE_API_URL: z.string().url(),
          REACT_SENTRY_DSN: z.string().url().optional(),
          REACT_SENTRY_ENVIRONMENT: z.string().optional(),
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
      reactScan({
        enable: env.NODE_ENV === "development" && env.ENABLE_REACT_SCAN === "true"
      }),
      checker({
        typescript: true,
        eslint: {
          useFlatConfig: true,
          lintCommand: "eslint ./src",
          dev: {
            logLevel: ["error"]
          }
        }
      }),
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
          background_color: "#ffffff",
          theme_color: "#ffffff",
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
    // optimizeDeps: {
    //   include: getPluginDependencies(),
    // },
    build: {
      target: "es2022",
      outDir: "build",
      sourcemap: true
    },
    esbuild: {
      target: "es2022"
    },
    server: {
      port: 4e3,
      host: "0.0.0.0",
      allowedHosts: true
    },
    preview: {
      headers: {
        "Content-Security-Policy-Report-Only": `default-src 'self';          style-src 'self' 'unsafe-inline';          img-src 'self' https://cdn.ohc.network ${cdnUrls};          object-src 'self' ${cdnUrls};`
      },
      port: 4e3
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcubXRzIiwgInBsdWdpbnMvdHJlZVNoYWtlQ2FyZUljb25zLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxceWFhaGdcXFxcY2FyZV9mZVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxceWFhaGdcXFxcY2FyZV9mZVxcXFx2aXRlLmNvbmZpZy5tdHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL3lhYWhnL2NhcmVfZmUvdml0ZS5jb25maWcubXRzXCI7aW1wb3J0IHsgVmFsaWRhdGVFbnYgfSBmcm9tIFwiQGp1bHIvdml0ZS1wbHVnaW4tdmFsaWRhdGUtZW52XCI7XHJcbmltcG9ydCBmZWRlcmF0aW9uIGZyb20gXCJAb3JpZ2luanMvdml0ZS1wbHVnaW4tZmVkZXJhdGlvblwiO1xyXG5pbXBvcnQgcmVhY3RTY2FuIGZyb20gXCJAcmVhY3Qtc2Nhbi92aXRlLXBsdWdpbi1yZWFjdC1zY2FuXCI7XHJcbmltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3RcIjtcclxuaW1wb3J0IERPTVB1cmlmeSBmcm9tIFwiZG9tcHVyaWZ5XCI7XHJcbmltcG9ydCBmcyBmcm9tIFwiZnNcIjtcclxuaW1wb3J0IHsgSlNET00gfSBmcm9tIFwianNkb21cIjtcclxuaW1wb3J0IHsgbWFya2VkIH0gZnJvbSBcIm1hcmtlZFwiO1xyXG5pbXBvcnQgeyBjcmVhdGVSZXF1aXJlIH0gZnJvbSBcIm5vZGU6bW9kdWxlXCI7XHJcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XHJcbmltcG9ydCB7IGRlZmluZUNvbmZpZywgbG9hZEVudiB9IGZyb20gXCJ2aXRlXCI7XHJcbmltcG9ydCBjaGVja2VyIGZyb20gXCJ2aXRlLXBsdWdpbi1jaGVja2VyXCI7XHJcbmltcG9ydCB7IFZpdGVQV0EgfSBmcm9tIFwidml0ZS1wbHVnaW4tcHdhXCI7XHJcbmltcG9ydCB7IHZpdGVTdGF0aWNDb3B5IH0gZnJvbSBcInZpdGUtcGx1Z2luLXN0YXRpYy1jb3B5XCI7XHJcbmltcG9ydCB7IHogfSBmcm9tIFwiem9kXCI7XHJcblxyXG5pbXBvcnQgeyB0cmVlU2hha2VDYXJlSWNvbnMgfSBmcm9tIFwiLi9wbHVnaW5zL3RyZWVTaGFrZUNhcmVJY29uc1wiO1xyXG5cclxuY29uc3QgcGRmV29ya2VyUGF0aCA9IHBhdGguam9pbihcclxuICBwYXRoLmRpcm5hbWUoXHJcbiAgICBjcmVhdGVSZXF1aXJlKGltcG9ydC5tZXRhLnVybCkucmVzb2x2ZShcInBkZmpzLWRpc3QvcGFja2FnZS5qc29uXCIpLFxyXG4gICksXHJcbiAgXCJidWlsZFwiLFxyXG4gIFwicGRmLndvcmtlci5taW4ubWpzXCIsXHJcbik7XHJcblxyXG4vLyBDb252ZXJ0IGdvYWwgZGVzY3JpcHRpb24gbWFya2Rvd24gdG8gSFRNTFxyXG5mdW5jdGlvbiBnZXREZXNjcmlwdGlvbkh0bWwoZGVzY3JpcHRpb246IHN0cmluZykge1xyXG4gIC8vIG5vdGU6IGVzY2FwZWQgZGVzY3JpcHRpb24gY2F1c2VzIGlzc3VlcyB3aXRoIG1hcmtkb3duIHBhcnNpbmdcclxuICBjb25zdCBodG1sID0gbWFya2VkLnBhcnNlKGRlc2NyaXB0aW9uLCB7XHJcbiAgICBhc3luYzogZmFsc2UsXHJcbiAgICBnZm06IHRydWUsXHJcbiAgICBicmVha3M6IHRydWUsXHJcbiAgfSk7XHJcbiAgY29uc3QgcHVyaWZ5ID0gRE9NUHVyaWZ5KG5ldyBKU0RPTShcIlwiKS53aW5kb3cpO1xyXG4gIGNvbnN0IHNhbml0aXplZEh0bWwgPSBwdXJpZnkuc2FuaXRpemUoaHRtbCk7XHJcbiAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHNhbml0aXplZEh0bWwpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRQbHVnaW5BbGlhc2VzKCkge1xyXG4gIGNvbnN0IHBsdWdpbnNEaXIgPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcImFwcHNcIik7XHJcbiAgLy8gTWFrZSBzdXJlIHRoZSBgYXBwc2AgZm9sZGVyIGV4aXN0c1xyXG4gIGlmICghZnMuZXhpc3RzU3luYyhwbHVnaW5zRGlyKSkge1xyXG4gICAgcmV0dXJuIHt9O1xyXG4gIH1cclxuICBjb25zdCBwbHVnaW5Gb2xkZXJzID0gZnMucmVhZGRpclN5bmMocGx1Z2luc0Rpcik7XHJcblxyXG4gIGNvbnN0IGFsaWFzZXMgPSB7fTtcclxuXHJcbiAgcGx1Z2luRm9sZGVycy5mb3JFYWNoKChwbHVnaW5Gb2xkZXIpID0+IHtcclxuICAgIGNvbnN0IHBsdWdpblNyY1BhdGggPSBwYXRoLmpvaW4ocGx1Z2luc0RpciwgcGx1Z2luRm9sZGVyLCBcInNyY1wiKTtcclxuICAgIGlmIChmcy5leGlzdHNTeW5jKHBsdWdpblNyY1BhdGgpKSB7XHJcbiAgICAgIGFsaWFzZXNbYEBhcHBzLyR7cGx1Z2luRm9sZGVyfWBdID0gcGx1Z2luU3JjUGF0aDtcclxuICAgICAgYWxpYXNlc1tgQGFwcC1tYW5pZmVzdC8ke3BsdWdpbkZvbGRlcn1gXSA9IHBhdGguam9pbihcclxuICAgICAgICBwbHVnaW5TcmNQYXRoLFxyXG4gICAgICAgIFwibWFuaWZlc3QudHNcIixcclxuICAgICAgKTtcclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIGFsaWFzZXM7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBQYXJzZXMgYSByZW1vdGUgYXBwIGNvbmZpZ3VyYXRpb24gc3RyaW5nIGludG8gaXRzIGNvbXBvbmVudHNcclxuICogQHBhcmFtIGFwcENvbmZpZyAtIENvbmZpZ3VyYXRpb24gc3RyaW5nIGZvciBhIHJlbW90ZSBhcHBcclxuICogQHJldHVybnMgUGFyc2VkIGNvbmZpZ3VyYXRpb24gb2JqZWN0XHJcbiAqL1xyXG5pbnRlcmZhY2UgUGFyc2VkUmVtb3RlQ29uZmlnIHtcclxuICB1cmw6IHN0cmluZztcclxuICBvcmc6IHN0cmluZztcclxuICByZXBvOiBzdHJpbmc7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHBhcnNlUmVtb3RlQ29uZmlnKGFwcENvbmZpZzogc3RyaW5nKTogUGFyc2VkUmVtb3RlQ29uZmlnIHtcclxuICBpZiAoIWFwcENvbmZpZy5pbmNsdWRlcyhcIi9cIikpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihcclxuICAgICAgYEludmFsaWQgYXBwIGNvbmZpZ3VyYXRpb24gZm9ybWF0OiAke2FwcENvbmZpZ30uIEV4cGVjdGVkICdvcmcvcmVwbycgb3IgJ29yZy9yZXBvQHVybCcuYCxcclxuICAgICk7XHJcbiAgfVxyXG4gIC8vIEhhbmRsZSBjdXN0b20gVVJMcyAoYm90aCBsb2NhbGhvc3QgYW5kIGN1c3RvbSBob3N0ZWQpXHJcbiAgaWYgKGFwcENvbmZpZy5pbmNsdWRlcyhcIkBcIikpIHtcclxuICAgIGNvbnN0IFtwYWNrYWdlXywgdXJsXSA9IGFwcENvbmZpZy5zcGxpdChcIkBcIik7XHJcbiAgICBjb25zdCBbb3JnLCByZXBvXSA9IHBhY2thZ2VfLnNwbGl0KFwiL1wiKTtcclxuICAgIGlmICghb3JnIHx8ICFyZXBvIHx8ICF1cmwpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKFxyXG4gICAgICAgIGBJbnZhbGlkIGN1c3RvbSBVUkwgY29uZmlndXJhdGlvbjogJHthcHBDb25maWd9LiBFeHBlY3RlZCAnb3JnL3JlcG9AdXJsJy5gLFxyXG4gICAgICApO1xyXG4gICAgfVxyXG4gICAgLy8gQWRkIGFwcHJvcHJpYXRlIHByb3RvY29sIGJhc2VkIG9uIHdoZXRoZXIgaXQncyBsb2NhbGhvc3RcclxuICAgIGNvbnN0IHByb3RvY29sID0gdXJsLmluY2x1ZGVzKFwibG9jYWxob3N0XCIpID8gXCJodHRwOi8vXCIgOiBcImh0dHBzOi8vXCI7XHJcbiAgICBjb25zdCBmdWxsVXJsID0gdXJsLnN0YXJ0c1dpdGgoXCJodHRwXCIpID8gdXJsIDogYCR7cHJvdG9jb2x9JHt1cmx9YDtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICB1cmw6IGAke2Z1bGxVcmx9L2Fzc2V0cy9yZW1vdGVFbnRyeS5qc2AsXHJcbiAgICAgIG9yZyxcclxuICAgICAgcmVwbyxcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICAvLyBIYW5kbGUgR2l0SHViIFBhZ2VzIFVSTHNcclxuICBjb25zdCBbb3JnLCByZXBvXSA9IGFwcENvbmZpZy5zcGxpdChcIi9cIik7XHJcbiAgaWYgKCFvcmcgfHwgIXJlcG8pIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihcclxuICAgICAgYEludmFsaWQgR2l0SHViIFBhZ2VzIGNvbmZpZ3VyYXRpb246ICR7YXBwQ29uZmlnfS4gRXhwZWN0ZWQgJ29yZy9yZXBvJy5gLFxyXG4gICAgKTtcclxuICB9XHJcbiAgcmV0dXJuIHtcclxuICAgIHVybDogYGh0dHBzOi8vJHtvcmd9LmdpdGh1Yi5pby8ke3JlcG99L2Fzc2V0cy9yZW1vdGVFbnRyeS5qc2AsXHJcbiAgICBvcmcsXHJcbiAgICByZXBvLFxyXG4gIH07XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBHZW5lcmF0ZXMgcmVtb3RlIG1vZHVsZSBjb25maWd1cmF0aW9ucyBmb3IgTW9kdWxlIEZlZGVyYXRpb25cclxuICpcclxuICogU3VwcG9ydHMgdHdvIGZvcm1hdHMgZm9yIFJFQUNUX0VOQUJMRURfQVBQUzpcclxuICogMS4gR2l0SHViIFBhZ2VzOiBcIm9yZ2FuaXphdGlvbi9yZXBvc2l0b3J5XCJcclxuICogICAgRXhhbXBsZTogXCJjb3JvbmFzYWZlL2NhcmVfZmVcIlxyXG4gKlxyXG4gKiAyLiBDdXN0b20gVVJMOiBcIm9yZ2FuaXphdGlvbi9yZXBvc2l0b3J5QHVybFwiXHJcbiAqICAgIEV4YW1wbGU6IFwiY29yb25hc2FmZS9jYXJlX2ZlQGxvY2FsaG9zdDo1MTczXCJcclxuICogICAgRXhhbXBsZTogXCJjb3JvbmFzYWZlL2NhcmVfZmVAY2FyZS5jb3JvbmFzYWZlLm5ldHdvcmtcIlxyXG4gKiAgICBOb3RlOiBQcm90b2NvbCAoaHR0cC9odHRwcykgaXMgYXV0b21hdGljYWxseSBhZGRlZCBiYXNlZCBvbiB0aGUgVVJMOlxyXG4gKiAgICAtIGxvY2FsaG9zdCBVUkxzIHVzZSBodHRwOi8vXHJcbiAqICAgIC0gYWxsIG90aGVyIFVSTHMgdXNlIGh0dHBzOi8vXHJcbiAqXHJcbiAqIEBwYXJhbSBlbmFibGVkQXBwcyAtIENvbW1hLXNlcGFyYXRlZCBsaXN0IG9mIGVuYWJsZWQgYXBwc1xyXG4gKiBAcmV0dXJucyBSZW1vdGUgbW9kdWxlIGNvbmZpZ3VyYXRpb24gb2JqZWN0IGZvciBNb2R1bGUgRmVkZXJhdGlvblxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0UmVtb3RlcyhlbmFibGVkQXBwczogc3RyaW5nKSB7XHJcbiAgaWYgKCFlbmFibGVkQXBwcykgcmV0dXJuIHt9O1xyXG5cclxuICByZXR1cm4gZW5hYmxlZEFwcHMuc3BsaXQoXCIsXCIpLnJlZHVjZSgoYWNjLCBhcHApID0+IHtcclxuICAgIGNvbnN0IHsgcmVwbywgdXJsIH0gPSBwYXJzZVJlbW90ZUNvbmZpZyhhcHApO1xyXG4gICAgY29uc29sZS5sb2coYENvbmZpZ3VyaW5nIFJlbW90ZSBNb2R1bGUgZm9yICR7cmVwb306YCwgdXJsKTtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAuLi5hY2MsXHJcbiAgICAgIFtyZXBvXToge1xyXG4gICAgICAgIGV4dGVybmFsOiBgUHJvbWlzZS5yZXNvbHZlKFwiJHt1cmx9XCIpYCxcclxuICAgICAgICBmcm9tOiBcInZpdGVcIixcclxuICAgICAgICBleHRlcm5hbFR5cGU6IFwicHJvbWlzZVwiLFxyXG4gICAgICB9LFxyXG4gICAgfTtcclxuICB9LCB7fSk7XHJcbn1cclxuXHJcbi8qKiBAdHlwZSB7aW1wb3J0KCd2aXRlJykuVXNlckNvbmZpZ30gKi9cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4ge1xyXG4gIGNvbnN0IGVudiA9IGxvYWRFbnYobW9kZSwgcHJvY2Vzcy5jd2QoKSwgXCJcIik7XHJcblxyXG4gIGNvbnN0IGNkblVybHMgPVxyXG4gICAgZW52LlJFQUNUX0NETl9VUkxTIHx8XHJcbiAgICBbXHJcbiAgICAgIFwiaHR0cHM6Ly9lZ292LXMzLWZhY2lsaXR5LTEwYmVkaWN1LnMzLmFtYXpvbmF3cy5jb21cIixcclxuICAgICAgXCJodHRwczovL2Vnb3YtczMtcGF0aWVudC1kYXRhLTEwYmVkaWN1LnMzLmFtYXpvbmF3cy5jb21cIixcclxuICAgICAgXCJodHRwOi8vbG9jYWxob3N0OjQ1NjZcIixcclxuICAgIF0uam9pbihcIiBcIik7XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICBlbnZQcmVmaXg6IFwiUkVBQ1RfXCIsXHJcbiAgICBkZWZpbmU6IHtcclxuICAgICAgX19DVVNUT01fREVTQ1JJUFRJT05fSFRNTF9fOiBnZXREZXNjcmlwdGlvbkh0bWwoXHJcbiAgICAgICAgZW52LlJFQUNUX0NVU1RPTV9ERVNDUklQVElPTiB8fCBcIlwiLFxyXG4gICAgICApLFxyXG4gICAgfSxcclxuICAgIHBsdWdpbnM6IFtcclxuICAgICAgZmVkZXJhdGlvbih7XHJcbiAgICAgICAgbmFtZTogXCJjb3JlXCIsXHJcbiAgICAgICAgcmVtb3RlczogZ2V0UmVtb3RlcyhlbnYuUkVBQ1RfRU5BQkxFRF9BUFBTKSxcclxuICAgICAgICAvLyB7XHJcbiAgICAgICAgLy8gY2FyZV9saXZla2l0X2ZlOiB7XHJcbiAgICAgICAgLy8gICBleHRlcm5hbDogYFByb21pc2UucmVzb2x2ZShcImh0dHA6Ly9sb2NhbGhvc3Q6NTE3My9hc3NldHMvcmVtb3RlRW50cnkuanNcIilgLFxyXG4gICAgICAgIC8vICAgZXh0ZXJuYWxUeXBlOiBcInByb21pc2VcIixcclxuICAgICAgICAvLyAgIGZyb206IFwidml0ZVwiLFxyXG4gICAgICAgIC8vIH0sXHJcbiAgICAgICAgLy8gfSxcclxuICAgICAgICBzaGFyZWQ6IFtcclxuICAgICAgICAgIFwicmVhY3RcIixcclxuICAgICAgICAgIFwicmVhY3QtZG9tXCIsXHJcbiAgICAgICAgICBcInJlYWN0LWkxOG5leHRcIixcclxuICAgICAgICAgIFwiQHRhbnN0YWNrL3JlYWN0LXF1ZXJ5XCIsXHJcbiAgICAgICAgXSxcclxuICAgICAgfSksXHJcbiAgICAgIFZhbGlkYXRlRW52KHtcclxuICAgICAgICB2YWxpZGF0b3I6IFwiem9kXCIsXHJcbiAgICAgICAgc2NoZW1hOiB7XHJcbiAgICAgICAgICBSRUFDVF9DQVJFX0FQSV9VUkw6IHouc3RyaW5nKCkudXJsKCksXHJcblxyXG4gICAgICAgICAgUkVBQ1RfU0VOVFJZX0RTTjogei5zdHJpbmcoKS51cmwoKS5vcHRpb25hbCgpLFxyXG4gICAgICAgICAgUkVBQ1RfU0VOVFJZX0VOVklST05NRU5UOiB6LnN0cmluZygpLm9wdGlvbmFsKCksXHJcblxyXG4gICAgICAgICAgUkVBQ1RfQ0ROX1VSTFM6IHpcclxuICAgICAgICAgICAgLnN0cmluZygpXHJcbiAgICAgICAgICAgIC5vcHRpb25hbCgpXHJcbiAgICAgICAgICAgIC50cmFuc2Zvcm0oKHZhbCkgPT4gdmFsPy5zcGxpdChcIiBcIikpXHJcbiAgICAgICAgICAgIC5waXBlKHouYXJyYXkoei5zdHJpbmcoKS51cmwoKSkub3B0aW9uYWwoKSlcclxuICAgICAgICAgICAgLmRlc2NyaWJlKFwiT3B0aW9uYWw6IFNwYWNlLXNlcGFyYXRlZCBsaXN0IG9mIENETiBVUkxzXCIpLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0pLFxyXG4gICAgICB2aXRlU3RhdGljQ29weSh7XHJcbiAgICAgICAgdGFyZ2V0czogW1xyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBzcmM6IHBkZldvcmtlclBhdGgsXHJcbiAgICAgICAgICAgIGRlc3Q6IFwiXCIsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIF0sXHJcbiAgICAgIH0pLFxyXG4gICAgICByZWFjdCgpLFxyXG4gICAgICByZWFjdFNjYW4oe1xyXG4gICAgICAgIGVuYWJsZTpcclxuICAgICAgICAgIGVudi5OT0RFX0VOViA9PT0gXCJkZXZlbG9wbWVudFwiICYmIGVudi5FTkFCTEVfUkVBQ1RfU0NBTiA9PT0gXCJ0cnVlXCIsXHJcbiAgICAgIH0pLFxyXG4gICAgICBjaGVja2VyKHtcclxuICAgICAgICB0eXBlc2NyaXB0OiB0cnVlLFxyXG4gICAgICAgIGVzbGludDoge1xyXG4gICAgICAgICAgdXNlRmxhdENvbmZpZzogdHJ1ZSxcclxuICAgICAgICAgIGxpbnRDb21tYW5kOiBcImVzbGludCAuL3NyY1wiLFxyXG4gICAgICAgICAgZGV2OiB7XHJcbiAgICAgICAgICAgIGxvZ0xldmVsOiBbXCJlcnJvclwiXSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSksXHJcbiAgICAgIHRyZWVTaGFrZUNhcmVJY29ucyh7XHJcbiAgICAgICAgaWNvbldoaXRlbGlzdDogW1wiZGVmYXVsdFwiXSxcclxuICAgICAgfSksXHJcbiAgICAgIFZpdGVQV0Eoe1xyXG4gICAgICAgIHN0cmF0ZWdpZXM6IFwiaW5qZWN0TWFuaWZlc3RcIixcclxuICAgICAgICBzcmNEaXI6IFwic3JjXCIsXHJcbiAgICAgICAgZmlsZW5hbWU6IFwic2VydmljZS13b3JrZXIudHNcIixcclxuICAgICAgICBpbmplY3RSZWdpc3RlcjogXCJzY3JpcHQtZGVmZXJcIixcclxuICAgICAgICBkZXZPcHRpb25zOiB7XHJcbiAgICAgICAgICBlbmFibGVkOiB0cnVlLFxyXG4gICAgICAgICAgdHlwZTogXCJtb2R1bGVcIixcclxuICAgICAgICB9LFxyXG4gICAgICAgIGluamVjdE1hbmlmZXN0OiB7XHJcbiAgICAgICAgICBtYXhpbXVtRmlsZVNpemVUb0NhY2hlSW5CeXRlczogNzAwMDAwMCxcclxuICAgICAgICB9LFxyXG4gICAgICAgIG1hbmlmZXN0OiB7XHJcbiAgICAgICAgICBuYW1lOiBcIkNhcmVcIixcclxuICAgICAgICAgIHNob3J0X25hbWU6IFwiQ2FyZVwiLFxyXG4gICAgICAgICAgYmFja2dyb3VuZF9jb2xvcjogXCIjZmZmZmZmXCIsXHJcbiAgICAgICAgICB0aGVtZV9jb2xvcjogXCIjZmZmZmZmXCIsXHJcbiAgICAgICAgICBkaXNwbGF5OiBcInN0YW5kYWxvbmVcIixcclxuICAgICAgICAgIGljb25zOiBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBzcmM6IFwiaW1hZ2VzL2ljb25zL3B3YS02NHg2NC5wbmdcIixcclxuICAgICAgICAgICAgICBzaXplczogXCI2NHg2NFwiLFxyXG4gICAgICAgICAgICAgIHR5cGU6IFwiaW1hZ2UvcG5nXCIsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBzcmM6IFwiaW1hZ2VzL2ljb25zL3B3YS0xOTJ4MTkyLnBuZ1wiLFxyXG4gICAgICAgICAgICAgIHNpemVzOiBcIjE5MngxOTJcIixcclxuICAgICAgICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgc3JjOiBcImltYWdlcy9pY29ucy9wd2EtNTEyeDUxMi5wbmdcIixcclxuICAgICAgICAgICAgICBzaXplczogXCI1MTJ4NTEyXCIsXHJcbiAgICAgICAgICAgICAgdHlwZTogXCJpbWFnZS9wbmdcIixcclxuICAgICAgICAgICAgICBwdXJwb3NlOiBcImFueVwiLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgc3JjOiBcImltYWdlcy9pY29ucy9tYXNrYWJsZS1pY29uLTUxMng1MTIucG5nXCIsXHJcbiAgICAgICAgICAgICAgc2l6ZXM6IFwiNTEyeDUxMlwiLFxyXG4gICAgICAgICAgICAgIHR5cGU6IFwiaW1hZ2UvcG5nXCIsXHJcbiAgICAgICAgICAgICAgcHVycG9zZTogXCJtYXNrYWJsZVwiLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgXSxcclxuICAgICAgICB9LFxyXG4gICAgICB9KSxcclxuICAgIF0sXHJcbiAgICByZXNvbHZlOiB7XHJcbiAgICAgIGFsaWFzOiB7XHJcbiAgICAgICAgLi4uZ2V0UGx1Z2luQWxpYXNlcygpLFxyXG4gICAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxyXG4gICAgICAgIFwiQGNhcmVDb25maWdcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL2NhcmUuY29uZmlnLnRzXCIpLFxyXG4gICAgICAgIFwiQGNvcmVcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCJzcmMvXCIpLFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICAgIC8vIG9wdGltaXplRGVwczoge1xyXG4gICAgLy8gICBpbmNsdWRlOiBnZXRQbHVnaW5EZXBlbmRlbmNpZXMoKSxcclxuICAgIC8vIH0sXHJcbiAgICBidWlsZDoge1xyXG4gICAgICB0YXJnZXQ6IFwiZXMyMDIyXCIsXHJcbiAgICAgIG91dERpcjogXCJidWlsZFwiLFxyXG4gICAgICBzb3VyY2VtYXA6IHRydWUsXHJcbiAgICB9LFxyXG4gICAgZXNidWlsZDoge1xyXG4gICAgICB0YXJnZXQ6IFwiZXMyMDIyXCIsXHJcbiAgICB9LFxyXG4gICAgc2VydmVyOiB7XHJcbiAgICAgIHBvcnQ6IDQwMDAsXHJcbiAgICAgIGhvc3Q6IFwiMC4wLjAuMFwiLFxyXG4gICAgICBhbGxvd2VkSG9zdHM6IHRydWUsXHJcbiAgICB9LFxyXG4gICAgcHJldmlldzoge1xyXG4gICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgXCJDb250ZW50LVNlY3VyaXR5LVBvbGljeS1SZXBvcnQtT25seVwiOiBgZGVmYXVsdC1zcmMgJ3NlbGYnO1xcXHJcbiAgICAgICAgICBzdHlsZS1zcmMgJ3NlbGYnICd1bnNhZmUtaW5saW5lJztcXFxyXG4gICAgICAgICAgaW1nLXNyYyAnc2VsZicgaHR0cHM6Ly9jZG4ub2hjLm5ldHdvcmsgJHtjZG5VcmxzfTtcXFxyXG4gICAgICAgICAgb2JqZWN0LXNyYyAnc2VsZicgJHtjZG5VcmxzfTtgLFxyXG4gICAgICB9LFxyXG4gICAgICBwb3J0OiA0MDAwLFxyXG4gICAgfSxcclxuICB9O1xyXG59KTtcclxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFx5YWFoZ1xcXFxjYXJlX2ZlXFxcXHBsdWdpbnNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXHlhYWhnXFxcXGNhcmVfZmVcXFxccGx1Z2luc1xcXFx0cmVlU2hha2VDYXJlSWNvbnMudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL3lhYWhnL2NhcmVfZmUvcGx1Z2lucy90cmVlU2hha2VDYXJlSWNvbnMudHNcIjtpbXBvcnQgKiBhcyBmcyBmcm9tIFwiZnNcIjtcclxuaW1wb3J0IHsgZ2xvYlN5bmMgfSBmcm9tIFwiZ2xvYlwiO1xyXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCI7XHJcbmltcG9ydCB7IFBsdWdpbiB9IGZyb20gXCJ2aXRlXCI7XHJcblxyXG4vKipcclxuICogSW50ZXJmYWNlIGRlZmluaW5nIG9wdGlvbnMgZm9yIHRoZSB0cmVlU2hha2VVbmljb25QYXRoc1BsdWdpbi5cclxuICpcclxuICogQGludGVyZmFjZSBUcmVlU2hha2VVbmljb25QYXRoc1BsdWdpbk9wdGlvbnNcclxuICogQHByb3BlcnR5IHtzdHJpbmdbXX0gaWNvbldoaXRlbGlzdCAtIEFuIGFycmF5IG9mIGljb24gbmFtZXMgdG8gYWx3YXlzIGluY2x1ZGUsIGV2ZW4gaWYgbm90IGZvdW5kIGluIGNvZGUuXHJcbiAqL1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBUcmVlU2hha2VDYXJlSWNvbnNPcHRpb25zIHtcclxuICBpY29uV2hpdGVsaXN0OiBzdHJpbmdbXTtcclxufVxyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBXZWJwYWNrIHBsdWdpbiB0aGF0IHRyZWUtc2hha2VzIHVudXNlZCBVbmljb24gcGF0aHMgZnJvbSBVbmljb25QYXRocy5qc29uIGluIHByb2R1Y3Rpb24gYnVpbGRzLlxyXG4gKlxyXG4gKiBAcGFyYW0ge1RyZWVTaGFrZUNhcmVJY29uc09wdGlvbnN9IFtvcHRpb25zXSAtIE9wdGlvbmFsIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy4gRGVmYXVsdHMgdG8gYW4gZW1wdHkgaWNvbldoaXRlbGlzdC5cclxuICogQHJldHVybnMge1BsdWdpbn0gV2VicGFjayBwbHVnaW4gb2JqZWN0LlxyXG4gKi9cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB0cmVlU2hha2VDYXJlSWNvbnMoXHJcbiAgb3B0aW9uczogVHJlZVNoYWtlQ2FyZUljb25zT3B0aW9ucyA9IHsgaWNvbldoaXRlbGlzdDogW10gfSxcclxuKTogUGx1Z2luIHtcclxuICBjb25zdCByb290RGlyID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuLlwiKTsgLy8gdXBkYXRlIHRoaXMgaWYgbW92aW5nIHRoaXMgY29kZSB0byBhIGRpZmZlcmVudCBmaWxlXHJcbiAgY29uc3QgbGluZUljb25OYW1lUmVnZXggPSAvXCJsLVthLXpdKyg/Oi1bYS16XSspKlwiL2c7XHJcbiAgY29uc3QgYWxsVW5pY29uUGF0aHMgPSBKU09OLnBhcnNlKFxyXG4gICAgZnMucmVhZEZpbGVTeW5jKFxyXG4gICAgICBwYXRoLnJlc29sdmUocm9vdERpciwgXCJzcmMvQ0FSRVVJL2ljb25zL1VuaWNvblBhdGhzLmpzb25cIiksXHJcbiAgICAgIFwidXRmOFwiLFxyXG4gICAgKSxcclxuICApO1xyXG5cclxuICAvLyBFeHRyYWN0cyBpY29uIG5hbWVzIGZyb20gYSBnaXZlbiBmaWxlJ3MgY29udGVudC5cclxuICAvLyBSZXR1cm5zIGFuIGFycmF5IG9mIGljb24gbmFtZXMgbGlrZSBbXCJsLWV5ZVwiLCBcImwtc3luY1wiLCBcImwtaGVhcmJlYXRcIl1cclxuICBmdW5jdGlvbiBleHRyYWN0Q2FyZUljb25OYW1lcyhmaWxlOiBzdHJpbmcpOiBzdHJpbmdbXSB7XHJcbiAgICBjb25zdCBmaWxlQ29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhmaWxlLCBcInV0ZjhcIik7XHJcblxyXG4gICAgY29uc3QgbGluZUljb25OYW1lTWF0Y2hlcyA9IGZpbGVDb250ZW50Lm1hdGNoKGxpbmVJY29uTmFtZVJlZ2V4KSB8fCBbXTtcclxuXHJcbiAgICBjb25zdCBsaW5lSWNvbk5hbWVzID0gbGluZUljb25OYW1lTWF0Y2hlcy5tYXAoXHJcbiAgICAgIChsaW5lSWNvbk5hbWUpID0+IGxpbmVJY29uTmFtZS5zbGljZSgxLCAtMSksIC8vIHJlbW92ZSBxdW90ZXNcclxuICAgICk7XHJcblxyXG4gICAgcmV0dXJuIGxpbmVJY29uTmFtZXM7XHJcbiAgfVxyXG4gIC8vIEZpbmRzIGFsbCB1c2VkIGljb24gbmFtZXMgd2l0aGluIHRoZSBwcm9qZWN0J3Mgc291cmNlIGZpbGVzIChgLnRzeGAgb3IgYC5yZXNgIGV4dGVuc2lvbnMpLlxyXG4gIGZ1bmN0aW9uIGdldEFsbFVzZWRJY29uTmFtZXMoKSB7XHJcbiAgICBjb25zdCBmaWxlcyA9IGdsb2JTeW5jKHBhdGgucmVzb2x2ZShyb290RGlyLCBcInthcHBzLHNyY30vKiovKi57dHN4LHJlc31cIikpO1xyXG4gICAgY29uc3QgdXNlZEljb25zQXJyYXk6IHN0cmluZ1tdID0gW107XHJcblxyXG4gICAgZmlsZXMuZm9yRWFjaCgoZmlsZSkgPT4ge1xyXG4gICAgICBjb25zdCBpY29uTmFtZXMgPSBleHRyYWN0Q2FyZUljb25OYW1lcyhmaWxlKTtcclxuICAgICAgdXNlZEljb25zQXJyYXkucHVzaCguLi5pY29uTmFtZXMpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIG5ldyBTZXQodXNlZEljb25zQXJyYXkpO1xyXG4gIH1cclxuICAvLyBHZW5lcmF0ZXMgYSBtYXAgb2YgdXNlZCBpY29uIG5hbWVzIHRvIHRoZWlyIHBhdGhzIGZyb20gVW5pY29uUGF0aHMuanNvbiwgaW5jbHVkaW5nIGFueSB3aGl0ZWxpc3RlZCBpY29ucy5cclxuICBmdW5jdGlvbiBnZXRUcmVlU2hha2VuVW5pY29uUGF0aHMoKSB7XHJcbiAgICBjb25zdCB1c2VkSWNvbnMgPSBbLi4uZ2V0QWxsVXNlZEljb25OYW1lcygpLCAuLi5vcHRpb25zLmljb25XaGl0ZWxpc3RdO1xyXG4gICAgY29uc3QgdHJlZXNoYWtlbkNhcmVJY29uUGF0aHM6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0gPSB7fTtcclxuXHJcbiAgICBmb3IgKGNvbnN0IGljb25OYW1lIG9mIHVzZWRJY29ucykge1xyXG4gICAgICBjb25zdCBwYXRoID0gYWxsVW5pY29uUGF0aHNbaWNvbk5hbWVdO1xyXG4gICAgICBpZiAocGF0aCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJY29uICR7aWNvbk5hbWV9IGlzIG5vdCBmb3VuZCBpbiBVbmljb25QYXRocy5qc29uYCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdHJlZXNoYWtlbkNhcmVJY29uUGF0aHNbaWNvbk5hbWVdID0gcGF0aDtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0cmVlc2hha2VuQ2FyZUljb25QYXRocztcclxuICB9XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICBuYW1lOiBcInRyZWUtc2hha2UtY2FyZS1pY29uc1wiLFxyXG4gICAgdHJhbnNmb3JtKF9zcmMsIGlkKSB7XHJcbiAgICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIFJlcGxhY2UgdGhlIFVuaWNvblBhdGhzIHdpdGggdGhlIHRyZWUtc2hha2VuIHZlcnNpb25cclxuICAgICAgaWYgKGlkLmVuZHNXaXRoKFwiVW5pY29uUGF0aHMuanNvblwiKSkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICBjb2RlOiBgZXhwb3J0IGRlZmF1bHQgJHtKU09OLnN0cmluZ2lmeShnZXRUcmVlU2hha2VuVW5pY29uUGF0aHMoKSl9YCxcclxuICAgICAgICAgIG1hcDogbnVsbCxcclxuICAgICAgICB9O1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gIH07XHJcbn1cclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUE4UCxTQUFTLG1CQUFtQjtBQUMxUixPQUFPLGdCQUFnQjtBQUN2QixPQUFPLGVBQWU7QUFDdEIsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sZUFBZTtBQUN0QixPQUFPQSxTQUFRO0FBQ2YsU0FBUyxhQUFhO0FBQ3RCLFNBQVMsY0FBYztBQUN2QixTQUFTLHFCQUFxQjtBQUM5QixPQUFPQyxXQUFVO0FBQ2pCLFNBQVMsY0FBYyxlQUFlO0FBQ3RDLE9BQU8sYUFBYTtBQUNwQixTQUFTLGVBQWU7QUFDeEIsU0FBUyxzQkFBc0I7QUFDL0IsU0FBUyxTQUFTOzs7QUNka1IsWUFBWSxRQUFRO0FBQ3hULFNBQVMsZ0JBQWdCO0FBQ3pCLFlBQVksVUFBVTtBQUZ0QixJQUFNLG1DQUFtQztBQXVCbEMsU0FBUyxtQkFDZCxVQUFxQyxFQUFFLGVBQWUsQ0FBQyxFQUFFLEdBQ2pEO0FBQ1IsUUFBTSxVQUFlLGFBQVEsa0NBQVcsSUFBSTtBQUM1QyxRQUFNLG9CQUFvQjtBQUMxQixRQUFNLGlCQUFpQixLQUFLO0FBQUEsSUFDdkI7QUFBQSxNQUNJLGFBQVEsU0FBUyxtQ0FBbUM7QUFBQSxNQUN6RDtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBSUEsV0FBUyxxQkFBcUIsTUFBd0I7QUFDcEQsVUFBTSxjQUFpQixnQkFBYSxNQUFNLE1BQU07QUFFaEQsVUFBTSxzQkFBc0IsWUFBWSxNQUFNLGlCQUFpQixLQUFLLENBQUM7QUFFckUsVUFBTSxnQkFBZ0Isb0JBQW9CO0FBQUEsTUFDeEMsQ0FBQyxpQkFBaUIsYUFBYSxNQUFNLEdBQUcsRUFB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Q0YsQ0FBQztBQUFBLElBQ0g7QUFBQSxJQUNBLFNBQVM7QUFBQSxNQUNQLE9BQU87QUFBQSxRQUNMLEdBQUcsaUJBQWlCO0FBQUEsUUFDcEIsS0FBS0osTUFBSyxRQUFRQyxtQ0FBVyxPQUFPO0FBQUEsUUFDcEMsZUFBZUQsTUFBSyxRQUFRQyxtQ0FBVyxrQkFBa0I7QUFBQSxRQUN6RCxTQUFTRCxNQUFLLFFBQVFDLG1DQUFXLE1BQU07QUFBQSxNQUN6QztBQUFBLElBQ0Y7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQUlBLE9BQU87QUFBQSxNQUNMLFFBQVE7QUFBQSxNQUNSLFFBQVE7QUFBQSxNQUNSLFdBQVc7QUFBQSxJQUNiO0FBQUEsSUFDQSxTQUFTO0FBQUEsTUFDUCxRQUFRO0FBQUEsSUFDVjtBQUFBLElBQ0EsUUFBUTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sY0FBYztBQUFBLElBQ2hCO0FBQUEsSUFDQSxTQUFTO0FBQUEsTUFDUCxTQUFTO0FBQUEsUUFDUCx1Q0FBdUMsa0hBRUksT0FBTyxnQ0FDNUIsT0FBTztBQUFBLE1BQy9CO0FBQUEsTUFDQSxNQUFNO0FBQUEsSUFDUjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogWyJmcyIsICJwYXRoIiwgInBhdGgiLCAiX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUiLCAicGF0aCIsICJfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSIsICJmcyIsICJvcmciLCAicmVwbyJdCn0K
