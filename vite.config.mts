import { VitePWA } from "vite-plugin-pwa";
import { Plugin, defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import * as fs from "fs";
import * as path from "path";
import * as glob from "glob";

/**
 * Interface defining options for the treeShakeUniconPathsPlugin.
 *
 * @interface TreeShakeUniconPathsPluginOptions
 * @property {string[]} iconWhitelist - An array of icon names to always include, even if not found in code.
 */
interface TreeShakeUniconPathsPluginOptions {
  iconWhitelist: string[];
}

/**
 * Creates a Webpack plugin that tree-shakes unused Unicon paths from UniconPaths.json in production builds.
 *
 * @param {TreeShakeUniconPathsPluginOptions} [options] - Optional configuration options. Defaults to an empty iconWhitelist.
 * @returns {Plugin} Webpack plugin object.
 */
export function treeShakeUniconPathsPlugin(
  options: TreeShakeUniconPathsPluginOptions = { iconWhitelist: [] }
): Plugin {
  const rootDir = __dirname; // update this if moving this code to a different file
  const lineIconNameRegex = /"l-[a-z]+(?:-[a-z]+)*"/g;
  const allUniconPaths = JSON.parse(
    fs.readFileSync(
      path.resolve(rootDir, "src/CAREUI/icons/UniconPaths.json"),
      "utf8"
    )
  );

  // Extracts icon names from a given file's content.
  // Returns an array of icon names like ["l-eye", "l-sync", "l-hearbeat"]
  function extractCareIconNames(file: string): string[] {
    const fileContent = fs.readFileSync(file, "utf8");

    const lineIconNameMatches = fileContent.match(lineIconNameRegex) || [];

    const lineIconNames = lineIconNameMatches.map(
      (lineIconName) => lineIconName.slice(1, -1) // remove quotes
    );

    return lineIconNames;
  }
  // Finds all used icon names within the project's source files (`.tsx` or `.res` extensions).
  function getAllUsedIconNames() {
    const files = glob.sync(path.resolve(rootDir, "src/**/*.{tsx,res}"));
    const usedIconsArray: string[] = [];

    files.forEach((file) => {
      const iconNames = extractCareIconNames(file);
      usedIconsArray.push(...iconNames);
    });

    return new Set(usedIconsArray);
  }
  // Generates a map of used icon names to their paths from UniconPaths.json, including any whitelisted icons.
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

      // Replace the UniconPaths with the tree-shaken version
      if (id.endsWith("UniconPaths.json")) {
        return {
          code: `export default ${JSON.stringify(getTreeShakenUniconPaths())}`,
          map: null,
        };
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
