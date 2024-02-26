import { VitePWA } from "vite-plugin-pwa";
import { Plugin, defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import * as fs from "fs";
import * as path from "path";
import * as glob from "glob";

interface TreeShakeUniconPathsPluginOptions {
  iconWhitelist: string[];
}

export function treeShakeUniconPathsPlugin(
  options: TreeShakeUniconPathsPluginOptions = { iconWhitelist: [] }
): Plugin {
  const rootDir = __dirname; // update this if moving this code to a different file
  const careLineClassRegex = /\bcare-l-[a-z]+(?:-[a-z]+)*\b/g;
  const lineIconNameRegex = /"l-[a-z]+(?:-[a-z]+)*"/g;
  const allUniconPaths = JSON.parse(
    fs.readFileSync(
      path.resolve(rootDir, "src/CAREUI/icons/UniconPaths.json"),
      "utf8"
    )
  );

  function extractCareIconNames(file: string): string[] {
    const fileContent = fs.readFileSync(file, "utf8");
    const careLineClassNamesMatches =
      fileContent.match(careLineClassRegex) || [];

    const lineIconNameMatches = fileContent.match(lineIconNameRegex) || [];
    const careIconNames = careLineClassNamesMatches.map(
      (careLineClassName) => careLineClassName.slice(5) // remove "care-" prefix
    );
    const lineIconNames = lineIconNameMatches.map(
      (lineIconName) => lineIconName.slice(1, -1) // remove quotes
    );

    return [...careIconNames, ...lineIconNames];
  }

  function getAllUsedIconNames() {
    const files = glob.sync(path.resolve(rootDir, "src/**/*.{tsx,res}"));
    const usedIconsArray: string[] = [];

    files.forEach((file) => {
      const iconNames = extractCareIconNames(file);
      usedIconsArray.push(...iconNames);
    });

    return new Set(usedIconsArray);
  }

  function getTreeShakenUniconPaths() {
    const usedIcons = [...getAllUsedIconNames(), ...options.iconWhitelist];
    const treeshakenUniconPaths = {};

    for (const iconName of usedIcons) {
      const path = allUniconPaths[iconName];
      if (path === undefined) {
        throw new Error(`Icon ${iconName} is not found in UniconPaths.json`);
      } else {
        treeshakenUniconPaths[iconName] = path;
      }
    }

    return treeshakenUniconPaths;
  }

  return {
    name: "tree-shake-unicon-paths",
    transform(_src, id) {
      if (process.env.NODE_ENV !== "production") {
        return;
      }
      if (id.endsWith("UniconPaths.json")) {
        return `export default ${JSON.stringify(getTreeShakenUniconPaths())}`;
      }
    },
  };
}

const cdnUrls =
  process.env.CARE_CDN_URL ??
  [
    "https://egov-s3-facility-10bedicu.s3.amazonaws.com",
    "https://egov-s3-patient-data-10bedicu.s3.amazonaws.com",
    "http://localhost:4566",
  ].join(" ");

export default defineConfig({
  envPrefix: "REACT_",
  plugins: [
    react(),
    treeShakeUniconPathsPlugin({
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
    proxy: {
      "/api": {
        target: process.env.CARE_API ?? "https://careapi.ohc.network",
        changeOrigin: true,
      },
    },
  },
  preview: {
    headers: {
      "Content-Security-Policy-Report-Only": `default-src 'self';\
      script-src 'self' blob: 'nonce-f51b9742' https://plausible.10bedicu.in;\
      style-src 'self' 'unsafe-inline';\
      connect-src 'self' https://plausible.10bedicu.in;\
      img-src 'self' https://cdn.coronasafe.network ${cdnUrls};\
      object-src 'self' ${cdnUrls};`,
    },
    port: 4000,
    proxy: {
      "/api": {
        target: process.env.CARE_API ?? "https://careapi.ohc.network",
        changeOrigin: true,
      },
    },
  },
});
