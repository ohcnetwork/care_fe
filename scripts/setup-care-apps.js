// eslint-disable-next-line @typescript-eslint/no-var-requires
const { execSync } = require("child_process");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require("fs");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("path");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const simpleGit = require("simple-git");
require("dotenv").config({ path: [".env.local", ".env"] });


console.log("Preinstall script running");

// Function to read apps.json or return an empty array if it doesn't exist
function readAppsConfig() {
  const appsConfig = process.env.REACT_ENABLED_APPS
    ? process.env.REACT_ENABLED_APPS.split(",").map((app) => ({
        branch: app.split("@")[1],
        package: app.split("@")[0],
      }))
    : [];
  console.log("Found apps: ", appsConfig);
  return appsConfig;
}

const appsConfig = readAppsConfig();
const appsDir = path.join(__dirname, "..", "apps");

// Create apps directory if it doesn't exist
if (!fs.existsSync(appsDir)) {
  fs.mkdirSync(appsDir);
}
const installApp = async (app) => {
  const appDir = path.join(appsDir, app.package.split("/")[1]);

  console.log(`Cloning ${app.package}...`);

  const git = simpleGit();

  try {
    // Form the clone URL
    const cloneUrl = `https://github.com/${app.package.replace("github:", "")}.git`;

    // Clone the repository using simple-git
    await git.clone(cloneUrl, appDir, {
      '--branch': app.branch, // Use branch if provided
    });

    // Create a care-package.lock file
    fs.writeFileSync(
      path.join(appDir, "care-package.lock"),
      JSON.stringify(
        {
          package: app.package,
          branch: app.branch,
        },
        null,
        2,
      ),
    );

    console.log(`Cloned ${app.package} successfully.`);
  } catch (error) {
    console.error(`Error cloning ${app.package}:`, error);
  }
};
// Clone or pull care apps
appsConfig.forEach((app) => {
  const appDir = path.join(appsDir, app.package.split("/")[1]);
  if (fs.existsSync(appDir)) {
    if (fs.existsSync(path.join(appDir, "care-package.lock"))) {
      // verify if the branch and package match with the care-package.lock file
      const lockFile = JSON.parse(
        fs.readFileSync(path.join(appDir, "care-package.lock"), "utf8"),
      );
      if (lockFile.package === app.package && lockFile.branch === app.branch) {
        console.log(`Package already exists. Pulling latest changes...`);
        execSync(`git -C "${appDir}" pull`, { stdio: "inherit" });
        return;
      } else {
        console.log(`Branch/package does not match. Recreating...`);
        fs.rmSync(appDir, { recursive: true, force: true });
      }
    } else {
      console.log(
        `Package already exists but care-package.lock file does not exist. Recreating...`,
      );
      fs.rmSync(appDir, { recursive: true, force: true });
    }
  }

  installApp(app);
});

console.log("All apps have been cloned or updated in apps directory.");

const importApps = appsConfig.map((app) => ({
  ...app,
  camelCaseName: app.package
    .split("/")[1]
    .replace(/[-_]/g, "")
    .replace(/\b\w/g, (char, index) =>
      index === 0 ? char.toLowerCase() : char.toUpperCase(),
    ),
}));

// Generate pluginMap.ts
const pluginMapPath = path.join(__dirname, "..", "src", "pluginMap.ts");
const pluginMapContent = `import { PluginManifest } from "./pluginTypes";

${importApps
  .map(
    (app) =>
      `import ${app.camelCaseName}Manifest from "@app-manifest/${app.package.split("/")[1]}";`,
  )
  .join("\n")}

export const pluginMap: PluginManifest[] = [
${importApps.map((app) => `  ${app.camelCaseName}Manifest`).join(",\n")}
];
`;

fs.writeFileSync(pluginMapPath, pluginMapContent);
console.log("Generated pluginMap.ts");
