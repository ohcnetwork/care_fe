import { execSync } from "child_process";
import os from "os";

const platform = os.platform();
const arch = os.arch();

const deps: Record<string, Record<string, string[]>> = {
  darwin: {
    arm64: ["@rollup/rollup-darwin-arm64"],
    x64: ["@rollup/rollup-darwin-x64"],
  },
  linux: {
    arm64: ["@rollup/rollup-linux-arm64-gnu", "@esbuild/linux-arm64"],
    x64: ["@rollup/rollup-linux-x64-gnu", "@esbuild/linux-x64"],
  },
};

const platformDeps = deps[platform]?.[arch] || [];

if (platformDeps.length > 0) {
  console.log(
    `Installing platform-specific dependencies for ${platform}-${arch}`,
  );
  try {
    // Check if dependencies are already installed
    const isInstalled = platformDeps.every((dep) => {
      try {
        require.resolve(dep);
        return true;
      } catch {
        return false;
      }
    });

    if (!isInstalled) {
      execSync(`npm install --no-save ${platformDeps.join(" ")}`, {
        stdio: "inherit",
      });
    } else {
      console.log("Platform-specific dependencies are already installed");
    }
  } catch (error) {
    console.error("Failed to install platform-specific dependencies:", error);
    // Don't exit with error code 1 to prevent build failure
    console.log("Continuing build process...");
  }
}
