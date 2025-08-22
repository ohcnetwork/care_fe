import * as fs from "fs";
import { globSync } from "glob";
import * as path from "path";
import { Plugin } from "vite";

/**
 * Interface defining options for the treeShakeUniconPathsPlugin.
 *
 * @interface TreeShakeUniconPathsPluginOptions
 * @property {string[]} iconWhitelist - An array of icon names to always include, even if not found in code.
 */

export interface TreeShakeCareIconsOptions {
  iconWhitelist: string[];
}

/**
 * Creates a Webpack plugin that tree-shakes unused Unicon paths from UniconPaths.json in production builds.
 *
 * @param {TreeShakeCareIconsOptions} [options] - Optional configuration options. Defaults to an empty iconWhitelist.
 * @returns {Plugin} Webpack plugin object.
 */

export function treeShakeCareIcons(
  options: TreeShakeCareIconsOptions = { iconWhitelist: [] },
): Plugin {
  const rootDir = path.resolve(__dirname, ".."); // update this if moving this code to a different file
  const lineIconNameRegex = /"l-[a-z]+(?:-[a-z]+)*"/g;
  const allUniconPaths = JSON.parse(
    fs.readFileSync(
      path.resolve(rootDir, "src/CAREUI/icons/UniconPaths.json"),
      "utf8",
    ),
  );

  // Extracts icon names from a given file's content.
  // Returns an array of icon names like ["l-eye", "l-sync", "l-hearbeat"]
  function extractCareIconNames(file: string): string[] {
    const fileContent = fs.readFileSync(file, "utf8");

    const lineIconNameMatches = fileContent.match(lineIconNameRegex) || [];

    const lineIconNames = lineIconNameMatches.map(
      (lineIconName) => lineIconName.slice(1, -1), // remove quotes
    );

    return lineIconNames;
  }
  // Finds all used icon names within the project's source files (`.tsx` or `.res` extensions).
  function getAllUsedIconNames() {
    const files = globSync(path.resolve(rootDir, "{apps,src}/**/*.{tsx,ts}"));
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
    const treeshakenCareIconPaths: { [key: string]: string } = {};

    for (const iconName of usedIcons) {
      const path = allUniconPaths[iconName];
      if (path === undefined) {
        throw new Error(`Icon ${iconName} is not found in UniconPaths.json`);
      } else {
        treeshakenCareIconPaths[iconName] = path;
      }
    }

    return treeshakenCareIconPaths;
  }

  return {
    name: "tree-shake-care-icons",
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
