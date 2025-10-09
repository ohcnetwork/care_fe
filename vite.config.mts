import federation from "@originjs/vite-plugin-federation";
import reactScan from "@react-scan/vite-plugin-react-scan";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import DOMPurify from "dompurify";
import fs from "fs";
import { JSDOM } from "jsdom";
import { marked } from "marked";
import path from "path";
import { defineConfig, loadEnv, type UserConfig } from "vite";
import checker from "vite-plugin-checker";
import { VitePWA } from "vite-plugin-pwa";
import { viteStaticCopy } from "vite-plugin-static-copy";

import { careConsoleArt } from "./plugins/careConsoleArt";
import { treeShakeCareIcons } from "./plugins/treeShakeCareIcons";
import validateEnv from "./scripts/validate-env";

// Convert goal description markdown to HTML
function getDescriptionHtml(description: string) {
  // note: escaped description causes issues with markdown parsing
  const html = marked.parse(description, {
    async: false,
    gfm: true,
    breaks: true,
  });
  const purify = DOMPurify(new JSDOM("").window);
  const sanitizedHtml = purify.sanitize(html);
  return JSON.stringify(sanitizedHtml);
}

function getPluginAliases() {
  const pluginsDir = path.resolve(__dirname, "apps");
  // Make sure the `apps` folder exists
  if (!fs.existsSync(pluginsDir)) {
    return {};
  }
  const pluginFolders = fs.readdirSync(pluginsDir);

  const aliases = {};

  pluginFolders.forEach((pluginFolder) => {
    const pluginSrcPath = path.join(pluginsDir, pluginFolder, "src");
    if (fs.existsSync(pluginSrcPath)) {
      aliases[`@apps/${pluginFolder}`] = pluginSrcPath;
      aliases[`@app-manifest/${pluginFolder}`] = path.join(
        pluginSrcPath,
        "manifest.ts",
      );
    }
  });

  return aliases;
}

/**
 * Parses a remote app configuration string into its components
 * @param appConfig - Configuration string for a remote app
 * @returns Parsed configuration object
 */
interface ParsedRemoteConfig {
  url: string;
  org: string;
  repo: string;
}

function parseRemoteConfig(appConfig: string): ParsedRemoteConfig {
  if (!appConfig.includes("/")) {
    throw new Error(
      `Invalid app configuration format: ${appConfig}. Expected 'org/repo' or 'org/repo@url'.`,
    );
  }
  // Handle custom URLs (both localhost and custom hosted)
  if (appConfig.includes("@")) {
    const [package_, url] = appConfig.split("@");
    const [org, repo] = package_.split("/");
    if (!org || !repo || !url) {
      throw new Error(
        `Invalid custom URL configuration: ${appConfig}. Expected 'org/repo@url'.`,
      );
    }
    // Add appropriate protocol based on whether it's localhost
    const protocol = url.includes("localhost") ? "http://" : "https://";
    const fullUrl = url.startsWith("http") ? url : `${protocol}${url}`;

    return {
      url: `${fullUrl}/assets/remoteEntry.js`,
      org,
      repo,
    };
  }

  // Handle GitHub Pages URLs
  const [org, repo] = appConfig.split("/");
  if (!org || !repo) {
    throw new Error(
      `Invalid GitHub Pages configuration: ${appConfig}. Expected 'org/repo'.`,
    );
  }
  return {
    url: `https://${org}.github.io/${repo}/assets/remoteEntry.js`,
    org,
    repo,
  };
}

/**
 * Generates remote module configurations for Module Federation
 *
 * Supports two formats for REACT_ENABLED_APPS:
 * 1. GitHub Pages: "organization/repository"
 *    Example: "coronasafe/care_fe"
 *
 * 2. Custom URL: "organization/repository@url"
 *    Example: "coronasafe/care_fe@localhost:5173"
 *    Example: "coronasafe/care_fe@care.coronasafe.network"
 *    Note: Protocol (http/https) is automatically added based on the URL:
 *    - localhost URLs use http://
 *    - all other URLs use https://
 *
 * @param enabledApps - Comma-separated list of enabled apps
 * @returns Remote module configuration object for Module Federation
 */
