import fs from "node:fs";
import path from "node:path";

const [inventoryPath, timingsPath, shardArg, shardCountArg, outputPath] =
  process.argv.slice(2);
const shardNumber = Number(shardArg);
const shardCount = Number(shardCountArg);

if (
  !inventoryPath ||
  !timingsPath ||
  !Number.isInteger(shardNumber) ||
  !Number.isInteger(shardCount) ||
  shardNumber < 1 ||
  shardNumber > shardCount ||
  !outputPath
) {
  throw new Error(
    "Usage: node scripts/plan-playwright-shard.mjs <inventory.json> <timings.json> <shard> <shard-count> <output.list>",
  );
}

function readReporterJson(filePath) {
  const contents = fs.readFileSync(filePath, "utf8");
  const jsonStart = contents.indexOf('{\n  "config"');
  if (jsonStart === -1) {
    throw new Error(`Could not find Playwright JSON output in ${filePath}`);
  }
  return JSON.parse(contents.slice(jsonStart));
}

const inventory = readReporterJson(inventoryPath);
const timingData = JSON.parse(fs.readFileSync(timingsPath, "utf8"));
const knownDurations = timingData.durations ?? {};
const fallbackDuration =
  Object.values(knownDurations).reduce((sum, value) => sum + value, 0) /
  Math.max(Object.keys(knownDurations).length, 1);
const serialFiles = new Set();
const tests = [];

function collectSerialFiles(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      collectSerialFiles(entryPath);
    } else if (/\.(?:spec|test)\.[cm]?[jt]sx?$/.test(entry.name)) {
      const source = fs.readFileSync(entryPath, "utf8");
      if (
        /\b(?:test|describe)\.serial\s*\(|\bmode\s*:\s*["']serial["']/.test(
          source,
        )
      ) {
        serialFiles.add(path.relative("tests", entryPath).split(path.sep).join("/"));
      }
    }
  }
}

function collectTests(suite, file = null, titlePath = []) {
  const currentFile = suite.file ?? file;
  const isFileSuite = Boolean(suite.file && suite.line === 0);
  const currentTitlePath =
    suite.title && !isFileSuite ? [...titlePath, suite.title] : titlePath;

  for (const spec of suite.specs ?? []) {
    const specFile = spec.file ?? currentFile;
    if (!specFile) continue;

    for (const test of spec.tests ?? []) {
      if (test.projectName !== "chromium") continue;

      const titles = [...currentTitlePath, spec.title];
      if (titles.some((title) => title.includes("›"))) {
        throw new Error(
          `Test title in ${specFile} contains the Playwright test-list delimiter`,
        );
      }
      const selector = `[chromium] › ${specFile}:${spec.line} › ${titles.join(" › ")}`;
      const key = JSON.stringify([specFile, titles]);
      const estimate = Number(knownDurations[key]);
      tests.push({
        file: specFile,
        key,
        selector,
        duration:
          Number.isFinite(estimate) && estimate > 0
            ? estimate
            : fallbackDuration || 1,
      });
    }
  }

  for (const child of suite.suites ?? []) {
    collectTests(child, currentFile, currentTitlePath);
  }
}

collectSerialFiles("tests");
for (const suite of inventory.suites ?? []) collectTests(suite);

if (tests.length === 0) {
  throw new Error("Playwright test inventory contains no Chromium tests");
}

const unitsByKey = new Map();
for (const test of tests) {
  const unitKey = serialFiles.has(test.file) ? test.file : test.key;
  const unit = unitsByKey.get(unitKey) ?? {
    duration: 0,
    selectors: new Set(),
  };
  unit.duration += test.duration;
  unit.selectors.add(test.selector);
  unitsByKey.set(unitKey, unit);
}

const bins = Array.from({ length: shardCount }, () => ({
  duration: 0,
  units: [],
}));
const units = [...unitsByKey.entries()].sort(
  ([keyA, unitA], [keyB, unitB]) =>
    unitB.duration - unitA.duration || keyA.localeCompare(keyB),
);

for (const [key, unit] of units) {
  let target = 0;
  for (let index = 1; index < bins.length; index += 1) {
    if (bins[index].duration < bins[target].duration) target = index;
  }
  bins[target].units.push({ key, ...unit });
  bins[target].duration += unit.duration;
}

const selected = bins[shardNumber - 1];
const selectors = [
  ...new Set(selected.units.flatMap((unit) => [...unit.selectors])),
].sort();
fs.writeFileSync(outputPath, `${selectors.join("\n")}\n`);

console.log(
  `Shard ${shardNumber}/${shardCount}: ${selectors.length} selectors, ~${Math.round(selected.duration)}s estimated test work`,
);
