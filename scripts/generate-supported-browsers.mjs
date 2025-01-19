import { getUserAgentRegex } from "browserslist-useragent-regexp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
