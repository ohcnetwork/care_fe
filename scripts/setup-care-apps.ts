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

// Function to read enabled apps from env
function readAppsConfig(): Plugin[] {
  const appsConfig = process.env.REACT_ENABLED_APPS
    ? process.env.REACT_ENABLED_APPS.split(",").map((app) => {
        const package_ = app.includes("|")
          ? app.split("|")[1].split("@")[0]
          : app.split("@")[0];
        console.log(package_);
        const [, repo] = package_.split("/");
        return {
          repo,
          // Convert repo name to camelCase for import
          camelCaseName: repo
            .replace(/[-_]/g, "")
            .replace(/\b\w/g, (char, index) =>
              index === 0 ? char.toLowerCase() : char.toUpperCase(),
            ),
        };
      })
    : [];
  console.log("Found plugins: ", appsConfig);
  return appsConfig;
}

const plugins = readAppsConfig();

// Generate pluginMap.ts
const pluginMapPath = path.join(__dirname, "..", "src", "pluginMap.ts");
const pluginMapContent = `// Use type assertion for the static import\n${plugins
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
