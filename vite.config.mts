import { ValidateEnv } from "@julr/vite-plugin-validate-env";
import federation from "@originjs/vite-plugin-federation";
import react from "@vitejs/plugin-react";
import DOMPurify from "dompurify";
import fs from "fs";
import { JSDOM } from "jsdom";
import { marked } from "marked";
import { createRequire } from "node:module";
import path from "path";
import { defineConfig, loadEnv } from "vite";
import checker from "vite-plugin-checker";
import { VitePWA } from "vite-plugin-pwa";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { z } from "zod";

import { treeShakeCareIcons } from "./plugins/treeShakeCareIcons";

const pdfWorkerPath = path.join(
  path.dirname(
    createRequire(import.meta.url).resolve("pdfjs-dist/package.json"),
  ),
  "build",
  "pdf.worker.min.mjs",
);

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

function getPluginDependencies(): string[] {
  const pluginsDir = path.resolve(__dirname, "apps");
  // Make sure the `apps` folder exists
  if (!fs.existsSync(pluginsDir)) {
    return [];
  }
  const pluginFolders = fs.readdirSync(pluginsDir);

  const dependencies = new Set<string>();

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

// Recursive function to check if the module is statically imported by an entry point
function isStaticallyImportedByEntry(
  getModuleInfo: (moduleId: string) => any,
  moduleId: string,
  visited = new Set(),
) {
  if (visited.has(moduleId)) return false;
  visited.add(moduleId);

  const modInfo = getModuleInfo(moduleId);
  if (!modInfo) return false;

  // Check if the module is an entry point
  if (modInfo.isEntry) {
    return true;
  }

  // Check all static importers
  for (const importerId of modInfo.importers) {
    if (isStaticallyImportedByEntry(getModuleInfo, importerId, visited)) {
      return true;
    }
  }

  return false;
}

/**
 * Generates remote module configurations for Module Federation
 *
 * Supports two formats for REACT_ENABLED_APPS:
 * 1. GitHub Pages: "organization/repository[@branch]"
 *    Example: "coronasafe/care_fe@main"
 *
 * 2. Local Development: "localhost:port/organization/repository[@branch]"
 *    Example: "localhost:5173/coronasafe/care_fe@main"
 *
 * @param enabledApps - Comma-separated list of enabled apps
 * @returns Remote module configuration object for Module Federation
 */
function getRemotes(enabledApps: string) {
  if (!enabledApps) return {};

  return enabledApps.split(",").reduce((acc, app) => {
    const [package_, branch = "main"] = app.split("@");

    // Handle localhost development URLs
    if (package_.startsWith("localhost")) {
      const [host, ...pathParts] = package_.split("/");
      const [org, repo] = pathParts.join("/").split("/");
      const remoteUrl = `"http://${host}/assets/remoteEntry.js"`;
      console.log(`Using Local Remote Module for ${org}/${repo}:`, remoteUrl);
      return {
        ...acc,
        [repo]: {
          external: `Promise.resolve(${remoteUrl})`,
          from: "vite",
          externalType: "promise",
        },
      };
    }

    // Handle GitHub Pages URLs
    const [org, repo] = package_.split("/");
    const remoteUrl = `"https://${org}.github.io/${repo}/assets/remoteEntry.js"`;
    console.log(
      `Using GitHub Pages Remote Module for ${org}/${repo}:`,
      remoteUrl,
    );
    return {
      ...acc,
      [repo]: {
        external: `Promise.resolve(${remoteUrl})`,
        from: "vite",
        externalType: "promise",
      },
    };
  }, {});
}

/** @type {import('vite').UserConfig} */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

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
      __CUSTOM_DESCRIPTION_HTML__: getDescriptionHtml(
        env.REACT_CUSTOM_DESCRIPTION || "",
      ),
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
        shared: ["react", "react-dom"],
      }),
      ValidateEnv({
        validator: "zod",
        schema: {
          REACT_CARE_API_URL: z.string().url(),

          REACT_SENTRY_DSN: z.string().url().optional(),
          REACT_SENTRY_ENVIRONMENT: z.string().optional(),

          REACT_PLAUSIBLE_SITE_DOMAIN: z
            .string()
            .regex(/^[a-zA-Z0-9][a-zA-Z0-9-_.]*\.[a-zA-Z]{2,}$/)
            .optional()
            .describe("Domain name without protocol (e.g., sub.domain.com)"),

          REACT_PLAUSIBLE_SERVER_URL: z.string().url().optional(),
          REACT_CDN_URLS: z
            .string()
            .optional()
            .transform((val) => val?.split(" "))
            .pipe(z.array(z.string().url()).optional())
            .describe("Optional: Space-separated list of CDN URLs"),
        },
      }),
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
  };
});
