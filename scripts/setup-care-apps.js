// eslint-disable-next-line @typescript-eslint/no-var-requires
const { execSync } = require("child_process");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require("fs");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("path");

console.log("Preinstall script running");

// Function to read apps.json or return an empty array if it doesn't exist
function readAppsConfig() {
  const appsConfigPath = path.join(__dirname, "..", "apps.json");
  if (fs.existsSync(appsConfigPath)) {
    const rawData = fs.readFileSync(appsConfigPath, "utf8");
    return JSON.parse(rawData);
  }
  return [];
}

const appsConfig = readAppsConfig();
const appsDir = path.join(__dirname, "..", "apps");

// Create apps directory if it doesn't exist
if (!fs.existsSync(appsDir)) {
  fs.mkdirSync(appsDir);
}

appsConfig.forEach((app) => {
  const appDir = path.join(appsDir, app.name);
  if (!fs.existsSync(appDir)) {
    console.log(`Cloning ${app.name}...`);
    execSync(`npx -y gitget ${app.package} apps/${app.name}`, {
      stdio: "inherit",
    });
  } else {
    console.log(`${app.name} already exists. Pulling latest changes...`);
    execSync(`cd ${appDir} && git pull`, { stdio: "inherit" });
  }
});

console.log("All apps have been cloned or updated in apps directory.");

const importApps = appsConfig.map((app) => ({
  ...app,
  camelCaseName: app.name
    .replace(/-/g, "")
    .replace(/\b\w/g, (char, index) =>
      index === 0 ? char.toLowerCase() : char.toUpperCase(),
    ),
}));

// Add the following code to generate pluginMap.ts
const pluginMapPath = path.join(__dirname, "..", "src", "pluginMap.ts");
const pluginMapContent = `import { PluginManifest } from './pluginTypes';

${importApps
  .map(
    (app) =>
      `import ${app.camelCaseName}Manifest from "@app-manifest/${app.name}";`,
  )
  .join("\n")}

export const pluginMap: PluginManifest[] = [
${importApps.map((app) => `  ${app.camelCaseName}Manifest`).join(",\n")}
];
`;

fs.writeFileSync(pluginMapPath, pluginMapContent);
console.log("Generated pluginMap.ts");
