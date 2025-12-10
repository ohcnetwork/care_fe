import { existsSync } from "fs";
import path from "path";
import type { Plugin } from "vite";

/**
 * This is a workaround to fix the sonner package.json resolution issue.
 *
 * Fixes the resolution issue where vite-plugin-federation tries to resolve
 * "sonner/package.json" which doesn't exist in the package exports.
 * This plugin intercepts the resolution and returns the actual package.json file path.
 */
export function fixSonnerPackageJson(): Plugin {
  const packageJsonPath = path.resolve(
    process.cwd(),
    "node_modules/sonner/package.json",
  );

  return {
    name: "fix-sonner-package-json",
    enforce: "pre",
    resolveId(id) {
      // Intercept requests for sonner/package.json
      if (
        id === "sonner/package.json" ||
        id.endsWith("/sonner/package.json") ||
        (id.includes("sonner") &&
          id.includes("package.json") &&
          !id.includes("node_modules"))
      ) {
        // Return the actual file path if it exists
        if (existsSync(packageJsonPath)) {
          return packageJsonPath;
        }
      }
      return null;
    },
  };
}