function getRemotes(enabledApps: string) {
  if (!enabledApps) return {};

  return enabledApps.split(",").reduce((acc, app) => {
    const { repo, url } = parseRemoteConfig(app);
    console.log(`Configuring Remote Module for ${repo}:`, url);

    return {
      ...acc,
      [repo]: {
        external: `Promise.resolve("${url}")`,
        from: "vite",
        externalType: "promise",
      },
    };
  }, {});
}

export default defineConfig(async ({ mode }): Promise<UserConfig> => {
  const env = loadEnv(mode, process.cwd(), "");

  await validateEnv(env);

  const cdnUrls =
    env.REACT_CDN_URLS ||
    [
      "https://egov-s3-facility-10bedicu.s3.amazonaws.com",
      "https://egov-s3-patient-data-10bedicu.s3.amazonaws.com",
      "http://localhost:4566",
    ].join(" ");

  return {
    envPrefix: "REACT_",
    define: {
      "process.env.IS_PREACT": JSON.stringify("true"),
      __CUSTOM_DESCRIPTION_HTML__: getDescriptionHtml(
        env.REACT_CUSTOM_DESCRIPTION || "",
      ),
    },
    plugins: [
      careConsoleArt(),
      tailwindcss(),
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
          "@tanstack/react-query",
        ],
      }),
      viteStaticCopy({
        targets: [
          {
            src: "node_modules/pdfjs-dist/build/pdf.worker.min.mjs",
            dest: "",
          },
        ],
      }),
      react(),
      reactScan({
        enable:
          env.NODE_ENV === "development" && env.ENABLE_REACT_SCAN === "true",
      }),
      checker({
        typescript: true,
        eslint: {
          useFlatConfig: true,
          lintCommand: "eslint ./src",
          dev: {
            logLevel: ["error"],
          },
        },
      }),
      treeShakeCareIcons({
        iconWhitelist: ["default"],
      }),
      VitePWA({
        strategies: "injectManifest",
        srcDir: "src",
        filename: "service-worker.ts",
        injectRegister: "script-defer",
        devOptions: {
          enabled: true,
          type: "module",
        },
        injectManifest: {
          maximumFileSizeToCacheInBytes: 8000000,
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
    resolve: {
      alias: {
        ...getPluginAliases(),
        "@": path.resolve(__dirname, "./src"),
        "@careConfig": path.resolve(__dirname, "./care.config.ts"),
        "@core": path.resolve(__dirname, "src/"),
      },
    },
    // optimizeDeps: {
    //   include: getPluginDependencies(),
    // },
    build: {
      target: "es2022",
      outDir: "build",
      sourcemap: true,
    },
    esbuild: {
      target: "es2022",
    },
    server: {
      port: 4000,
      host: "0.0.0.0",
      allowedHosts: true,
      watch: {
        // Ignore test files from file watching to avoid unnecessary HMR triggers
        ignored: [
          "**/cypress/**",
          "**/tests/**", 
          "**/test/**",
          "**/*.test.*",
          "**/*.spec.*",
          "**/playwright-report/**",
          "**/test-results/**"
        ]
      },
      headers: {
        "Strict-Transport-Security":
          "max-age=31536000; includeSubDomains; preload",
        "X-XSS-Protection": "1; mode=block",
        "X-Frame-Options": "SAMEORIGIN",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "geolocation=(self), microphone=(self)",
      },
    },
    preview: {
      headers: {
        "Content-Security-Policy-Report-Only": `default-src 'self';\
          style-src 'self' 'unsafe-inline';\
          img-src 'self' https://cdn.ohc.network ${cdnUrls};\
          object-src 'self' ${cdnUrls};`,
      },
      port: 4000,
    },
  };
});
