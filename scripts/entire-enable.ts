import { execSync } from "child_process";

try {
  execSync("entire --version", { stdio: "ignore" });
} catch {
  process.exit(0);
}

try {
  execSync("entire enable", { stdio: "inherit" });
} catch (error) {
  console.error("Failed to run `entire enable`:", error);
}
