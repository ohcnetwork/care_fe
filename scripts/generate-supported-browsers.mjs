import {
  applyVersionsToRegex,
  compileRegex,
  getPreUserAgentRegexes,
  versionsListToRanges,
} from "browserslist-useragent-regexp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options = {
  ignoreMinor: true,
  ignorePatch: true,
  allowZeroSubversions: false,
  allowHigherVersions: true,
};

// Browsers on iOS identify themselves with their own tokens (e.g. `CriOS/`)
// instead of `Chrome/`, `Firefox/` or `Edg/`. browserslist-useragent-regexp
// only recognises them through the iOS version in the user agent, which is
// absent in "desktop mode" (the default on iPad). Accept them with the same
// minimum versions as their desktop counterparts.
const IOS_BROWSER_TOKENS = {
  chrome: "CriOS",
  firefox: "FxiOS",
  edge: "EdgiOS",
};

const regexes = getPreUserAgentRegexes(options);

const iosRegexes = regexes
  .filter(({ family }) => family in IOS_BROWSER_TOKENS)
  .map(({ family, matchedVersions }) => ({
    regexAst: applyVersionsToRegex(
      `${IOS_BROWSER_TOKENS[family]}\\/(\\d+)\\.(\\d+)(\\.(\\d+)|)`,
      versionsListToRanges(matchedVersions),
      options,
    ),
  }));

const regex = compileRegex([...regexes, ...iosRegexes]);

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
