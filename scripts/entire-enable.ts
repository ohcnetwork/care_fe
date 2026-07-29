import { execSync } from "child_process";

// Enables the Entire CLI (https://entire.io) for this repository if the
// developer has it installed locally. This is a no-op for anyone who does
// not have the `entire` CLI installed, so it never blocks the `prepare` step.
try {
  execSync("entire --version", { stdio: "ignore" });
} catch {
  // `entire` CLI is not installed, nothing to do.
  process.exit(0);
}

try {
  execSync("entire enable", { stdio: "inherit" });
} catch (error) {
  console.error("Failed to run `entire enable`:", error);
  // Don't fail the install/prepare process because of this.
}
