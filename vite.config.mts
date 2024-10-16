import path from "path";
import { createRequire } from "node:module";
import { VitePWA } from "vite-plugin-pwa";
import react from "@vitejs/plugin-react-swc";
import checker from "vite-plugin-checker";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { treeShakeCareIcons } from "./plugins/treeShakeCareIcons";
import fs from "fs";
import { defineConfig } from "vite";

const pdfWorkerPath = path.join(
  path.dirname(
    createRequire(import.meta.url).resolve("pdfjs-dist/package.json"),
  ),
  "build",
  "pdf.worker.min.mjs",
);

const cdnUrls =
  process.env.CARE_CDN_URL ??
  [
    "https://egov-s3-facility-10bedicu.s3.amazonaws.com",
    "https://egov-s3-patient-data-10bedicu.s3.amazonaws.com",
    "http://localhost:4566",
  ].join(" ");

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

function getPluginDependencies() {
  const pluginsDir = path.resolve(__dirname, "apps");
  // Make sure the `apps` folder exists
  if (!fs.existsSync(pluginsDir)) {
    return [];
  }
  const pluginFolders = fs.readdirSync(pluginsDir);

  const dependencies = new Set();

  pluginFolders.forEach((pluginFolder) => {
    const packageJsonPath = path.join(pluginsDir, pluginFolder, "package.json");
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
      const pluginDependencies = packageJson.dependencies
        ? Object.keys(packageJson.dependencies)
        : [];
      pluginDependencies.forEach((dep) => dependencies.add(dep));
    }
  });

  return Array.from(dependencies);
}

/** @type {import('vite').UserConfig} */
export default defineConfig({
  envPrefix: "REACT_",
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: pdfWorkerPath,
          dest: "",
        },
      ],
    }),
    react(),
    checker({ typescript: true }),
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
  resolve: {
    alias: {
      ...getPluginAliases(),
      "@": path.resolve(__dirname, "./src"),
      "@careConfig": path.resolve(__dirname, "./care.config.ts"),
      "@core": path.resolve(__dirname, "src/"),
    },
  },
  optimizeDeps: {
    include: getPluginDependencies(),
  },
  build: {
    outDir: "build",
    assetsDir: "bundle",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
      },
    },
  },
  server: {
    port: 4000,
  },
  preview: {
    headers: {
      "Content-Security-Policy-Report-Only": `default-src 'self';\
      script-src 'self' blob: 'nonce-f51b9742' https://plausible.10bedicu.in;\
      style-src 'self' 'unsafe-inline';\
      connect-src 'self' https://plausible.10bedicu.in;\
      img-src 'self' https://cdn.ohc.network ${cdnUrls};\
      object-src 'self' ${cdnUrls};`,
    },
    port: 4000,
  },
});
