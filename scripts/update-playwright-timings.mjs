import fs from "node:fs";
import path from "node:path";

const [resultsDirectory, outputPath] = process.argv.slice(2);
if (!resultsDirectory || !outputPath) {
  throw new Error(
    "Usage: node scripts/update-playwright-timings.mjs <results-directory> <output.json>",
  );
}

function findResultFiles(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...findResultFiles(entryPath));
    else if (entry.name === "test-results.json") files.push(entryPath);
  }
  return files;
}

function collectDurations(suite, durations, file = null, titlePath = []) {
  const currentFile = suite.file ?? file;
  const isFileSuite = Boolean(suite.file && suite.line === 0);
  const currentTitlePath =
    suite.title && !isFileSuite ? [...titlePath, suite.title] : titlePath;

  for (const spec of suite.specs ?? []) {
    const specFile = spec.file ?? currentFile;
    if (!specFile) continue;

    for (const test of spec.tests ?? []) {
      if (test.projectName !== "chromium") continue;
      const successfulAttempt = test.results?.find(
        (result) => result.status === "passed",
      );
      const attempt = successfulAttempt ?? test.results?.at(-1);
      if (!attempt || attempt.duration <= 0) continue;

      const key = JSON.stringify([specFile, [...currentTitlePath, spec.title]]);
      const observations = durations.get(key) ?? [];
      observations.push(attempt.duration / 1000);
      durations.set(key, observations);
    }
  }

  for (const child of suite.suites ?? []) {
    collectDurations(child, durations, currentFile, currentTitlePath);
  }
}

const previous = fs.existsSync(outputPath)
  ? JSON.parse(fs.readFileSync(outputPath, "utf8"))
  : {};
const observations = new Map();
for (const resultFile of findResultFiles(resultsDirectory)) {
  const report = JSON.parse(fs.readFileSync(resultFile, "utf8"));
  for (const suite of report.suites ?? []) {
    collectDurations(suite, observations);
  }
}

const durations = { ...(previous.durations ?? {}) };
for (const [key, samples] of observations) {
  durations[key] =
    Math.round(
      (samples.reduce((sum, value) => sum + value, 0) / samples.length) * 1000,
    ) / 1000;
}

fs.writeFileSync(
  outputPath,
  `${JSON.stringify(
    {
      version: 1,
      updatedAt: new Date().toISOString(),
      sourceRun: process.env.GITHUB_RUN_ID ?? previous.sourceRun ?? null,
      durations,
    },
    null,
    2,
  )}\n`,
);
console.log(`Updated ${observations.size} test durations`);
