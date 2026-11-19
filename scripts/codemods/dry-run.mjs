#!/usr/bin/env node
/**
 * Dry run of the raviger codemod. It writes nothing to `src/`.
 *
 * It runs jscodeshift with `--dry`, collects the site report, and writes a
 * JSON summary: converted and skipped sites, by kind, by reason, and by file.
 *
 * Usage (from the repository root):
 *   node scripts/codemods/dry-run.mjs [--out=<file.json>] [--target=src]
 *     [--targetPrefix=<prefix,...>] [--routeTree=<file>] [--cpus=<n>]
 *
 * The raw site lines go to `<out>.jsonl` beside the summary.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const transform = path.join(here, "raviger-to-tanstack.js");

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .filter((arg) => arg.startsWith("--"))
    .map((arg) => {
      const [key, ...value] = arg.slice(2).split("=");
      return [key, value.join("=") || "true"];
    }),
);
const out = path.resolve(args.out || "codemod-dryrun.json");
const jsonl = out.replace(/\.json$/, "") + ".jsonl";
const target = args.target || "src";

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.rmSync(jsonl, { force: true });

const command = [
  "npx",
  "--yes",
  "jscodeshift@17",
  "--dry",
  "--silent",
  `--cpus=${args.cpus || 3}`,
  `--transform=${transform}`,
  "--parser=tsx",
  "--extensions=ts,tsx",
  "--ignore-pattern=**/routeTree.gen.ts",
  `--report=${jsonl}`,
  ...(args.routeTree ? [`--routeTree=${args.routeTree}`] : []),
  ...(args.targetPrefix ? [`--targetPrefix=${args.targetPrefix}`] : []),
  target,
];
const run = spawnSync(command[0], command.slice(1), { encoding: "utf8" });
if (run.status !== 0) {
  console.error(run.stdout, run.stderr);
  process.exit(run.status ?? 1);
}

const sites = fs.existsSync(jsonl)
  ? fs
      .readFileSync(jsonl, "utf8")
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line))
      .sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)
  : [];

function count(items, keyOf) {
  const result = {};
  for (const item of items) {
    const key = keyOf(item);
    result[key] = (result[key] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(result).sort((a, b) => b[1] - a[1]));
}

const converted = sites.filter((site) => site.status === "converted");
const skipped = sites.filter((site) => site.status === "skipped");
const byFile = new Map();
for (const site of sites) {
  const entry = byFile.get(site.file) || {
    file: site.file,
    converted: 0,
    skipped: 0,
    reasons: {},
  };
  if (site.status === "converted") entry.converted += 1;
  else {
    entry.skipped += 1;
    entry.reasons[site.reason] = (entry.reasons[site.reason] || 0) + 1;
  }
  byFile.set(site.file, entry);
}
const files = [...byFile.values()].sort(
  (a, b) => b.converted + b.skipped - (a.converted + a.skipped),
);

const summary = {
  generatedAt: new Date().toISOString(),
  command: command.join(" "),
  totals: {
    sites: sites.length,
    converted: converted.length,
    skipped: skipped.length,
    filesWithSites: files.length,
    filesThatChange: files.filter((file) => file.converted > 0).length,
    filesWithAllSitesConverted: files.filter((file) => file.skipped === 0)
      .length,
  },
  byKind: {
    link: {
      converted: converted.filter((site) => site.kind === "link").length,
      skipped: skipped.filter((site) => site.kind === "link").length,
    },
    navigate: {
      converted: converted.filter((site) => site.kind === "navigate").length,
      skipped: skipped.filter((site) => site.kind === "navigate").length,
    },
  },
  skippedByReason: count(skipped, (site) => site.reason),
  skippedByReasonAndKind: count(
    skipped,
    (site) => `${site.kind}: ${site.reason}`,
  ),
  noMatchingRouteBy: count(
    skipped.filter((site) => site.reason === "no-matching-route"),
    (site) => site.detail,
  ),
  unmatchedUrls: count(
    skipped.filter((site) => site.reason === "no-matching-route"),
    (site) => site.url,
  ),
  convertedWithLiteralParams: converted.filter((site) => site.literalParams)
    .length,
  convertedByRoute: count(converted, (site) => site.to),
  files,
  sites,
};

fs.writeFileSync(out, JSON.stringify(summary, null, 2) + "\n");
console.log(`Wrote ${out}`);
console.log(JSON.stringify({ totals: summary.totals, byKind: summary.byKind }));
console.log("Skipped by reason:", summary.skippedByReason);
