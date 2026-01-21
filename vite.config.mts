import { type UserConfig, defineConfig, loadEnv } from "vite";

import federation from "@originjs/vite-plugin-federation";
import reactScan from "@react-scan/vite-plugin-react-scan";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import { marked } from "marked";
import path from "path";
import checker from "vite-plugin-checker";
import { VitePWA } from "vite-plugin-pwa";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { careConsoleArt } from "./plugins/careConsoleArt";
import { fixSonnerPackageJson } from "./plugins/fixSonnerPackageJson";
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
      fixSonnerPackageJson(),
      tailwindcss(),
      federation({
        name: "core",
        remotes: {
          dummy: "",
        },
        shared: [
          "react",
          "react-dom",
          "react-i18next",
          "@tanstack/react-query",
          "raviger",
          "sonner",
          "decimal.js",
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
          "**/tests/**",
          "**/test/**",
          "**/*.test.*",
          "**/*.spec.*",
          "**/playwright-report/**",
          "**/test-results/**",
        ],
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
