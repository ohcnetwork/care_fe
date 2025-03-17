// vite.config.mts
import { ValidateEnv } from "file:///workspace/care_fe/node_modules/@julr/vite-plugin-validate-env/dist/index.js";
import federation from "file:///workspace/care_fe/node_modules/@originjs/vite-plugin-federation/dist/index.mjs";
import reactScan from "file:///workspace/care_fe/node_modules/@react-scan/vite-plugin-react-scan/dist/index.js";
import react from "file:///workspace/care_fe/node_modules/@vitejs/plugin-react/dist/index.mjs";
import DOMPurify from "file:///workspace/care_fe/node_modules/dompurify/dist/purify.es.mjs";
import fs2 from "fs";
import { JSDOM } from "file:///workspace/care_fe/node_modules/jsdom/lib/api.js";
import { marked } from "file:///workspace/care_fe/node_modules/marked/lib/marked.esm.js";
import { createRequire } from "node:module";
import path2 from "path";
import { defineConfig, loadEnv } from "file:///workspace/care_fe/node_modules/vite/dist/node/index.js";
import checker from "file:///workspace/care_fe/node_modules/vite-plugin-checker/dist/main.js";
import { VitePWA } from "file:///workspace/care_fe/node_modules/vite-plugin-pwa/dist/index.js";
import { viteStaticCopy } from "file:///workspace/care_fe/node_modules/vite-plugin-static-copy/dist/index.js";
import { z } from "file:///workspace/care_fe/node_modules/zod/lib/index.mjs";

