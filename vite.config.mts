import fs from "fs";
import {
  type Plugin,
  type UserConfig,
  type ViteDevServer,
  defineConfig,
  loadEnv,
  normalizePath,
} from "vite";

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

const LOCAL_PLUGIN_MODULE_ID = "virtual:care-local-plugins";
const RESOLVED_LOCAL_PLUGIN_MODULE_ID = `\0${LOCAL_PLUGIN_MODULE_ID}`;
const LOCAL_PLUGIN_PUBLIC_PREFIX = "/local-plugins";

interface LocalPluginDefinition {
  slug: string;
  importName: string;
  manifestPath: string;
  publicDir: string;
}

const LOCAL_PLUGIN_SOURCE_EXTENSIONS = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".mts",
  ".cjs",
  ".cts",
];

function toImportName(slug: string) {
  return `${slug.replace(/[^a-zA-Z0-9]+(.)/g, (_, char: string) => char.toUpperCase())}Manifest`;
}

function getLocalPluginDefinitions(rootDir: string): LocalPluginDefinition[] {
  const appsDir = path.join(rootDir, "apps");

  if (!fs.existsSync(appsDir)) {
    return [];
  }

  return fs
    .readdirSync(appsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const slug = entry.name;
      return {
        slug,
        importName: toImportName(slug),
        manifestPath: path.join(appsDir, slug, "src", "manifest.tsx"),
        publicDir: path.join(appsDir, slug, "public"),
      };
    })
    .filter((plugin) => fs.existsSync(plugin.manifestPath))
    .sort((left, right) => left.slug.localeCompare(right.slug));
}

