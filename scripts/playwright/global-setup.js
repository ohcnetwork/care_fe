import { spawn as spawnProcess } from "child_process";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

async function globalSetup() {
  const cwd = process.cwd();

  // Collect all .env* files from current working directory
  let envFiles = [];
  try {
    envFiles = fs.readdirSync(cwd).filter((f) => f.startsWith(".env"));
  } catch {
    // ignore if no env files
  }

  // Helper to extract an env var from available .env files
  function getEnvVarFromFiles(varName) {
    for (const file of envFiles) {
      const fullPath = path.join(cwd, file);
      try {
        const res = dotenv.config({ path: fullPath });
        if (res.parsed && res.parsed[varName]) {
          return res.parsed[varName];
        }
      } catch {
        // ignore parse errors
      }
    }
    if (process.env[varName]) {
      return process.env[varName];
    }
    return null;
  }

  // Get CARE_BE_LOCATION
  const CARE_BE_LOCATION = getEnvVarFromFiles("CARE_BE_LOCATION");
  if (!CARE_BE_LOCATION) {
    console.log(
      "⚠️ CARE_BE_LOCATION is not set. Please set it to your local care_be clone path to automate test DB setup.",
    );
    return;
  }

  const locationPath = path.resolve(CARE_BE_LOCATION);

  if (
    !fs.existsSync(locationPath) ||
    !fs.statSync(locationPath).isDirectory()
  ) {
    throw new Error(
      `❌ Directory ${locationPath} does not exist or is not a directory.`,
    );
  }

  // Spawn the process with inherited stdio so output appears live
  const child = spawnProcess("make", ["up-playwright"], {
    cwd: locationPath,
    env: { ...process.env },
    stdio: "inherit", // use parent process's stdio
  });

  // Wait for the process to finish
  await new Promise((resolve, reject) => {
    child.on("exit", (code, signal) => {
      if (code === 0) {
        resolve();
      } else {
        const msg = `make up-playwright failed with exit code ${code} (signal ${signal})`;
        console.error(msg);
        const err = new Error(msg);
        err.exitCode = code;
        err.signal = signal;
        reject(err);
      }
    });
  });
}

export default globalSetup;