// plugins/treeShakeCareIcons.ts
import * as fs from "fs";
import { globSync } from "file:///workspace/care_fe/node_modules/glob/dist/esm/index.js";
import * as path from "path";
var __vite_injected_original_dirname = "/workspace/care_fe/plugins";
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
var __vite_injected_original_dirname2 = "/workspace/care_fe";
var __vite_injected_original_import_meta_url = "file:///workspace/care_fe/vite.config.mts";
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
      "process.env.IS_PREACT": JSON.stringify("true"),
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcubXRzIiwgInBsdWdpbnMvdHJlZVNoYWtlQ2FyZUljb25zLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL3dvcmtzcGFjZS9jYXJlX2ZlXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvd29ya3NwYWNlL2NhcmVfZmUvdml0ZS5jb25maWcubXRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy93b3Jrc3BhY2UvY2FyZV9mZS92aXRlLmNvbmZpZy5tdHNcIjtpbXBvcnQgeyBWYWxpZGF0ZUVudiB9IGZyb20gXCJAanVsci92aXRlLXBsdWdpbi12YWxpZGF0ZS1lbnZcIjtcbmltcG9ydCBmZWRlcmF0aW9uIGZyb20gXCJAb3JpZ2luanMvdml0ZS1wbHVnaW4tZmVkZXJhdGlvblwiO1xuaW1wb3J0IHJlYWN0U2NhbiBmcm9tIFwiQHJlYWN0LXNjYW4vdml0ZS1wbHVnaW4tcmVhY3Qtc2NhblwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xuaW1wb3J0IERPTVB1cmlmeSBmcm9tIFwiZG9tcHVyaWZ5XCI7XG5pbXBvcnQgZnMgZnJvbSBcImZzXCI7XG5pbXBvcnQgeyBKU0RPTSB9IGZyb20gXCJqc2RvbVwiO1xuaW1wb3J0IHsgbWFya2VkIH0gZnJvbSBcIm1hcmtlZFwiO1xuaW1wb3J0IHsgY3JlYXRlUmVxdWlyZSB9IGZyb20gXCJub2RlOm1vZHVsZVwiO1xuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IGRlZmluZUNvbmZpZywgbG9hZEVudiB9IGZyb20gXCJ2aXRlXCI7XG5pbXBvcnQgY2hlY2tlciBmcm9tIFwidml0ZS1wbHVnaW4tY2hlY2tlclwiO1xuaW1wb3J0IHsgVml0ZVBXQSB9IGZyb20gXCJ2aXRlLXBsdWdpbi1wd2FcIjtcbmltcG9ydCB7IHZpdGVTdGF0aWNDb3B5IH0gZnJvbSBcInZpdGUtcGx1Z2luLXN0YXRpYy1jb3B5XCI7XG5pbXBvcnQgeyB6IH0gZnJvbSBcInpvZFwiO1xuXG5pbXBvcnQgeyB0cmVlU2hha2VDYXJlSWNvbnMgfSBmcm9tIFwiLi9wbHVnaW5zL3RyZWVTaGFrZUNhcmVJY29uc1wiO1xuXG5jb25zdCBwZGZXb3JrZXJQYXRoID0gcGF0aC5qb2luKFxuICBwYXRoLmRpcm5hbWUoXG4gICAgY3JlYXRlUmVxdWlyZShpbXBvcnQubWV0YS51cmwpLnJlc29sdmUoXCJwZGZqcy1kaXN0L3BhY2thZ2UuanNvblwiKSxcbiAgKSxcbiAgXCJidWlsZFwiLFxuICBcInBkZi53b3JrZXIubWluLm1qc1wiLFxuKTtcblxuLy8gQ29udmVydCBnb2FsIGRlc2NyaXB0aW9uIG1hcmtkb3duIHRvIEhUTUxcbmZ1bmN0aW9uIGdldERlc2NyaXB0aW9uSHRtbChkZXNjcmlwdGlvbjogc3RyaW5nKSB7XG4gIC8vIG5vdGU6IGVzY2FwZWQgZGVzY3JpcHRpb24gY2F1c2VzIGlzc3VlcyB3aXRoIG1hcmtkb3duIHBhcnNpbmdcbiAgY29uc3QgaHRtbCA9IG1hcmtlZC5wYXJzZShkZXNjcmlwdGlvbiwge1xuICAgIGFzeW5jOiBmYWxzZSxcbiAgICBnZm06IHRydWUsXG4gICAgYnJlYWtzOiB0cnVlLFxuICB9KTtcbiAgY29uc3QgcHVyaWZ5ID0gRE9NUHVyaWZ5KG5ldyBKU0RPTShcIlwiKS53aW5kb3cpO1xuICBjb25zdCBzYW5pdGl6ZWRIdG1sID0gcHVyaWZ5LnNhbml0aXplKGh0bWwpO1xuICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoc2FuaXRpemVkSHRtbCk7XG59XG5cbmZ1bmN0aW9uIGdldFBsdWdpbkFsaWFzZXMoKSB7XG4gIGNvbnN0IHBsdWdpbnNEaXIgPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcImFwcHNcIik7XG4gIC8vIE1ha2Ugc3VyZSB0aGUgYGFwcHNgIGZvbGRlciBleGlzdHNcbiAgaWYgKCFmcy5leGlzdHNTeW5jKHBsdWdpbnNEaXIpKSB7XG4gICAgcmV0dXJuIHt9O1xuICB9XG4gIGNvbnN0IHBsdWdpbkZvbGRlcnMgPSBmcy5yZWFkZGlyU3luYyhwbHVnaW5zRGlyKTtcblxuICBjb25zdCBhbGlhc2VzID0ge307XG5cbiAgcGx1Z2luRm9sZGVycy5mb3JFYWNoKChwbHVnaW5Gb2xkZXIpID0+IHtcbiAgICBjb25zdCBwbHVnaW5TcmNQYXRoID0gcGF0aC5qb2luKHBsdWdpbnNEaXIsIHBsdWdpbkZvbGRlciwgXCJzcmNcIik7XG4gICAgaWYgKGZzLmV4aXN0c1N5bmMocGx1Z2luU3JjUGF0aCkpIHtcbiAgICAgIGFsaWFzZXNbYEBhcHBzLyR7cGx1Z2luRm9sZGVyfWBdID0gcGx1Z2luU3JjUGF0aDtcbiAgICAgIGFsaWFzZXNbYEBhcHAtbWFuaWZlc3QvJHtwbHVnaW5Gb2xkZXJ9YF0gPSBwYXRoLmpvaW4oXG4gICAgICAgIHBsdWdpblNyY1BhdGgsXG4gICAgICAgIFwibWFuaWZlc3QudHNcIixcbiAgICAgICk7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gYWxpYXNlcztcbn1cblxuLyoqXG4gKiBQYXJzZXMgYSByZW1vdGUgYXBwIGNvbmZpZ3VyYXRpb24gc3RyaW5nIGludG8gaXRzIGNvbXBvbmVudHNcbiAqIEBwYXJhbSBhcHBDb25maWcgLSBDb25maWd1cmF0aW9uIHN0cmluZyBmb3IgYSByZW1vdGUgYXBwXG4gKiBAcmV0dXJucyBQYXJzZWQgY29uZmlndXJhdGlvbiBvYmplY3RcbiAqL1xuaW50ZXJmYWNlIFBhcnNlZFJlbW90ZUNvbmZpZyB7XG4gIHVybDogc3RyaW5nO1xuICBvcmc6IHN0cmluZztcbiAgcmVwbzogc3RyaW5nO1xufVxuXG5mdW5jdGlvbiBwYXJzZVJlbW90ZUNvbmZpZyhhcHBDb25maWc6IHN0cmluZyk6IFBhcnNlZFJlbW90ZUNvbmZpZyB7XG4gIGlmICghYXBwQ29uZmlnLmluY2x1ZGVzKFwiL1wiKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgIGBJbnZhbGlkIGFwcCBjb25maWd1cmF0aW9uIGZvcm1hdDogJHthcHBDb25maWd9LiBFeHBlY3RlZCAnb3JnL3JlcG8nIG9yICdvcmcvcmVwb0B1cmwnLmAsXG4gICAgKTtcbiAgfVxuICAvLyBIYW5kbGUgY3VzdG9tIFVSTHMgKGJvdGggbG9jYWxob3N0IGFuZCBjdXN0b20gaG9zdGVkKVxuICBpZiAoYXBwQ29uZmlnLmluY2x1ZGVzKFwiQFwiKSkge1xuICAgIGNvbnN0IFtwYWNrYWdlXywgdXJsXSA9IGFwcENvbmZpZy5zcGxpdChcIkBcIik7XG4gICAgY29uc3QgW29yZywgcmVwb10gPSBwYWNrYWdlXy5zcGxpdChcIi9cIik7XG4gICAgaWYgKCFvcmcgfHwgIXJlcG8gfHwgIXVybCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgSW52YWxpZCBjdXN0b20gVVJMIGNvbmZpZ3VyYXRpb246ICR7YXBwQ29uZmlnfS4gRXhwZWN0ZWQgJ29yZy9yZXBvQHVybCcuYCxcbiAgICAgICk7XG4gICAgfVxuICAgIC8vIEFkZCBhcHByb3ByaWF0ZSBwcm90b2NvbCBiYXNlZCBvbiB3aGV0aGVyIGl0J3MgbG9jYWxob3N0XG4gICAgY29uc3QgcHJvdG9jb2wgPSB1cmwuaW5jbHVkZXMoXCJsb2NhbGhvc3RcIikgPyBcImh0dHA6Ly9cIiA6IFwiaHR0cHM6Ly9cIjtcbiAgICBjb25zdCBmdWxsVXJsID0gdXJsLnN0YXJ0c1dpdGgoXCJodHRwXCIpID8gdXJsIDogYCR7cHJvdG9jb2x9JHt1cmx9YDtcblxuICAgIHJldHVybiB7XG4gICAgICB1cmw6IGAke2Z1bGxVcmx9L2Fzc2V0cy9yZW1vdGVFbnRyeS5qc2AsXG4gICAgICBvcmcsXG4gICAgICByZXBvLFxuICAgIH07XG4gIH1cblxuICAvLyBIYW5kbGUgR2l0SHViIFBhZ2VzIFVSTHNcbiAgY29uc3QgW29yZywgcmVwb10gPSBhcHBDb25maWcuc3BsaXQoXCIvXCIpO1xuICBpZiAoIW9yZyB8fCAhcmVwbykge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgIGBJbnZhbGlkIEdpdEh1YiBQYWdlcyBjb25maWd1cmF0aW9uOiAke2FwcENvbmZpZ30uIEV4cGVjdGVkICdvcmcvcmVwbycuYCxcbiAgICApO1xuICB9XG4gIHJldHVybiB7XG4gICAgdXJsOiBgaHR0cHM6Ly8ke29yZ30uZ2l0aHViLmlvLyR7cmVwb30vYXNzZXRzL3JlbW90ZUVudHJ5LmpzYCxcbiAgICBvcmcsXG4gICAgcmVwbyxcbiAgfTtcbn1cblxuLyoqXG4gKiBHZW5lcmF0ZXMgcmVtb3RlIG1vZHVsZSBjb25maWd1cmF0aW9ucyBmb3IgTW9kdWxlIEZlZGVyYXRpb25cbiAqXG4gKiBTdXBwb3J0cyB0d28gZm9ybWF0cyBmb3IgUkVBQ1RfRU5BQkxFRF9BUFBTOlxuICogMS4gR2l0SHViIFBhZ2VzOiBcIm9yZ2FuaXphdGlvbi9yZXBvc2l0b3J5XCJcbiAqICAgIEV4YW1wbGU6IFwiY29yb25hc2FmZS9jYXJlX2ZlXCJcbiAqXG4gKiAyLiBDdXN0b20gVVJMOiBcIm9yZ2FuaXphdGlvbi9yZXBvc2l0b3J5QHVybFwiXG4gKiAgICBFeGFtcGxlOiBcImNvcm9uYXNhZmUvY2FyZV9mZUBsb2NhbGhvc3Q6NTE3M1wiXG4gKiAgICBFeGFtcGxlOiBcImNvcm9uYXNhZmUvY2FyZV9mZUBjYXJlLmNvcm9uYXNhZmUubmV0d29ya1wiXG4gKiAgICBOb3RlOiBQcm90b2NvbCAoaHR0cC9odHRwcykgaXMgYXV0b21hdGljYWxseSBhZGRlZCBiYXNlZCBvbiB0aGUgVVJMOlxuICogICAgLSBsb2NhbGhvc3QgVVJMcyB1c2UgaHR0cDovL1xuICogICAgLSBhbGwgb3RoZXIgVVJMcyB1c2UgaHR0cHM6Ly9cbiAqXG4gKiBAcGFyYW0gZW5hYmxlZEFwcHMgLSBDb21tYS1zZXBhcmF0ZWQgbGlzdCBvZiBlbmFibGVkIGFwcHNcbiAqIEByZXR1cm5zIFJlbW90ZSBtb2R1bGUgY29uZmlndXJhdGlvbiBvYmplY3QgZm9yIE1vZHVsZSBGZWRlcmF0aW9uXG4gKi9cbmZ1bmN0aW9uIGdldFJlbW90ZXMoZW5hYmxlZEFwcHM6IHN0cmluZykge1xuICBpZiAoIWVuYWJsZWRBcHBzKSByZXR1cm4ge307XG5cbiAgcmV0dXJuIGVuYWJsZWRBcHBzLnNwbGl0KFwiLFwiKS5yZWR1Y2UoKGFjYywgYXBwKSA9PiB7XG4gICAgY29uc3QgeyByZXBvLCB1cmwgfSA9IHBhcnNlUmVtb3RlQ29uZmlnKGFwcCk7XG4gICAgY29uc29sZS5sb2coYENvbmZpZ3VyaW5nIFJlbW90ZSBNb2R1bGUgZm9yICR7cmVwb306YCwgdXJsKTtcblxuICAgIHJldHVybiB7XG4gICAgICAuLi5hY2MsXG4gICAgICBbcmVwb106IHtcbiAgICAgICAgZXh0ZXJuYWw6IGBQcm9taXNlLnJlc29sdmUoXCIke3VybH1cIilgLFxuICAgICAgICBmcm9tOiBcInZpdGVcIixcbiAgICAgICAgZXh0ZXJuYWxUeXBlOiBcInByb21pc2VcIixcbiAgICAgIH0sXG4gICAgfTtcbiAgfSwge30pO1xufVxuXG4vKiogQHR5cGUge2ltcG9ydCgndml0ZScpLlVzZXJDb25maWd9ICovXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiB7XG4gIGNvbnN0IGVudiA9IGxvYWRFbnYobW9kZSwgcHJvY2Vzcy5jd2QoKSwgXCJcIik7XG5cbiAgY29uc3QgY2RuVXJscyA9XG4gICAgZW52LlJFQUNUX0NETl9VUkxTIHx8XG4gICAgW1xuICAgICAgXCJodHRwczovL2Vnb3YtczMtZmFjaWxpdHktMTBiZWRpY3UuczMuYW1hem9uYXdzLmNvbVwiLFxuICAgICAgXCJodHRwczovL2Vnb3YtczMtcGF0aWVudC1kYXRhLTEwYmVkaWN1LnMzLmFtYXpvbmF3cy5jb21cIixcbiAgICAgIFwiaHR0cDovL2xvY2FsaG9zdDo0NTY2XCIsXG4gICAgXS5qb2luKFwiIFwiKTtcblxuICByZXR1cm4ge1xuICAgIGVudlByZWZpeDogXCJSRUFDVF9cIixcbiAgICBkZWZpbmU6IHtcbiAgICAgIFwicHJvY2Vzcy5lbnYuSVNfUFJFQUNUXCI6IEpTT04uc3RyaW5naWZ5KFwidHJ1ZVwiKSxcbiAgICAgIF9fQ1VTVE9NX0RFU0NSSVBUSU9OX0hUTUxfXzogZ2V0RGVzY3JpcHRpb25IdG1sKFxuICAgICAgICBlbnYuUkVBQ1RfQ1VTVE9NX0RFU0NSSVBUSU9OIHx8IFwiXCIsXG4gICAgICApLFxuICAgIH0sXG4gICAgcGx1Z2luczogW1xuICAgICAgZmVkZXJhdGlvbih7XG4gICAgICAgIG5hbWU6IFwiY29yZVwiLFxuICAgICAgICByZW1vdGVzOiBnZXRSZW1vdGVzKGVudi5SRUFDVF9FTkFCTEVEX0FQUFMpLFxuICAgICAgICAvLyB7XG4gICAgICAgIC8vIGNhcmVfbGl2ZWtpdF9mZToge1xuICAgICAgICAvLyAgIGV4dGVybmFsOiBgUHJvbWlzZS5yZXNvbHZlKFwiaHR0cDovL2xvY2FsaG9zdDo1MTczL2Fzc2V0cy9yZW1vdGVFbnRyeS5qc1wiKWAsXG4gICAgICAgIC8vICAgZXh0ZXJuYWxUeXBlOiBcInByb21pc2VcIixcbiAgICAgICAgLy8gICBmcm9tOiBcInZpdGVcIixcbiAgICAgICAgLy8gfSxcbiAgICAgICAgLy8gfSxcbiAgICAgICAgc2hhcmVkOiBbXG4gICAgICAgICAgXCJyZWFjdFwiLFxuICAgICAgICAgIFwicmVhY3QtZG9tXCIsXG4gICAgICAgICAgXCJyZWFjdC1pMThuZXh0XCIsXG4gICAgICAgICAgXCJAdGFuc3RhY2svcmVhY3QtcXVlcnlcIixcbiAgICAgICAgXSxcbiAgICAgIH0pLFxuICAgICAgVmFsaWRhdGVFbnYoe1xuICAgICAgICB2YWxpZGF0b3I6IFwiem9kXCIsXG4gICAgICAgIHNjaGVtYToge1xuICAgICAgICAgIFJFQUNUX0NBUkVfQVBJX1VSTDogei5zdHJpbmcoKS51cmwoKSxcblxuICAgICAgICAgIFJFQUNUX1NFTlRSWV9EU046IHouc3RyaW5nKCkudXJsKCkub3B0aW9uYWwoKSxcbiAgICAgICAgICBSRUFDVF9TRU5UUllfRU5WSVJPTk1FTlQ6IHouc3RyaW5nKCkub3B0aW9uYWwoKSxcblxuICAgICAgICAgIFJFQUNUX0NETl9VUkxTOiB6XG4gICAgICAgICAgICAuc3RyaW5nKClcbiAgICAgICAgICAgIC5vcHRpb25hbCgpXG4gICAgICAgICAgICAudHJhbnNmb3JtKCh2YWwpID0+IHZhbD8uc3BsaXQoXCIgXCIpKVxuICAgICAgICAgICAgLnBpcGUoei5hcnJheSh6LnN0cmluZygpLnVybCgpKS5vcHRpb25hbCgpKVxuICAgICAgICAgICAgLmRlc2NyaWJlKFwiT3B0aW9uYWw6IFNwYWNlLXNlcGFyYXRlZCBsaXN0IG9mIENETiBVUkxzXCIpLFxuICAgICAgICB9LFxuICAgICAgfSksXG4gICAgICB2aXRlU3RhdGljQ29weSh7XG4gICAgICAgIHRhcmdldHM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzcmM6IHBkZldvcmtlclBhdGgsXG4gICAgICAgICAgICBkZXN0OiBcIlwiLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICB9KSxcbiAgICAgIHJlYWN0KCksXG4gICAgICByZWFjdFNjYW4oe1xuICAgICAgICBlbmFibGU6XG4gICAgICAgICAgZW52Lk5PREVfRU5WID09PSBcImRldmVsb3BtZW50XCIgJiYgZW52LkVOQUJMRV9SRUFDVF9TQ0FOID09PSBcInRydWVcIixcbiAgICAgIH0pLFxuICAgICAgY2hlY2tlcih7XG4gICAgICAgIHR5cGVzY3JpcHQ6IHRydWUsXG4gICAgICAgIGVzbGludDoge1xuICAgICAgICAgIHVzZUZsYXRDb25maWc6IHRydWUsXG4gICAgICAgICAgbGludENvbW1hbmQ6IFwiZXNsaW50IC4vc3JjXCIsXG4gICAgICAgICAgZGV2OiB7XG4gICAgICAgICAgICBsb2dMZXZlbDogW1wiZXJyb3JcIl0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIH0pLFxuICAgICAgdHJlZVNoYWtlQ2FyZUljb25zKHtcbiAgICAgICAgaWNvbldoaXRlbGlzdDogW1wiZGVmYXVsdFwiXSxcbiAgICAgIH0pLFxuICAgICAgVml0ZVBXQSh7XG4gICAgICAgIHN0cmF0ZWdpZXM6IFwiaW5qZWN0TWFuaWZlc3RcIixcbiAgICAgICAgc3JjRGlyOiBcInNyY1wiLFxuICAgICAgICBmaWxlbmFtZTogXCJzZXJ2aWNlLXdvcmtlci50c1wiLFxuICAgICAgICBpbmplY3RSZWdpc3RlcjogXCJzY3JpcHQtZGVmZXJcIixcbiAgICAgICAgZGV2T3B0aW9uczoge1xuICAgICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgdHlwZTogXCJtb2R1bGVcIixcbiAgICAgICAgfSxcbiAgICAgICAgaW5qZWN0TWFuaWZlc3Q6IHtcbiAgICAgICAgICBtYXhpbXVtRmlsZVNpemVUb0NhY2hlSW5CeXRlczogNzAwMDAwMCxcbiAgICAgICAgfSxcbiAgICAgICAgbWFuaWZlc3Q6IHtcbiAgICAgICAgICBuYW1lOiBcIkNhcmVcIixcbiAgICAgICAgICBzaG9ydF9uYW1lOiBcIkNhcmVcIixcbiAgICAgICAgICBiYWNrZ3JvdW5kX2NvbG9yOiBcIiNmZmZmZmZcIixcbiAgICAgICAgICB0aGVtZV9jb2xvcjogXCIjZmZmZmZmXCIsXG4gICAgICAgICAgZGlzcGxheTogXCJzdGFuZGFsb25lXCIsXG4gICAgICAgICAgaWNvbnM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgc3JjOiBcImltYWdlcy9pY29ucy9wd2EtNjR4NjQucG5nXCIsXG4gICAgICAgICAgICAgIHNpemVzOiBcIjY0eDY0XCIsXG4gICAgICAgICAgICAgIHR5cGU6IFwiaW1hZ2UvcG5nXCIsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBzcmM6IFwiaW1hZ2VzL2ljb25zL3B3YS0xOTJ4MTkyLnBuZ1wiLFxuICAgICAgICAgICAgICBzaXplczogXCIxOTJ4MTkyXCIsXG4gICAgICAgICAgICAgIHR5cGU6IFwiaW1hZ2UvcG5nXCIsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBzcmM6IFwiaW1hZ2VzL2ljb25zL3B3YS01MTJ4NTEyLnBuZ1wiLFxuICAgICAgICAgICAgICBzaXplczogXCI1MTJ4NTEyXCIsXG4gICAgICAgICAgICAgIHR5cGU6IFwiaW1hZ2UvcG5nXCIsXG4gICAgICAgICAgICAgIHB1cnBvc2U6IFwiYW55XCIsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBzcmM6IFwiaW1hZ2VzL2ljb25zL21hc2thYmxlLWljb24tNTEyeDUxMi5wbmdcIixcbiAgICAgICAgICAgICAgc2l6ZXM6IFwiNTEyeDUxMlwiLFxuICAgICAgICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxuICAgICAgICAgICAgICBwdXJwb3NlOiBcIm1hc2thYmxlXCIsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICB9KSxcbiAgICBdLFxuICAgIHJlc29sdmU6IHtcbiAgICAgIGFsaWFzOiB7XG4gICAgICAgIC4uLmdldFBsdWdpbkFsaWFzZXMoKSxcbiAgICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXG4gICAgICAgIFwiQGNhcmVDb25maWdcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL2NhcmUuY29uZmlnLnRzXCIpLFxuICAgICAgICBcIkBjb3JlXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwic3JjL1wiKSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICAvLyBvcHRpbWl6ZURlcHM6IHtcbiAgICAvLyAgIGluY2x1ZGU6IGdldFBsdWdpbkRlcGVuZGVuY2llcygpLFxuICAgIC8vIH0sXG4gICAgYnVpbGQ6IHtcbiAgICAgIHRhcmdldDogXCJlczIwMjJcIixcbiAgICAgIG91dERpcjogXCJidWlsZFwiLFxuICAgICAgc291cmNlbWFwOiB0cnVlLFxuICAgIH0sXG4gICAgZXNidWlsZDoge1xuICAgICAgdGFyZ2V0OiBcImVzMjAyMlwiLFxuICAgIH0sXG4gICAgc2VydmVyOiB7XG4gICAgICBwb3J0OiA0MDAwLFxuICAgICAgaG9zdDogXCIwLjAuMC4wXCIsXG4gICAgICBhbGxvd2VkSG9zdHM6IHRydWUsXG4gICAgfSxcbiAgICBwcmV2aWV3OiB7XG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIFwiQ29udGVudC1TZWN1cml0eS1Qb2xpY3ktUmVwb3J0LU9ubHlcIjogYGRlZmF1bHQtc3JjICdzZWxmJztcXFxuICAgICAgICAgIHN0eWxlLXNyYyAnc2VsZicgJ3Vuc2FmZS1pbmxpbmUnO1xcXG4gICAgICAgICAgaW1nLXNyYyAnc2VsZicgaHR0cHM6Ly9jZG4ub2hjLm5ldHdvcmsgJHtjZG5VcmxzfTtcXFxuICAgICAgICAgIG9iamVjdC1zcmMgJ3NlbGYnICR7Y2RuVXJsc307YCxcbiAgICAgIH0sXG4gICAgICBwb3J0OiA0MDAwLFxuICAgIH0sXG4gIH07XG59KTtcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL3dvcmtzcGFjZS9jYXJlX2ZlL3BsdWdpbnNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi93b3Jrc3BhY2UvY2FyZV9mZS9wbHVnaW5zL3RyZWVTaGFrZUNhcmVJY29ucy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vd29ya3NwYWNlL2NhcmVfZmUvcGx1Z2lucy90cmVlU2hha2VDYXJlSWNvbnMudHNcIjtpbXBvcnQgKiBhcyBmcyBmcm9tIFwiZnNcIjtcbmltcG9ydCB7IGdsb2JTeW5jIH0gZnJvbSBcImdsb2JcIjtcbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IFBsdWdpbiB9IGZyb20gXCJ2aXRlXCI7XG5cbi8qKlxuICogSW50ZXJmYWNlIGRlZmluaW5nIG9wdGlvbnMgZm9yIHRoZSB0cmVlU2hha2VVbmljb25QYXRoc1BsdWdpbi5cbiAqXG4gKiBAaW50ZXJmYWNlIFRyZWVTaGFrZVVuaWNvblBhdGhzUGx1Z2luT3B0aW9uc1xuICogQHByb3BlcnR5IHtzdHJpbmdbXX0gaWNvbldoaXRlbGlzdCAtIEFuIGFycmF5IG9mIGljb24gbmFtZXMgdG8gYWx3YXlzIGluY2x1ZGUsIGV2ZW4gaWYgbm90IGZvdW5kIGluIGNvZGUuXG4gKi9cblxuZXhwb3J0IGludGVyZmFjZSBUcmVlU2hha2VDYXJlSWNvbnNPcHRpb25zIHtcbiAgaWNvbldoaXRlbGlzdDogc3RyaW5nW107XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIFdlYnBhY2sgcGx1Z2luIHRoYXQgdHJlZS1zaGFrZXMgdW51c2VkIFVuaWNvbiBwYXRocyBmcm9tIFVuaWNvblBhdGhzLmpzb24gaW4gcHJvZHVjdGlvbiBidWlsZHMuXG4gKlxuICogQHBhcmFtIHtUcmVlU2hha2VDYXJlSWNvbnNPcHRpb25zfSBbb3B0aW9uc10gLSBPcHRpb25hbCBjb25maWd1cmF0aW9uIG9wdGlvbnMuIERlZmF1bHRzIHRvIGFuIGVtcHR5IGljb25XaGl0ZWxpc3QuXG4gKiBAcmV0dXJucyB7UGx1Z2lufSBXZWJwYWNrIHBsdWdpbiBvYmplY3QuXG4gKi9cblxuZXhwb3J0IGZ1bmN0aW9uIHRyZWVTaGFrZUNhcmVJY29ucyhcbiAgb3B0aW9uczogVHJlZVNoYWtlQ2FyZUljb25zT3B0aW9ucyA9IHsgaWNvbldoaXRlbGlzdDogW10gfSxcbik6IFBsdWdpbiB7XG4gIGNvbnN0IHJvb3REaXIgPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4uXCIpOyAvLyB1cGRhdGUgdGhpcyBpZiBtb3ZpbmcgdGhpcyBjb2RlIHRvIGEgZGlmZmVyZW50IGZpbGVcbiAgY29uc3QgbGluZUljb25OYW1lUmVnZXggPSAvXCJsLVthLXpdKyg/Oi1bYS16XSspKlwiL2c7XG4gIGNvbnN0IGFsbFVuaWNvblBhdGhzID0gSlNPTi5wYXJzZShcbiAgICBmcy5yZWFkRmlsZVN5bmMoXG4gICAgICBwYXRoLnJlc29sdmUocm9vdERpciwgXCJzcmMvQ0FSRVVJL2ljb25zL1VuaWNvblBhdGhzLmpzb25cIiksXG4gICAgICBcInV0ZjhcIixcbiAgICApLFxuICApO1xuXG4gIC8vIEV4dHJhY3RzIGljb24gbmFtZXMgZnJvbSBhIGdpdmVuIGZpbGUncyBjb250ZW50LlxuICAvLyBSZXR1cm5zIGFuIGFycmF5IG9mIGljb24gbmFtZXMgbGlrZSBbXCJsLWV5ZVwiLCBcImwtc3luY1wiLCBcImwtaGVhcmJlYXRcIl1cbiAgZnVuY3Rpb24gZXh0cmFjdENhcmVJY29uTmFtZXMoZmlsZTogc3RyaW5nKTogc3RyaW5nW10ge1xuICAgIGNvbnN0IGZpbGVDb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKGZpbGUsIFwidXRmOFwiKTtcblxuICAgIGNvbnN0IGxpbmVJY29uTmFtZU1hdGNoZXMgPSBmaWxlQ29udGVudC5tYXRjaChsaW5lSWNvbk5hbWVSZWdleCkgfHwgW107XG5cbiAgICBjb25zdCBsaW5lSWNvbk5hbWVzID0gbGluZUljb25OYW1lTWF0Y2hlcy5tYXAoXG4gICAgICAobGluZUljb25OYW1lKSA9PiBsaW5lSWNvbk5hbWUuc2xpY2UoMSwgLTEpLCAvLyByZW1vdmUgcXVvdGVzXG4gICAgKTtcblxuICAgIHJldHVybiBsaW5lSWNvbk5hbWVzO1xuICB9XG4gIC8vIEZpbmRzIGFsbCB1c2VkIGljb24gbmFtZXMgd2l0aGluIHRoZSBwcm9qZWN0J3Mgc291cmNlIGZpbGVzIChgLnRzeGAgb3IgYC5yZXNgIGV4dGVuc2lvbnMpLlxuICBmdW5jdGlvbiBnZXRBbGxVc2VkSWNvbk5hbWVzKCkge1xuICAgIGNvbnN0IGZpbGVzID0gZ2xvYlN5bmMocGF0aC5yZXNvbHZlKHJvb3REaXIsIFwie2FwcHMsc3JjfS8qKi8qLnt0c3gscmVzfVwiKSk7XG4gICAgY29uc3QgdXNlZEljb25zQXJyYXk6IHN0cmluZ1tdID0gW107XG5cbiAgICBmaWxlcy5mb3JFYWNoKChmaWxlKSA9PiB7XG4gICAgICBjb25zdCBpY29uTmFtZXMgPSBleHRyYWN0Q2FyZUljb25OYW1lcyhmaWxlKTtcbiAgICAgIHVzZWRJY29uc0FycmF5LnB1c2goLi4uaWNvbk5hbWVzKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBuZXcgU2V0KHVzZWRJY29uc0FycmF5KTtcbiAgfVxuICAvLyBHZW5lcmF0ZXMgYSBtYXAgb2YgdXNlZCBpY29uIG5hbWVzIHRvIHRoZWlyIHBhdGhzIGZyb20gVW5pY29uUGF0aHMuanNvbiwgaW5jbHVkaW5nIGFueSB3aGl0ZWxpc3RlZCBpY29ucy5cbiAgZnVuY3Rpb24gZ2V0VHJlZVNoYWtlblVuaWNvblBhdGhzKCkge1xuICAgIGNvbnN0IHVzZWRJY29ucyA9IFsuLi5nZXRBbGxVc2VkSWNvbk5hbWVzKCksIC4uLm9wdGlvbnMuaWNvbldoaXRlbGlzdF07XG4gICAgY29uc3QgdHJlZXNoYWtlbkNhcmVJY29uUGF0aHM6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0gPSB7fTtcblxuICAgIGZvciAoY29uc3QgaWNvbk5hbWUgb2YgdXNlZEljb25zKSB7XG4gICAgICBjb25zdCBwYXRoID0gYWxsVW5pY29uUGF0aHNbaWNvbk5hbWVdO1xuICAgICAgaWYgKHBhdGggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEljb24gJHtpY29uTmFtZX0gaXMgbm90IGZvdW5kIGluIFVuaWNvblBhdGhzLmpzb25gKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRyZWVzaGFrZW5DYXJlSWNvblBhdGhzW2ljb25OYW1lXSA9IHBhdGg7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRyZWVzaGFrZW5DYXJlSWNvblBhdGhzO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBuYW1lOiBcInRyZWUtc2hha2UtY2FyZS1pY29uc1wiLFxuICAgIHRyYW5zZm9ybShfc3JjLCBpZCkge1xuICAgICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIFJlcGxhY2UgdGhlIFVuaWNvblBhdGhzIHdpdGggdGhlIHRyZWUtc2hha2VuIHZlcnNpb25cbiAgICAgIGlmIChpZC5lbmRzV2l0aChcIlVuaWNvblBhdGhzLmpzb25cIikpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBjb2RlOiBgZXhwb3J0IGRlZmF1bHQgJHtKU09OLnN0cmluZ2lmeShnZXRUcmVlU2hha2VuVW5pY29uUGF0aHMoKSl9YCxcbiAgICAgICAgICBtYXA6IG51bGwsXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfSxcbiAgfTtcbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBME8sU0FBUyxtQkFBbUI7QUFDdFEsT0FBTyxnQkFBZ0I7QUFDdkIsT0FBTyxlQUFlO0FBQ3RCLE9BQU8sV0FBVztBQUNsQixPQUFPLGVBQWU7QUFDdEIsT0FBT0EsU0FBUTtBQUNmLFNBQVMsYUFBYTtBQUN0QixTQUFTLGNBQWM7QUFDdkIsU0FBUyxxQkFBcUI7QUFDOUIsT0FBT0MsV0FBVTtBQUNqQixTQUFTLGNBQWMsZUFBZTtBQUN0QyxPQUFPLGFBQWE7QUFDcEIsU0FBUyxlQUFlO0FBQ3hCLFNBQVMsc0JBQXNCO0FBQy9CLFNBQVMsU0FBUzs7O0FDZDRQLFlBQVksUUFBUTtBQUNsUyxTQUFTLGdCQUFnQjtBQUN6QixZQUFZLFVBQVU7QUFGdEIsSUFBTSxtQ0FBbUM7QUF1QmxDLFNBQVMsbUJBQ2QsVUFBcUMsRUFBRSxlQUFlLENBQUMsRUFBRSxHQUNqRDtBQUNSLFFBQU0sVUFBZSxhQUFRLGtDQUFXLElBQUk7QUFDNUMsUUFBTSxvQkFBb0I7QUFDMUIsUUFBTSxpQkFBaUIsS0FBSztBQUFBLElBQ3ZCO0FBQUEsTUFDSSxhQUFRLFNBQVMsbUNBQW1DO0FBQUEsTUFDekQ7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUlBLFdBQVMscUJBQXFCLE1BQXdCO0FBQ3BELFVBQU0sY0FBaUIsZ0JBQWEsTUFBTSxNQUFNO0FBRWhELFVBQU0sc0JBQXNCLFlBQVksTUFBTSxp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QUEsWUFDWDtBQUFBLFlBQ0E7QUFBQSxjQUNFLEtBQUs7QUFBQSxjQUNMLE9BQU87QUFBQSxjQUNQLE1BQU07QUFBQSxjQUNOLFNBQVM7QUFBQSxZQUNYO0FBQUEsVUFDRjtBQUFBLFFBQ0Y7QUFBQSxNQUNGLENBQUM7QUFBQSxJQUNIO0FBQUEsSUFDQSxTQUFTO0FBQUEsTUFDUCxPQUFPO0FBQUEsUUFDTCxHQUFHLGlCQUFpQjtBQUFBLFFBQ3BCLEtBQUtKLE1BQUssUUFBUUMsbUNBQVcsT0FBTztBQUFBLFFBQ3BDLGVBQWVELE1BQUssUUFBUUMsbUNBQVcsa0JBQWtCO0FBQUEsUUFDekQsU0FBU0QsTUFBSyxRQUFRQyxtQ0FBVyxNQUFNO0FBQUEsTUFDekM7QUFBQSxJQUNGO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFJQSxPQUFPO0FBQUEsTUFDTCxRQUFRO0FBQUEsTUFDUixRQUFRO0FBQUEsTUFDUixXQUFXO0FBQUEsSUFDYjtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1AsUUFBUTtBQUFBLElBQ1Y7QUFBQSxJQUNBLFFBQVE7QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLGNBQWM7QUFBQSxJQUNoQjtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1AsU0FBUztBQUFBLFFBQ1AsdUNBQXVDLGtIQUVJLE9BQU8sZ0NBQzVCLE9BQU87QUFBQSxNQUMvQjtBQUFBLE1BQ0EsTUFBTTtBQUFBLElBQ1I7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFsiZnMiLCAicGF0aCIsICJwYXRoIiwgIl9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lIiwgInBhdGgiLCAiX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUiLCAiZnMiLCAib3JnIiwgInJlcG8iXQp9Cg==
