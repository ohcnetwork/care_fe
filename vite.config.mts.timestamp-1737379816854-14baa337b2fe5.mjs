// vite.config.mts
import { ValidateEnv } from "file:///D:/care_fe/node_modules/@julr/vite-plugin-validate-env/dist/index.mjs";
import federation from "file:///D:/care_fe/node_modules/@originjs/vite-plugin-federation/dist/index.mjs";
import react from "file:///D:/care_fe/node_modules/@vitejs/plugin-react/dist/index.mjs";
import DOMPurify from "file:///D:/care_fe/node_modules/dompurify/dist/purify.es.mjs";
import fs2 from "fs";
import { JSDOM } from "file:///D:/care_fe/node_modules/jsdom/lib/api.js";
import { marked } from "file:///D:/care_fe/node_modules/marked/lib/marked.esm.js";
import { createRequire } from "node:module";
import path2 from "path";
import { defineConfig, loadEnv } from "file:///D:/care_fe/node_modules/vite/dist/node/index.js";
import checker from "file:///D:/care_fe/node_modules/vite-plugin-checker/dist/esm/main.js";
import { VitePWA } from "file:///D:/care_fe/node_modules/vite-plugin-pwa/dist/index.js";
import { viteStaticCopy } from "file:///D:/care_fe/node_modules/vite-plugin-static-copy/dist/index.js";
import { z } from "file:///D:/care_fe/node_modules/zod/lib/index.mjs";