function getMimeType(filePath: string) {
  const extension = path.extname(filePath).toLowerCase();

  switch (extension) {
    case ".css":
      return "text/css; charset=utf-8";
    case ".gif":
      return "image/gif";
    case ".html":
      return "text/html; charset=utf-8";
    case ".jpeg":
    case ".jpg":
      return "image/jpeg";
    case ".js":
      return "application/javascript; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".png":
      return "image/png";
    case ".svg":
      return "image/svg+xml";
    case ".txt":
      return "text/plain; charset=utf-8";
    case ".webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}

function isPluginManifestPath(rootDir: string, filePath: string) {
  const normalizedFilePath = normalizePath(filePath);
  const appsPrefix = `${normalizePath(path.join(rootDir, "apps"))}/`;
  return (
    normalizedFilePath.startsWith(appsPrefix) &&
    normalizedFilePath.endsWith("/src/manifest.tsx")
  );
}

function getPluginRootFromImporter(rootDir: string, importer?: string) {
  if (!importer) {
    return null;
  }

  const normalizedImporter = normalizePath(importer);
  const appsPrefix = `${normalizePath(path.join(rootDir, "apps"))}/`;

  if (!normalizedImporter.startsWith(appsPrefix)) {
    return null;
  }

  const relativeImporter = normalizedImporter.slice(appsPrefix.length);
  const [slug] = relativeImporter.split("/");

  if (!slug) {
    return null;
  }

  return path.join(rootDir, "apps", slug);
}

function resolveScopedAliasImport(
  rootDir: string,
  importer: string | undefined,
  id: string,
) {
  if (!id.startsWith("@/")) {
    return null;
  }

  const requestedPath = id.slice(2);
  const pluginRoot = getPluginRootFromImporter(rootDir, importer);
  const baseDir = pluginRoot
    ? path.join(pluginRoot, "src")
    : path.join(rootDir, "src");
  const basePath = path.resolve(baseDir, requestedPath);
  const candidates = [
    basePath,
    ...LOCAL_PLUGIN_SOURCE_EXTENSIONS.map(
      (extension) => `${basePath}${extension}`,
    ),
    ...LOCAL_PLUGIN_SOURCE_EXTENSIONS.map((extension) =>
      path.join(basePath, `index${extension}`),
    ),
  ];

  const isFile = (candidate: string) => {
    try {
      return fs.statSync(candidate).isFile();
    } catch {
      return false;
    }
  };

  return candidates.find(isFile) ?? basePath;
}

function rewriteLocalPluginImports(rootDir: string, id: string, code: string) {
  const pluginRoot = getPluginRootFromImporter(rootDir, id);

  if (!pluginRoot || !code.includes("@/")) {
    return null;
  }

  const rewrittenCode = code.replace(
    /(["'])@\/([^"']+)\1/g,
    (match, quote: string, requestPath: string) => {
      const resolvedImport = resolveScopedAliasImport(
        rootDir,
        id,
        `@/${requestPath}`,
      );

      if (
        !resolvedImport ||
        !fs.existsSync(resolvedImport) ||
        !fs.statSync(resolvedImport).isFile()
      ) {
        return match;
      }

      return `${quote}/@fs/${normalizePath(resolvedImport)}${quote}`;
    },
  );

  if (rewrittenCode === code) {
    return null;
  }

  return rewrittenCode;
}

// When a local plugin's CSS imports `tailwindcss/*` directly (used by the
// plugin's standalone build), strip those imports in dev. The host care_fe
// app already provides Tailwind v4 theme/preflight/utilities and scans
// apps/** via @source, so these imports would otherwise (a) re-run preflight
// over the entire host page and (b) emit no utilities (the utilities.css
// import isn't a v4 entry-point so it can't scan sources from here).
function stripPluginTailwindImports(rootDir: string, id: string, code: string) {
  if (!id.endsWith(".css")) {
    return null;
  }

  const pluginRoot = getPluginRootFromImporter(rootDir, id);
  if (!pluginRoot) {
    return null;
  }

  const stripped = code.replace(
    /@import\s+["']tailwindcss(?:\/[^"']*)?["'](?:\s+layer\([^)]*\))?\s*;?/g,
    "",
  );

  if (stripped === code) {
    return null;
  }

  return stripped;
}

function createLocalPluginModule(rootDir: string, command: "serve" | "build") {
  if (command !== "serve") {
    return [
      "export const localDevPluginConfigs = [];",
      "export const localDevPluginManifests = {};",
    ].join("\n");
  }

  const localPlugins = getLocalPluginDefinitions(rootDir);
  const imports = localPlugins.map(
    (plugin) =>
      `import ${plugin.importName} from ${JSON.stringify(`/@fs/${normalizePath(plugin.manifestPath)}`)};`,
  );

  const configEntries = localPlugins.map(
    (plugin) => `  {
    slug: ${JSON.stringify(plugin.slug)},
    meta: {
      name: ${JSON.stringify(plugin.slug)},
      localPath: ${JSON.stringify(`${LOCAL_PLUGIN_PUBLIC_PREFIX}/${plugin.slug}`)},
      package: ${JSON.stringify(`local/${plugin.slug}`)},
    },
  }`,
  );

  const manifestEntries = localPlugins.map(
    (plugin) => `  ${JSON.stringify(plugin.slug)}: ${plugin.importName}`,
  );

  return [
    ...imports,
    "",
    `export const localDevPluginConfigs = [\n${configEntries.join(",\n")}\n];`,
    `export const localDevPluginManifests = {\n${manifestEntries.join(",\n")}\n};`,
  ].join("\n");
}

function localPluginDevSupport(): Plugin {
  let rootDir = process.cwd();
  let command: "serve" | "build" = "build";

  return {
    name: "local-plugin-dev-support",
    enforce: "pre" as const,
    configResolved(config) {
      command = config.command;
      rootDir = config.root;
    },
    resolveId(id: string) {
      if (id === LOCAL_PLUGIN_MODULE_ID) {
        return RESOLVED_LOCAL_PLUGIN_MODULE_ID;
      }
    },
    load(id: string) {
      if (id === RESOLVED_LOCAL_PLUGIN_MODULE_ID) {
        return createLocalPluginModule(rootDir, command);
      }
    },
    transform(code: string, id: string) {
      const cssStripped = stripPluginTailwindImports(rootDir, id, code);
      const source = cssStripped ?? code;
      const rewritten = rewriteLocalPluginImports(rootDir, id, source);
      if (rewritten !== null) return rewritten;
      return cssStripped;
    },
    configureServer(server: ViteDevServer) {
      const appsDir = path.join(rootDir, "apps");
      const invalidateLocalPluginModule = () => {
        const localPluginModule = server.moduleGraph.getModuleById(
          RESOLVED_LOCAL_PLUGIN_MODULE_ID,
        );

        if (localPluginModule) {
          server.moduleGraph.invalidateModule(localPluginModule);
        }
      };

      if (fs.existsSync(appsDir)) {
        server.watcher.add(appsDir);
      }

      const reloadLocalPlugins = () => {
        invalidateLocalPluginModule();
        server.ws.send({ type: "full-reload" });
      };

      server.watcher.on("add", (filePath) => {
        if (isPluginManifestPath(rootDir, filePath)) {
          reloadLocalPlugins();
        }
      });

      server.watcher.on("unlink", (filePath) => {
        if (isPluginManifestPath(rootDir, filePath)) {
          reloadLocalPlugins();
        }
      });

      server.middlewares.use(LOCAL_PLUGIN_PUBLIC_PREFIX, (req, res, next) => {
        const requestUrl = req.url?.split("?")[0];

        if (!requestUrl) {
          next();
          return;
        }

        const [slug, ...segments] = decodeURIComponent(requestUrl)
          .replace(/^\/+/, "")
          .split("/")
          .filter(Boolean);

        if (!slug || segments.length === 0) {
          next();
          return;
        }

        const publicDir = path.resolve(rootDir, "apps", slug, "public");
        const requestedFile = path.resolve(publicDir, ...segments);

        if (
          requestedFile !== publicDir &&
          !requestedFile.startsWith(`${publicDir}${path.sep}`)
        ) {
          res.statusCode = 403;
          res.end("Forbidden");
          return;
        }

        if (
          !fs.existsSync(requestedFile) ||
          fs.statSync(requestedFile).isDirectory()
        ) {
          next();
          return;
        }

        res.setHeader("Content-Type", getMimeType(requestedFile));
        res.setHeader("Cache-Control", "no-store");
        res.end(fs.readFileSync(requestedFile));
      });
    },
  };
}

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
      localPluginDevSupport(),
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
        enableBuild: false,
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
      // Dedupe shared packages so locally-served plugin source (apps/*) resolves
      // these from the main app's node_modules instead of the plugin's own copy.
      // Without this, hooks break with "Should have a queue" / hook order errors
      // due to duplicate React (and friends) instances.
      dedupe: [
        "react",
        "react-dom",
        "react-i18next",
        "i18next",
        "@tanstack/react-query",
        "raviger",
        "sonner",
        "decimal.js",
      ],
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
