import browserslist from "browserslist";
import { getUserAgentRegex } from "browserslist-useragent-regexp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Minimum browser versions that must be enforced
// These are set to prevent unsupported browsers from bypassing the warning
// Update these when minimum requirements change
const MINIMUM_VERSIONS = {
  chrome: 110,
  firefox: 142,
  safari: 11,
  edge: 139,
  and_chr: 141,
  and_ff: 143,
  ios_saf: 11,
  samsung: 28,
};

// Get the list of browsers that will be supported
const browsers = browserslist();

// Validate that minimum versions are being enforced
console.log("Validating browser support configuration...");
let validationPassed = true;

for (const [browser, minVersion] of Object.entries(MINIMUM_VERSIONS)) {
  const browserMatches = browsers.filter((b) => b.startsWith(browser + " "));

  if (browserMatches.length === 0) {
    console.warn(
      `⚠️  Warning: No ${browser} versions found in browserslist output`,
    );
    continue;
  }

  // Extract version numbers from browser entries (e.g., "chrome 141" -> 141)
  const versions = browserMatches.map((b) => {
    const version = b.split(" ")[1];
    // Handle ranges like "11.0-11.2" - take the first version
    return parseFloat(version.split("-")[0]);
  });

  const oldestVersion = Math.min(...versions);

  if (oldestVersion < minVersion) {
    console.error(
      `❌ Error: ${browser} minimum version is ${minVersion}, but browserslist includes ${oldestVersion}`,
    );
    validationPassed = false;
  } else {
    console.log(
      `✓ ${browser}: minimum ${minVersion}, oldest in list: ${oldestVersion}`,
    );
  }
}

if (!validationPassed) {
  console.error(
    "\n❌ Validation failed: Browserslist configuration does not enforce required minimum versions",
  );
  console.error(
    "Please check the 'browserslist' section in package.json and ensure minimum versions are set correctly.",
  );
  process.exit(1);
}

console.log("\n✓ Validation passed: All minimum browser versions are enforced");

const regex = getUserAgentRegex({
  ignoreMinor: true,
  ignorePatch: true,
  allowZeroSubversions: false,
  allowHigherVersions: true,
});

const supportedBrowsersPath = path.resolve(
  __dirname,
  "../src/supportedBrowsers.ts",
);
fs.writeFileSync(
  supportedBrowsersPath,
  `/* eslint-disable */
export default ${regex};
`,
);

console.log(`\n✓ Generated ${supportedBrowsersPath}`);