// plugins/treeShakeCareIcons.ts
import * as fs from "fs";
import { globSync } from "file:///D:/care_fe/node_modules/glob/dist/esm/index.js";
import * as path from "path";
var __vite_injected_original_dirname = "D:\\care_fe\\plugins";
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
var __vite_injected_original_dirname2 = "D:\\care_fe";
var __vite_injected_original_import_meta_url = "file:///D:/care_fe/vite.config.mts";
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
      ),
      __CORE_ENV__: { ...env }
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
      checker({
        typescript: true,
        eslint: {
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
      port: 4e3
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcubXRzIiwgInBsdWdpbnMvdHJlZVNoYWtlQ2FyZUljb25zLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRDpcXFxcY2FyZV9mZVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcY2FyZV9mZVxcXFx2aXRlLmNvbmZpZy5tdHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L2NhcmVfZmUvdml0ZS5jb25maWcubXRzXCI7aW1wb3J0IHsgVmFsaWRhdGVFbnYgfSBmcm9tIFwiQGp1bHIvdml0ZS1wbHVnaW4tdmFsaWRhdGUtZW52XCI7XHJcbmltcG9ydCBmZWRlcmF0aW9uIGZyb20gXCJAb3JpZ2luanMvdml0ZS1wbHVnaW4tZmVkZXJhdGlvblwiO1xyXG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0XCI7XHJcbmltcG9ydCBET01QdXJpZnkgZnJvbSBcImRvbXB1cmlmeVwiO1xyXG5pbXBvcnQgZnMgZnJvbSBcImZzXCI7XHJcbmltcG9ydCB7IEpTRE9NIH0gZnJvbSBcImpzZG9tXCI7XHJcbmltcG9ydCB7IG1hcmtlZCB9IGZyb20gXCJtYXJrZWRcIjtcclxuaW1wb3J0IHsgY3JlYXRlUmVxdWlyZSB9IGZyb20gXCJub2RlOm1vZHVsZVwiO1xyXG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYgfSBmcm9tIFwidml0ZVwiO1xyXG5pbXBvcnQgY2hlY2tlciBmcm9tIFwidml0ZS1wbHVnaW4tY2hlY2tlclwiO1xyXG5pbXBvcnQgeyBWaXRlUFdBIH0gZnJvbSBcInZpdGUtcGx1Z2luLXB3YVwiO1xyXG5pbXBvcnQgeyB2aXRlU3RhdGljQ29weSB9IGZyb20gXCJ2aXRlLXBsdWdpbi1zdGF0aWMtY29weVwiO1xyXG5pbXBvcnQgeyB6IH0gZnJvbSBcInpvZFwiO1xyXG5cclxuaW1wb3J0IHsgdHJlZVNoYWtlQ2FyZUljb25zIH0gZnJvbSBcIi4vcGx1Z2lucy90cmVlU2hha2VDYXJlSWNvbnNcIjtcclxuXHJcbmNvbnN0IHBkZldvcmtlclBhdGggPSBwYXRoLmpvaW4oXHJcbiAgcGF0aC5kaXJuYW1lKFxyXG4gICAgY3JlYXRlUmVxdWlyZShpbXBvcnQubWV0YS51cmwpLnJlc29sdmUoXCJwZGZqcy1kaXN0L3BhY2thZ2UuanNvblwiKSxcclxuICApLFxyXG4gIFwiYnVpbGRcIixcclxuICBcInBkZi53b3JrZXIubWluLm1qc1wiLFxyXG4pO1xyXG5cclxuLy8gQ29udmVydCBnb2FsIGRlc2NyaXB0aW9uIG1hcmtkb3duIHRvIEhUTUxcclxuZnVuY3Rpb24gZ2V0RGVzY3JpcHRpb25IdG1sKGRlc2NyaXB0aW9uOiBzdHJpbmcpIHtcclxuICAvLyBub3RlOiBlc2NhcGVkIGRlc2NyaXB0aW9uIGNhdXNlcyBpc3N1ZXMgd2l0aCBtYXJrZG93biBwYXJzaW5nXHJcbiAgY29uc3QgaHRtbCA9IG1hcmtlZC5wYXJzZShkZXNjcmlwdGlvbiwge1xyXG4gICAgYXN5bmM6IGZhbHNlLFxyXG4gICAgZ2ZtOiB0cnVlLFxyXG4gICAgYnJlYWtzOiB0cnVlLFxyXG4gIH0pO1xyXG4gIGNvbnN0IHB1cmlmeSA9IERPTVB1cmlmeShuZXcgSlNET00oXCJcIikud2luZG93KTtcclxuICBjb25zdCBzYW5pdGl6ZWRIdG1sID0gcHVyaWZ5LnNhbml0aXplKGh0bWwpO1xyXG4gIHJldHVybiBKU09OLnN0cmluZ2lmeShzYW5pdGl6ZWRIdG1sKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0UGx1Z2luQWxpYXNlcygpIHtcclxuICBjb25zdCBwbHVnaW5zRGlyID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCJhcHBzXCIpO1xyXG4gIC8vIE1ha2Ugc3VyZSB0aGUgYGFwcHNgIGZvbGRlciBleGlzdHNcclxuICBpZiAoIWZzLmV4aXN0c1N5bmMocGx1Z2luc0RpcikpIHtcclxuICAgIHJldHVybiB7fTtcclxuICB9XHJcbiAgY29uc3QgcGx1Z2luRm9sZGVycyA9IGZzLnJlYWRkaXJTeW5jKHBsdWdpbnNEaXIpO1xyXG5cclxuICBjb25zdCBhbGlhc2VzID0ge307XHJcblxyXG4gIHBsdWdpbkZvbGRlcnMuZm9yRWFjaCgocGx1Z2luRm9sZGVyKSA9PiB7XHJcbiAgICBjb25zdCBwbHVnaW5TcmNQYXRoID0gcGF0aC5qb2luKHBsdWdpbnNEaXIsIHBsdWdpbkZvbGRlciwgXCJzcmNcIik7XHJcbiAgICBpZiAoZnMuZXhpc3RzU3luYyhwbHVnaW5TcmNQYXRoKSkge1xyXG4gICAgICBhbGlhc2VzW2BAYXBwcy8ke3BsdWdpbkZvbGRlcn1gXSA9IHBsdWdpblNyY1BhdGg7XHJcbiAgICAgIGFsaWFzZXNbYEBhcHAtbWFuaWZlc3QvJHtwbHVnaW5Gb2xkZXJ9YF0gPSBwYXRoLmpvaW4oXHJcbiAgICAgICAgcGx1Z2luU3JjUGF0aCxcclxuICAgICAgICBcIm1hbmlmZXN0LnRzXCIsXHJcbiAgICAgICk7XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiBhbGlhc2VzO1xyXG59XHJcblxyXG4vKipcclxuICogUGFyc2VzIGEgcmVtb3RlIGFwcCBjb25maWd1cmF0aW9uIHN0cmluZyBpbnRvIGl0cyBjb21wb25lbnRzXHJcbiAqIEBwYXJhbSBhcHBDb25maWcgLSBDb25maWd1cmF0aW9uIHN0cmluZyBmb3IgYSByZW1vdGUgYXBwXHJcbiAqIEByZXR1cm5zIFBhcnNlZCBjb25maWd1cmF0aW9uIG9iamVjdFxyXG4gKi9cclxuaW50ZXJmYWNlIFBhcnNlZFJlbW90ZUNvbmZpZyB7XHJcbiAgdXJsOiBzdHJpbmc7XHJcbiAgb3JnOiBzdHJpbmc7XHJcbiAgcmVwbzogc3RyaW5nO1xyXG59XHJcblxyXG5mdW5jdGlvbiBwYXJzZVJlbW90ZUNvbmZpZyhhcHBDb25maWc6IHN0cmluZyk6IFBhcnNlZFJlbW90ZUNvbmZpZyB7XHJcbiAgaWYgKCFhcHBDb25maWcuaW5jbHVkZXMoXCIvXCIpKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXHJcbiAgICAgIGBJbnZhbGlkIGFwcCBjb25maWd1cmF0aW9uIGZvcm1hdDogJHthcHBDb25maWd9LiBFeHBlY3RlZCAnb3JnL3JlcG8nIG9yICdvcmcvcmVwb0B1cmwnLmAsXHJcbiAgICApO1xyXG4gIH1cclxuICAvLyBIYW5kbGUgY3VzdG9tIFVSTHMgKGJvdGggbG9jYWxob3N0IGFuZCBjdXN0b20gaG9zdGVkKVxyXG4gIGlmIChhcHBDb25maWcuaW5jbHVkZXMoXCJAXCIpKSB7XHJcbiAgICBjb25zdCBbcGFja2FnZV8sIHVybF0gPSBhcHBDb25maWcuc3BsaXQoXCJAXCIpO1xyXG4gICAgY29uc3QgW29yZywgcmVwb10gPSBwYWNrYWdlXy5zcGxpdChcIi9cIik7XHJcbiAgICBpZiAoIW9yZyB8fCAhcmVwbyB8fCAhdXJsKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcclxuICAgICAgICBgSW52YWxpZCBjdXN0b20gVVJMIGNvbmZpZ3VyYXRpb246ICR7YXBwQ29uZmlnfS4gRXhwZWN0ZWQgJ29yZy9yZXBvQHVybCcuYCxcclxuICAgICAgKTtcclxuICAgIH1cclxuICAgIC8vIEFkZCBhcHByb3ByaWF0ZSBwcm90b2NvbCBiYXNlZCBvbiB3aGV0aGVyIGl0J3MgbG9jYWxob3N0XHJcbiAgICBjb25zdCBwcm90b2NvbCA9IHVybC5pbmNsdWRlcyhcImxvY2FsaG9zdFwiKSA/IFwiaHR0cDovL1wiIDogXCJodHRwczovL1wiO1xyXG4gICAgY29uc3QgZnVsbFVybCA9IHVybC5zdGFydHNXaXRoKFwiaHR0cFwiKSA/IHVybCA6IGAke3Byb3RvY29sfSR7dXJsfWA7XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgdXJsOiBgJHtmdWxsVXJsfS9hc3NldHMvcmVtb3RlRW50cnkuanNgLFxyXG4gICAgICBvcmcsXHJcbiAgICAgIHJlcG8sXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgLy8gSGFuZGxlIEdpdEh1YiBQYWdlcyBVUkxzXHJcbiAgY29uc3QgW29yZywgcmVwb10gPSBhcHBDb25maWcuc3BsaXQoXCIvXCIpO1xyXG4gIGlmICghb3JnIHx8ICFyZXBvKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXHJcbiAgICAgIGBJbnZhbGlkIEdpdEh1YiBQYWdlcyBjb25maWd1cmF0aW9uOiAke2FwcENvbmZpZ30uIEV4cGVjdGVkICdvcmcvcmVwbycuYCxcclxuICAgICk7XHJcbiAgfVxyXG4gIHJldHVybiB7XHJcbiAgICB1cmw6IGBodHRwczovLyR7b3JnfS5naXRodWIuaW8vJHtyZXBvfS9hc3NldHMvcmVtb3RlRW50cnkuanNgLFxyXG4gICAgb3JnLFxyXG4gICAgcmVwbyxcclxuICB9O1xyXG59XHJcblxyXG4vKipcclxuICogR2VuZXJhdGVzIHJlbW90ZSBtb2R1bGUgY29uZmlndXJhdGlvbnMgZm9yIE1vZHVsZSBGZWRlcmF0aW9uXHJcbiAqXHJcbiAqIFN1cHBvcnRzIHR3byBmb3JtYXRzIGZvciBSRUFDVF9FTkFCTEVEX0FQUFM6XHJcbiAqIDEuIEdpdEh1YiBQYWdlczogXCJvcmdhbml6YXRpb24vcmVwb3NpdG9yeVwiXHJcbiAqICAgIEV4YW1wbGU6IFwiY29yb25hc2FmZS9jYXJlX2ZlXCJcclxuICpcclxuICogMi4gQ3VzdG9tIFVSTDogXCJvcmdhbml6YXRpb24vcmVwb3NpdG9yeUB1cmxcIlxyXG4gKiAgICBFeGFtcGxlOiBcImNvcm9uYXNhZmUvY2FyZV9mZUBsb2NhbGhvc3Q6NTE3M1wiXHJcbiAqICAgIEV4YW1wbGU6IFwiY29yb25hc2FmZS9jYXJlX2ZlQGNhcmUuY29yb25hc2FmZS5uZXR3b3JrXCJcclxuICogICAgTm90ZTogUHJvdG9jb2wgKGh0dHAvaHR0cHMpIGlzIGF1dG9tYXRpY2FsbHkgYWRkZWQgYmFzZWQgb24gdGhlIFVSTDpcclxuICogICAgLSBsb2NhbGhvc3QgVVJMcyB1c2UgaHR0cDovL1xyXG4gKiAgICAtIGFsbCBvdGhlciBVUkxzIHVzZSBodHRwczovL1xyXG4gKlxyXG4gKiBAcGFyYW0gZW5hYmxlZEFwcHMgLSBDb21tYS1zZXBhcmF0ZWQgbGlzdCBvZiBlbmFibGVkIGFwcHNcclxuICogQHJldHVybnMgUmVtb3RlIG1vZHVsZSBjb25maWd1cmF0aW9uIG9iamVjdCBmb3IgTW9kdWxlIEZlZGVyYXRpb25cclxuICovXHJcbmZ1bmN0aW9uIGdldFJlbW90ZXMoZW5hYmxlZEFwcHM6IHN0cmluZykge1xyXG4gIGlmICghZW5hYmxlZEFwcHMpIHJldHVybiB7fTtcclxuXHJcbiAgcmV0dXJuIGVuYWJsZWRBcHBzLnNwbGl0KFwiLFwiKS5yZWR1Y2UoKGFjYywgYXBwKSA9PiB7XHJcbiAgICBjb25zdCB7IHJlcG8sIHVybCB9ID0gcGFyc2VSZW1vdGVDb25maWcoYXBwKTtcclxuICAgIGNvbnNvbGUubG9nKGBDb25maWd1cmluZyBSZW1vdGUgTW9kdWxlIGZvciAke3JlcG99OmAsIHVybCk7XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgLi4uYWNjLFxyXG4gICAgICBbcmVwb106IHtcclxuICAgICAgICBleHRlcm5hbDogYFByb21pc2UucmVzb2x2ZShcIiR7dXJsfVwiKWAsXHJcbiAgICAgICAgZnJvbTogXCJ2aXRlXCIsXHJcbiAgICAgICAgZXh0ZXJuYWxUeXBlOiBcInByb21pc2VcIixcclxuICAgICAgfSxcclxuICAgIH07XHJcbiAgfSwge30pO1xyXG59XHJcblxyXG4vKiogQHR5cGUge2ltcG9ydCgndml0ZScpLlVzZXJDb25maWd9ICovXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+IHtcclxuICBjb25zdCBlbnYgPSBsb2FkRW52KG1vZGUsIHByb2Nlc3MuY3dkKCksIFwiXCIpO1xyXG5cclxuICBjb25zdCBjZG5VcmxzID1cclxuICAgIGVudi5SRUFDVF9DRE5fVVJMUyB8fFxyXG4gICAgW1xyXG4gICAgICBcImh0dHBzOi8vZWdvdi1zMy1mYWNpbGl0eS0xMGJlZGljdS5zMy5hbWF6b25hd3MuY29tXCIsXHJcbiAgICAgIFwiaHR0cHM6Ly9lZ292LXMzLXBhdGllbnQtZGF0YS0xMGJlZGljdS5zMy5hbWF6b25hd3MuY29tXCIsXHJcbiAgICAgIFwiaHR0cDovL2xvY2FsaG9zdDo0NTY2XCIsXHJcbiAgICBdLmpvaW4oXCIgXCIpO1xyXG5cclxuICByZXR1cm4ge1xyXG4gICAgZW52UHJlZml4OiBcIlJFQUNUX1wiLFxyXG4gICAgZGVmaW5lOiB7XHJcbiAgICAgIF9fQ1VTVE9NX0RFU0NSSVBUSU9OX0hUTUxfXzogZ2V0RGVzY3JpcHRpb25IdG1sKFxyXG4gICAgICAgIGVudi5SRUFDVF9DVVNUT01fREVTQ1JJUFRJT04gfHwgXCJcIixcclxuICAgICAgKSxcclxuICAgICAgX19DT1JFX0VOVl9fOiB7IC4uLmVudiB9LFxyXG4gICAgfSxcclxuICAgIHBsdWdpbnM6IFtcclxuICAgICAgZmVkZXJhdGlvbih7XHJcbiAgICAgICAgbmFtZTogXCJjb3JlXCIsXHJcbiAgICAgICAgcmVtb3RlczogZ2V0UmVtb3RlcyhlbnYuUkVBQ1RfRU5BQkxFRF9BUFBTKSxcclxuICAgICAgICAvLyB7XHJcbiAgICAgICAgLy8gY2FyZV9saXZla2l0X2ZlOiB7XHJcbiAgICAgICAgLy8gICBleHRlcm5hbDogYFByb21pc2UucmVzb2x2ZShcImh0dHA6Ly9sb2NhbGhvc3Q6NTE3My9hc3NldHMvcmVtb3RlRW50cnkuanNcIilgLFxyXG4gICAgICAgIC8vICAgZXh0ZXJuYWxUeXBlOiBcInByb21pc2VcIixcclxuICAgICAgICAvLyAgIGZyb206IFwidml0ZVwiLFxyXG4gICAgICAgIC8vIH0sXHJcbiAgICAgICAgLy8gfSxcclxuICAgICAgICBzaGFyZWQ6IFtcclxuICAgICAgICAgIFwicmVhY3RcIixcclxuICAgICAgICAgIFwicmVhY3QtZG9tXCIsXHJcbiAgICAgICAgICBcInJlYWN0LWkxOG5leHRcIixcclxuICAgICAgICAgIFwiQHRhbnN0YWNrL3JlYWN0LXF1ZXJ5XCIsXHJcbiAgICAgICAgXSxcclxuICAgICAgfSksXHJcbiAgICAgIFZhbGlkYXRlRW52KHtcclxuICAgICAgICB2YWxpZGF0b3I6IFwiem9kXCIsXHJcbiAgICAgICAgc2NoZW1hOiB7XHJcbiAgICAgICAgICBSRUFDVF9DQVJFX0FQSV9VUkw6IHouc3RyaW5nKCkudXJsKCksXHJcblxyXG4gICAgICAgICAgUkVBQ1RfU0VOVFJZX0RTTjogei5zdHJpbmcoKS51cmwoKS5vcHRpb25hbCgpLFxyXG4gICAgICAgICAgUkVBQ1RfU0VOVFJZX0VOVklST05NRU5UOiB6LnN0cmluZygpLm9wdGlvbmFsKCksXHJcblxyXG4gICAgICAgICAgUkVBQ1RfQ0ROX1VSTFM6IHpcclxuICAgICAgICAgICAgLnN0cmluZygpXHJcbiAgICAgICAgICAgIC5vcHRpb25hbCgpXHJcbiAgICAgICAgICAgIC50cmFuc2Zvcm0oKHZhbCkgPT4gdmFsPy5zcGxpdChcIiBcIikpXHJcbiAgICAgICAgICAgIC5waXBlKHouYXJyYXkoei5zdHJpbmcoKS51cmwoKSkub3B0aW9uYWwoKSlcclxuICAgICAgICAgICAgLmRlc2NyaWJlKFwiT3B0aW9uYWw6IFNwYWNlLXNlcGFyYXRlZCBsaXN0IG9mIENETiBVUkxzXCIpLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0pLFxyXG4gICAgICB2aXRlU3RhdGljQ29weSh7XHJcbiAgICAgICAgdGFyZ2V0czogW1xyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBzcmM6IHBkZldvcmtlclBhdGgsXHJcbiAgICAgICAgICAgIGRlc3Q6IFwiXCIsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIF0sXHJcbiAgICAgIH0pLFxyXG4gICAgICByZWFjdCgpLFxyXG4gICAgICBjaGVja2VyKHtcclxuICAgICAgICB0eXBlc2NyaXB0OiB0cnVlLFxyXG4gICAgICAgIGVzbGludDoge1xyXG4gICAgICAgICAgbGludENvbW1hbmQ6IFwiZXNsaW50IC4vc3JjXCIsXHJcbiAgICAgICAgICBkZXY6IHtcclxuICAgICAgICAgICAgbG9nTGV2ZWw6IFtcImVycm9yXCJdLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICB9KSxcclxuICAgICAgdHJlZVNoYWtlQ2FyZUljb25zKHtcclxuICAgICAgICBpY29uV2hpdGVsaXN0OiBbXCJkZWZhdWx0XCJdLFxyXG4gICAgICB9KSxcclxuICAgICAgVml0ZVBXQSh7XHJcbiAgICAgICAgc3RyYXRlZ2llczogXCJpbmplY3RNYW5pZmVzdFwiLFxyXG4gICAgICAgIHNyY0RpcjogXCJzcmNcIixcclxuICAgICAgICBmaWxlbmFtZTogXCJzZXJ2aWNlLXdvcmtlci50c1wiLFxyXG4gICAgICAgIGluamVjdFJlZ2lzdGVyOiBcInNjcmlwdC1kZWZlclwiLFxyXG4gICAgICAgIGRldk9wdGlvbnM6IHtcclxuICAgICAgICAgIGVuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgICB0eXBlOiBcIm1vZHVsZVwiLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgaW5qZWN0TWFuaWZlc3Q6IHtcclxuICAgICAgICAgIG1heGltdW1GaWxlU2l6ZVRvQ2FjaGVJbkJ5dGVzOiA3MDAwMDAwLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgbWFuaWZlc3Q6IHtcclxuICAgICAgICAgIG5hbWU6IFwiQ2FyZVwiLFxyXG4gICAgICAgICAgc2hvcnRfbmFtZTogXCJDYXJlXCIsXHJcbiAgICAgICAgICB0aGVtZV9jb2xvcjogXCIjMGU5ZjZlXCIsXHJcbiAgICAgICAgICBiYWNrZ3JvdW5kX2NvbG9yOiBcIiNmZmZmZmZcIixcclxuICAgICAgICAgIGRpc3BsYXk6IFwic3RhbmRhbG9uZVwiLFxyXG4gICAgICAgICAgaWNvbnM6IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIHNyYzogXCJpbWFnZXMvaWNvbnMvcHdhLTY0eDY0LnBuZ1wiLFxyXG4gICAgICAgICAgICAgIHNpemVzOiBcIjY0eDY0XCIsXHJcbiAgICAgICAgICAgICAgdHlwZTogXCJpbWFnZS9wbmdcIixcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIHNyYzogXCJpbWFnZXMvaWNvbnMvcHdhLTE5MngxOTIucG5nXCIsXHJcbiAgICAgICAgICAgICAgc2l6ZXM6IFwiMTkyeDE5MlwiLFxyXG4gICAgICAgICAgICAgIHR5cGU6IFwiaW1hZ2UvcG5nXCIsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBzcmM6IFwiaW1hZ2VzL2ljb25zL3B3YS01MTJ4NTEyLnBuZ1wiLFxyXG4gICAgICAgICAgICAgIHNpemVzOiBcIjUxMng1MTJcIixcclxuICAgICAgICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxyXG4gICAgICAgICAgICAgIHB1cnBvc2U6IFwiYW55XCIsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBzcmM6IFwiaW1hZ2VzL2ljb25zL21hc2thYmxlLWljb24tNTEyeDUxMi5wbmdcIixcclxuICAgICAgICAgICAgICBzaXplczogXCI1MTJ4NTEyXCIsXHJcbiAgICAgICAgICAgICAgdHlwZTogXCJpbWFnZS9wbmdcIixcclxuICAgICAgICAgICAgICBwdXJwb3NlOiBcIm1hc2thYmxlXCIsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICBdLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0pLFxyXG4gICAgXSxcclxuICAgIHJlc29sdmU6IHtcclxuICAgICAgYWxpYXM6IHtcclxuICAgICAgICAuLi5nZXRQbHVnaW5BbGlhc2VzKCksXHJcbiAgICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXHJcbiAgICAgICAgXCJAY2FyZUNvbmZpZ1wiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vY2FyZS5jb25maWcudHNcIiksXHJcbiAgICAgICAgXCJAY29yZVwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcInNyYy9cIiksXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gICAgLy8gb3B0aW1pemVEZXBzOiB7XHJcbiAgICAvLyAgIGluY2x1ZGU6IGdldFBsdWdpbkRlcGVuZGVuY2llcygpLFxyXG4gICAgLy8gfSxcclxuICAgIGJ1aWxkOiB7XHJcbiAgICAgIHRhcmdldDogXCJlczIwMjJcIixcclxuICAgICAgb3V0RGlyOiBcImJ1aWxkXCIsXHJcbiAgICAgIHNvdXJjZW1hcDogdHJ1ZSxcclxuICAgIH0sXHJcbiAgICBlc2J1aWxkOiB7XHJcbiAgICAgIHRhcmdldDogXCJlczIwMjJcIixcclxuICAgIH0sXHJcbiAgICBzZXJ2ZXI6IHtcclxuICAgICAgcG9ydDogNDAwMCxcclxuICAgIH0sXHJcbiAgICBwcmV2aWV3OiB7XHJcbiAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICBcIkNvbnRlbnQtU2VjdXJpdHktUG9saWN5LVJlcG9ydC1Pbmx5XCI6IGBkZWZhdWx0LXNyYyAnc2VsZic7XFxcclxuICAgICAgICAgIHN0eWxlLXNyYyAnc2VsZicgJ3Vuc2FmZS1pbmxpbmUnO1xcXHJcbiAgICAgICAgICBpbWctc3JjICdzZWxmJyBodHRwczovL2Nkbi5vaGMubmV0d29yayAke2NkblVybHN9O1xcXHJcbiAgICAgICAgICBvYmplY3Qtc3JjICdzZWxmJyAke2NkblVybHN9O2AsXHJcbiAgICAgIH0sXHJcbiAgICAgIHBvcnQ6IDQwMDAsXHJcbiAgICB9LFxyXG4gIH07XHJcbn0pO1xyXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkQ6XFxcXGNhcmVfZmVcXFxccGx1Z2luc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcY2FyZV9mZVxcXFxwbHVnaW5zXFxcXHRyZWVTaGFrZUNhcmVJY29ucy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovY2FyZV9mZS9wbHVnaW5zL3RyZWVTaGFrZUNhcmVJY29ucy50c1wiO2ltcG9ydCAqIGFzIGZzIGZyb20gXCJmc1wiO1xyXG5pbXBvcnQgeyBnbG9iU3luYyB9IGZyb20gXCJnbG9iXCI7XHJcbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IHsgUGx1Z2luIH0gZnJvbSBcInZpdGVcIjtcclxuXHJcbi8qKlxyXG4gKiBJbnRlcmZhY2UgZGVmaW5pbmcgb3B0aW9ucyBmb3IgdGhlIHRyZWVTaGFrZVVuaWNvblBhdGhzUGx1Z2luLlxyXG4gKlxyXG4gKiBAaW50ZXJmYWNlIFRyZWVTaGFrZVVuaWNvblBhdGhzUGx1Z2luT3B0aW9uc1xyXG4gKiBAcHJvcGVydHkge3N0cmluZ1tdfSBpY29uV2hpdGVsaXN0IC0gQW4gYXJyYXkgb2YgaWNvbiBuYW1lcyB0byBhbHdheXMgaW5jbHVkZSwgZXZlbiBpZiBub3QgZm91bmQgaW4gY29kZS5cclxuICovXHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFRyZWVTaGFrZUNhcmVJY29uc09wdGlvbnMge1xyXG4gIGljb25XaGl0ZWxpc3Q6IHN0cmluZ1tdO1xyXG59XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIFdlYnBhY2sgcGx1Z2luIHRoYXQgdHJlZS1zaGFrZXMgdW51c2VkIFVuaWNvbiBwYXRocyBmcm9tIFVuaWNvblBhdGhzLmpzb24gaW4gcHJvZHVjdGlvbiBidWlsZHMuXHJcbiAqXHJcbiAqIEBwYXJhbSB7VHJlZVNoYWtlQ2FyZUljb25zT3B0aW9uc30gW29wdGlvbnNdIC0gT3B0aW9uYWwgY29uZmlndXJhdGlvbiBvcHRpb25zLiBEZWZhdWx0cyB0byBhbiBlbXB0eSBpY29uV2hpdGVsaXN0LlxyXG4gKiBAcmV0dXJucyB7UGx1Z2lufSBXZWJwYWNrIHBsdWdpbiBvYmplY3QuXHJcbiAqL1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHRyZWVTaGFrZUNhcmVJY29ucyhcclxuICBvcHRpb25zOiBUcmVlU2hha2VDYXJlSWNvbnNPcHRpb25zID0geyBpY29uV2hpdGVsaXN0OiBbXSB9LFxyXG4pOiBQbHVnaW4ge1xyXG4gIGNvbnN0IHJvb3REaXIgPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4uXCIpOyAvLyB1cGRhdGUgdGhpcyBpZiBtb3ZpbmcgdGhpcyBjb2RlIHRvIGEgZGlmZmVyZW50IGZpbGVcclxuICBjb25zdCBsaW5lSWNvbk5hbWVSZWdleCA9IC9cImwtW2Etel0rKD86LVthLXpdKykqXCIvZztcclxuICBjb25zdCBhbGxVbmljb25QYXRocyA9IEpTT04ucGFyc2UoXHJcbiAgICBmcy5yZWFkRmlsZVN5bmMoXHJcbiAgICAgIHBhdGgucmVzb2x2ZShyb290RGlyLCBcInNyYy9DQVJFVUkvaWNvbnMvVW5pY29uUGF0aHMuanNvblwiKSxcclxuICAgICAgXCJ1dGY4XCIsXHJcbiAgICApLFxyXG4gICk7XHJcblxyXG4gIC8vIEV4dHJhY3RzIGljb24gbmFtZXMgZnJvbSBhIGdpdmVuIGZpbGUncyBjb250ZW50LlxyXG4gIC8vIFJldHVybnMgYW4gYXJyYXkgb2YgaWNvbiBuYW1lcyBsaWtlIFtcImwtZXllXCIsIFwibC1zeW5jXCIsIFwibC1oZWFyYmVhdFwiXVxyXG4gIGZ1bmN0aW9uIGV4dHJhY3RDYXJlSWNvbk5hbWVzKGZpbGU6IHN0cmluZyk6IHN0cmluZ1tdIHtcclxuICAgIGNvbnN0IGZpbGVDb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKGZpbGUsIFwidXRmOFwiKTtcclxuXHJcbiAgICBjb25zdCBsaW5lSWNvbk5hbWVNYXRjaGVzID0gZmlsZUNvbnRlbnQubWF0Y2gobGluZUljb25OYW1lUmVnZXgpIHx8IFtdO1xyXG5cclxuICAgIGNvbnN0IGxpbmVJY29uTmFtZXMgPSBsaW5lSWNvbk5hbWVNYXRjaGVzLm1hcChcclxuICAgICAgKGxpbmVJY29uTmFtZSkgPT4gbGluZUljb25OYW1lLnNsaWNlKDEsIC0xKSwgLy8gcmVtb3ZlIHF1b3Rlc1xyXG4gICAgKTtcclxuXHJcbiAgICByZXR1cm4gbGluZUljb25OYW1lcztcclxuICB9XHJcbiAgLy8gRmluZHMgYWxsIHVzZWQgaWNvbiBuYW1lcyB3aXRoaW4gdGhlIHByb2plY3QncyBzb3VyY2UgZmlsZXMgKGAudHN4YCBvciBgLnJlc2AgZXh0ZW5zaW9ucykuXHJcbiAgZnVuY3Rpb24gZ2V0QWxsVXNlZEljb25OYW1lcygpIHtcclxuICAgIGNvbnN0IGZpbGVzID0gZ2xvYlN5bmMocGF0aC5yZXNvbHZlKHJvb3REaXIsIFwie2FwcHMsc3JjfS8qKi8qLnt0c3gscmVzfVwiKSk7XHJcbiAgICBjb25zdCB1c2VkSWNvbnNBcnJheTogc3RyaW5nW10gPSBbXTtcclxuXHJcbiAgICBmaWxlcy5mb3JFYWNoKChmaWxlKSA9PiB7XHJcbiAgICAgIGNvbnN0IGljb25OYW1lcyA9IGV4dHJhY3RDYXJlSWNvbk5hbWVzKGZpbGUpO1xyXG4gICAgICB1c2VkSWNvbnNBcnJheS5wdXNoKC4uLmljb25OYW1lcyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gbmV3IFNldCh1c2VkSWNvbnNBcnJheSk7XHJcbiAgfVxyXG4gIC8vIEdlbmVyYXRlcyBhIG1hcCBvZiB1c2VkIGljb24gbmFtZXMgdG8gdGhlaXIgcGF0aHMgZnJvbSBVbmljb25QYXRocy5qc29uLCBpbmNsdWRpbmcgYW55IHdoaXRlbGlzdGVkIGljb25zLlxyXG4gIGZ1bmN0aW9uIGdldFRyZWVTaGFrZW5Vbmljb25QYXRocygpIHtcclxuICAgIGNvbnN0IHVzZWRJY29ucyA9IFsuLi5nZXRBbGxVc2VkSWNvbk5hbWVzKCksIC4uLm9wdGlvbnMuaWNvbldoaXRlbGlzdF07XHJcbiAgICBjb25zdCB0cmVlc2hha2VuQ2FyZUljb25QYXRocyA9IHt9O1xyXG5cclxuICAgIGZvciAoY29uc3QgaWNvbk5hbWUgb2YgdXNlZEljb25zKSB7XHJcbiAgICAgIGNvbnN0IHBhdGggPSBhbGxVbmljb25QYXRoc1tpY29uTmFtZV07XHJcbiAgICAgIGlmIChwYXRoID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEljb24gJHtpY29uTmFtZX0gaXMgbm90IGZvdW5kIGluIFVuaWNvblBhdGhzLmpzb25gKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0cmVlc2hha2VuQ2FyZUljb25QYXRoc1tpY29uTmFtZV0gPSBwYXRoO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRyZWVzaGFrZW5DYXJlSWNvblBhdGhzO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIG5hbWU6IFwidHJlZS1zaGFrZS1jYXJlLWljb25zXCIsXHJcbiAgICB0cmFuc2Zvcm0oX3NyYywgaWQpIHtcclxuICAgICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gUmVwbGFjZSB0aGUgVW5pY29uUGF0aHMgd2l0aCB0aGUgdHJlZS1zaGFrZW4gdmVyc2lvblxyXG4gICAgICBpZiAoaWQuZW5kc1dpdGgoXCJVbmljb25QYXRocy5qc29uXCIpKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgIGNvZGU6IGBleHBvcnQgZGVmYXVsdCAke0pTT04uc3RyaW5naWZ5KGdldFRyZWVTaGFrZW5Vbmljb25QYXRocygpKX1gLFxyXG4gICAgICAgICAgbWFwOiBudWxsLFxyXG4gICAgICAgIH07XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgfTtcclxufVxyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXNOLFNBQVMsbUJBQW1CO0FBQ2xQLE9BQU8sZ0JBQWdCO0FBQ3ZCLE9BQU8sV0FBVztBQUNsQixPQUFPLGVBQWU7QUFDdEIsT0FBT0EsU0FBUTtBQUNmLFNBQVMsYUFBYTtBQUN0QixTQUFTLGNBQWM7QUFDdkIsU0FBUyxxQkFBcUI7QUFDOUIsT0FBT0MsV0FBVTtBQUNqQixTQUFTLGNB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K0JBQStCO0FBQUEsUUFDakM7QUFBQSxRQUNBLFVBQVU7QUFBQSxVQUNSLE1BQU07QUFBQSxVQUNOLFlBQVk7QUFBQSxVQUNaLGFBQWE7QUFBQSxVQUNiLGtCQUFrQjtBQUFBLFVBQ2xCLFNBQVM7QUFBQSxVQUNULE9BQU87QUFBQSxZQUNMO0FBQUEsY0FDRSxLQUFLO0FBQUEsY0FDTCxPQUFPO0FBQUEsY0FDUCxNQUFNO0FBQUEsWUFDUjtBQUFBLFlBQ0E7QUFBQSxjQUNFLEtBQUs7QUFBQSxjQUNMLE9BQU87QUFBQSxjQUNQLE1BQU07QUFBQSxZQUNSO0FBQUEsWUFDQTtBQUFBLGNBQ0UsS0FBSztBQUFBLGNBQ0wsT0FBTztBQUFBLGNBQ1AsTUFBTTtBQUFBLGNBQ04sU0FBUztBQUFBLFlBQ1g7QUFBQSxZQUNBO0FBQUEsY0FDRSxLQUFLO0FBQUEsY0FDTCxPQUFPO0FBQUEsY0FDUCxNQUFNO0FBQUEsY0FDTixTQUFTO0FBQUEsWUFDWDtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQUEsTUFDRixDQUFDO0FBQUEsSUFDSDtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1AsT0FBTztBQUFBLFFBQ0wsR0FBRyxpQkFBaUI7QUFBQSxRQUNwQixLQUFLSixNQUFLLFFBQVFDLG1DQUFXLE9BQU87QUFBQSxRQUNwQyxlQUFlRCxNQUFLLFFBQVFDLG1DQUFXLGtCQUFrQjtBQUFBLFFBQ3pELFNBQVNELE1BQUssUUFBUUMsbUNBQVcsTUFBTTtBQUFBLE1BQ3pDO0FBQUEsSUFDRjtBQUFBO0FBQUE7QUFBQTtBQUFBLElBSUEsT0FBTztBQUFBLE1BQ0wsUUFBUTtBQUFBLE1BQ1IsUUFBUTtBQUFBLE1BQ1IsV0FBVztBQUFBLElBQ2I7QUFBQSxJQUNBLFNBQVM7QUFBQSxNQUNQLFFBQVE7QUFBQSxJQUNWO0FBQUEsSUFDQSxRQUFRO0FBQUEsTUFDTixNQUFNO0FBQUEsSUFDUjtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1AsU0FBUztBQUFBLFFBQ1AsdUNBQXVDLGtIQUVJLE9BQU8sZ0NBQzVCLE9BQU87QUFBQSxNQUMvQjtBQUFBLE1BQ0EsTUFBTTtBQUFBLElBQ1I7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFsiZnMiLCAicGF0aCIsICJwYXRoIiwgIl9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lIiwgInBhdGgiLCAiX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUiLCAiZnMiLCAib3JnIiwgInJlcG8iXQp9Cg==
