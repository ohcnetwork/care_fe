import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: [".env.local", ".env"] });

console.log("Setting up Care plugins...");

interface Plugin {
  repo: string;
  camelCaseName: string;
}

interface ParsedRemoteConfig {
  url: string;
  org: string;
  repo: string;
}

/**
 * Parses a remote app configuration string into its components
 * Supports two formats:
 * 1. GitHub Pages: "organization/repository"
 *    Example: "coronasafe/care_fe"
 *
 * 2. Custom URL: "organization/repository@url"
 *    Example: "coronasafe/care_fe@localhost:5173"
 *    Example: "coronasafe/care_fe@care.coronasafe.network"
 *    Note: Protocol (http/https) is automatically added in the vite config:
 *    - localhost URLs use http://
 *    - all other URLs use https://
 *
 * @param appConfig - Configuration string for a remote app
 * @returns Parsed configuration object
 */
function parseRemoteConfig(appConfig: string): ParsedRemoteConfig {
  // Handle custom URLs (both localhost and custom hosted)
  if (appConfig.includes("@")) {
    const [package_] = appConfig.split("@");
    const [org, repo] = package_.split("/");
    return {
      url: "", // URL not needed for plugin setup
      org,
      repo,
    };
  }

  // Handle GitHub Pages URLs
  const [org, repo] = appConfig.split("/");
  return {
    url: "", // URL not needed for plugin setup
    org,
    repo,
  };
}

// Function to read enabled apps from env
function readAppsConfig(): Plugin[] {
  if (!process.env.REACT_ENABLED_APPS) {
    return [];
  }

  const plugins = process.env.REACT_ENABLED_APPS.split(",").map((app) => {
    const { repo } = parseRemoteConfig(app);
    return {
      repo,
      // Convert repo name to camelCase for import
      camelCaseName: repo.replace(/[-_](\w)/g, (_, c) => c.toUpperCase()),
    };
  });

  console.log("Found plugins:", plugins);
  return plugins;
}

const plugins = readAppsConfig();

// Generate pluginMap.ts
const pluginMapPath = path.join(__dirname, "..", "src", "pluginMap.ts");
const pluginMapContent = `/* eslint-disable */
// Use type assertion for the static import\n${plugins
  .map(
    (plugin) =>
      `// @ts-expect-error Remote module will be available at runtime\nimport ${plugin.camelCaseName}Manifest from "${plugin.repo}/manifest";`,
  )
  .join("\n")}

import type { PluginManifest } from "./pluginTypes";

const pluginMap: PluginManifest[] = [${plugins.map((plugin) => `${plugin.camelCaseName}Manifest as PluginManifest`).join(",\n  ")}];

export { pluginMap };
`;

fs.writeFileSync(pluginMapPath, pluginMapContent);
console.log("Generated pluginMap.ts");
console.log("Plugin setup complete!");
