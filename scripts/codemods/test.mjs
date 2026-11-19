#!/usr/bin/env node
/**
 * Test runner for the raviger codemod.
 *
 * It runs the transform on each `__testfixtures__/<name>.input.txt` file and
 * compares the result with `<name>.output.txt`. It also compares the site
 * report with `<name>.report.txt`. An optional `<name>.options.json` adds
 * transform options.
 *
 * The runner loads jscodeshift from the npx cache. It does not need a
 * dependency in package.json.
 *
 * Usage:
 *   node scripts/codemods/test.mjs            # run all fixtures
 *   node scripts/codemods/test.mjs --update   # write the expected files
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.join(here, "__testfixtures__");
const transformPath = path.join(here, "raviger-to-tanstack.js");
const reportPath = path.join(here, ".test-report.jsonl");
const update = process.argv.includes("--update");

/** Finds the jscodeshift package that `npx jscodeshift@17` installs. */
function loadTestUtils() {
  const bin = execFileSync(
    "npx",
    ["--yes", "-p", "jscodeshift@17", "-c", "command -v jscodeshift"],
    { encoding: "utf8" },
  ).trim();
  const packageDir = path.dirname(path.dirname(fs.realpathSync(bin)));
  return createRequire(path.join(packageDir, "package.json"))(
    "./dist/testUtils",
  );
}

function formatReport(file) {
  if (!fs.existsSync(file)) return "";
  return fs
    .readFileSync(file, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line))
    .map((entry) => {
      const what = entry.status === "converted" ? entry.to : entry.reason;
      const where = entry.url ? ` ${entry.url}` : "";
      const detail = entry.detail
        ? ` (${entry.detail})${where}`
        : entry.literalParams
          ? ` [literal params: ${entry.literalParams.join(", ")}]`
          : "";
      return `${entry.line ?? "-"} ${entry.kind} ${entry.status} ${what}${detail}`;
    })
    .join("\n");
}

function firstDifference(expected, actual) {
  const left = expected.split("\n");
  const right = actual.split("\n");
  for (let line = 0; line < Math.max(left.length, right.length); line += 1) {
    if (left[line] !== right[line]) {
      return `line ${line + 1}\n  expected: ${left[line]}\n  actual:   ${right[line]}`;
    }
  }
  return "no difference";
}

const { applyTransform } = loadTestUtils();
const localRequire = createRequire(import.meta.url);
const transform = localRequire(transformPath);
const typeCheck = localRequire("./type-check.js");
const ts = localRequire("typescript");

/** A type checker for one in-memory file. It needs no tsconfig. */
function virtualChecker(filePath, source) {
  const compilerOptions = {
    jsx: ts.JsxEmit.Preserve,
    strict: true,
    noLib: true,
    noResolve: true,
    types: [],
  };
  const host = ts.createCompilerHost(compilerOptions);
  const readSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (name, ...rest) =>
    name === filePath
      ? ts.createSourceFile(name, source, rest[0], true, ts.ScriptKind.TSX)
      : readSourceFile(name, ...rest);
  const program = ts.createProgram({
    rootNames: [filePath],
    options: compilerOptions,
    host,
  });
  return typeCheck.wrap(ts, program);
}
process.chdir(path.resolve(here, "../.."));

const names = fs
  .readdirSync(fixtures)
  .filter((file) => file.endsWith(".input.txt"))
  .map((file) => file.replace(/\.input\.txt$/, ""))
  .sort();

let failures = 0;
for (const name of names) {
  const input = fs.readFileSync(
    path.join(fixtures, `${name}.input.txt`),
    "utf8",
  );
  const optionsFile = path.join(fixtures, `${name}.options.json`);
  const extra = fs.existsSync(optionsFile)
    ? JSON.parse(fs.readFileSync(optionsFile, "utf8"))
    : {};
  fs.rmSync(reportPath, { force: true });
  const inputPath = path.join(fixtures, `${name}.input.tsx`);
  // Only the fixtures that set `"typecheck": "true"` run the type check.
  typeCheck.useCheckerFactory(
    extra.typecheck === "true" ? () => virtualChecker(inputPath, input) : null,
  );
  const actual = applyTransform(
    transform,
    {
      routeTree: path.relative(
        process.cwd(),
        path.join(fixtures, "route-tree.fixture.txt"),
      ),
      report: reportPath,
      typecheck: "false",
      ...extra,
    },
    { path: inputPath, source: input },
    { parser: "tsx" },
  );
  const report = formatReport(reportPath);
  fs.rmSync(reportPath, { force: true });

  const outputFile = path.join(fixtures, `${name}.output.txt`);
  const reportFile = path.join(fixtures, `${name}.report.txt`);
  if (update) {
    fs.writeFileSync(outputFile, actual + "\n");
    fs.writeFileSync(reportFile, report + "\n");
    console.log(`updated  ${name}`);
    continue;
  }
  const expected = fs.readFileSync(outputFile, "utf8").trim();
  const expectedReport = fs.readFileSync(reportFile, "utf8").trim();
  const problems = [];
  if (expected !== actual) {
    problems.push(`output differs at ${firstDifference(expected, actual)}`);
  }
  if (expectedReport !== report) {
    problems.push(
      `report differs at ${firstDifference(expectedReport, report)}`,
    );
  }
  if (problems.length > 0) {
    failures += 1;
    console.log(`FAIL  ${name}\n  ${problems.join("\n  ")}`);
  } else {
    console.log(`ok    ${name}`);
  }
}

if (!update) {
  console.log(`\n${names.length - failures}/${names.length} fixtures pass.`);
  process.exitCode = failures > 0 ? 1 : 0;
}
