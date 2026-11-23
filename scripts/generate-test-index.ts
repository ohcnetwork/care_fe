/**
 * Builds tests/ATOMIC_TEST_INDEX.md from the tags on every Playwright test and
 * the capability registry in tests/capabilities.ts, and validates both.
 *
 *   npm run playwright:index          regenerate the index
 *   npm run playwright:index:check    fail if a tag is missing or invalid, or the index is stale
 *
 * Tags are read statically from the source (no browser, backend or
 * `playwright test --list` needed), so they must be string literals.
 * See "Tags, capabilities and step functions" in tests/PLAYWRIGHT_GUIDE.md.
 */
import fs from "node:fs";
import path from "node:path";
import prettier from "prettier";
import ts from "typescript";

import { type Capability, capabilities } from "../tests/capabilities";

const ROOT = path.resolve(__dirname, "..");
const TESTS_DIR = path.join(ROOT, "tests");
const INDEX_PATH = path.join(TESTS_DIR, "ATOMIC_TEST_INDEX.md");
const CHECK = process.argv.includes("--check");

const CLASS_TAGS = ["@atomic", "@coupled", "@journey", "@workflow"] as const;
type TestClass = (typeof CLASS_TAGS)[number];
const BACKEND_TAGS = ["@mocked", "@unit"] as const;
const ANNOTATED: Partial<Record<TestClass, string>> = {
  "@coupled": "coupled",
  "@journey": "journey",
};

const DOMAINS: [string, string][] = [
  ["workflow", "Workflows"],
  ["auth", "Auth"],
  ["nav", "Navigation"],
  ["profile", "Profile"],
  ["user", "Users"],
  ["org", "Organization"],
  ["facility", "Facility"],
  ["patient", "Patient"],
  ["encounter", "Encounter"],
  ["questionnaire", "Questionnaire"],
  ["valueset", "Value sets"],
  ["billing", "Billing"],
  ["service", "Healthcare services"],
  ["location", "Locations"],
  ["inventory", "Inventory"],
  ["referral", "Referrals"],
  ["queue", "Queues and tokens"],
  ["appointment", "Appointments"],
  ["department", "Departments"],
  ["device", "Devices"],
  ["definition", "Clinical definitions"],
  ["product", "Products"],
  ["admin", "Instance admin"],
  ["misc", "Miscellaneous"],
];
const OTHER_DOMAIN: [string, string] = ["other", "Other"];

interface Annotation {
  type: string;
  description?: string;
}

interface TestEntry {
  file: string; // relative to tests/
  title: string;
  tags: string[];
  annotations: Annotation[];
}

interface Scope {
  tags: string[];
  annotations: Annotation[];
}

const errors: string[] = [];

function listSpecFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
    if (entry.name === "fixtures" && dir === TESTS_DIR) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) listSpecFiles(full, acc);
    else if (entry.name.endsWith(".spec.ts")) acc.push(full);
  }
  return acc.sort();
}

/** "test", "test.describe", "test.describe.serial", … for a call's callee. */
function calleeName(expr: ts.Expression): string {
  if (ts.isIdentifier(expr)) return expr.text;
  if (ts.isPropertyAccessExpression(expr))
    return `${calleeName(expr.expression)}.${expr.name.text}`;
  return "";
}

function textOf(node: ts.Node | undefined, sf: ts.SourceFile): string {
  if (!node) return "";
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
    return node.text;
  if (ts.isTemplateExpression(node)) return node.getText(sf).slice(1, -1);
  return node.getText(sf);
}

function where(sf: ts.SourceFile, node: ts.Node): string {
  const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
  return `${path.relative(ROOT, sf.fileName)}:${line + 1}`;
}

function literalStrings(
  node: ts.Expression,
  sf: ts.SourceFile,
  what: string,
): string[] {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
    return [node.text];
  if (ts.isArrayLiteralExpression(node))
    return node.elements.flatMap((e) => literalStrings(e, sf, what));
  errors.push(`${where(sf, node)}: ${what} must be string literals`);
  return [];
}

function readAnnotations(node: ts.Expression, sf: ts.SourceFile): Annotation[] {
  const items = ts.isArrayLiteralExpression(node) ? node.elements : [node];
  const out: Annotation[] = [];
  for (const item of items) {
    if (!ts.isObjectLiteralExpression(item)) continue;
    const ann: Annotation = { type: "" };
    for (const prop of item.properties) {
      if (!ts.isPropertyAssignment(prop) || !ts.isIdentifier(prop.name))
        continue;
      if (prop.name.text === "type") ann.type = textOf(prop.initializer, sf);
      if (prop.name.text === "description")
        ann.description = textOf(prop.initializer, sf);
    }
    out.push(ann);
  }
  return out;
}

/** Tags and annotations from a `{ tag, annotation }` details argument. */
function readDetails(args: ts.NodeArray<ts.Expression>, sf: ts.SourceFile) {
  const scope: Scope = { tags: [], annotations: [] };
  const details = args.find(ts.isObjectLiteralExpression);
  if (!details) return scope;
  for (const prop of details.properties) {
    if (!ts.isPropertyAssignment(prop) || !ts.isIdentifier(prop.name)) continue;
    if (prop.name.text === "tag")
      scope.tags.push(...literalStrings(prop.initializer, sf, "tags"));
    if (prop.name.text === "annotation")
      scope.annotations.push(...readAnnotations(prop.initializer, sf));
  }
  return scope;
}

const TEST_MODIFIERS = new Set(["", ".only", ".skip", ".fixme", ".fail"]);
const DESCRIBE = /^test\.describe(\.(serial|parallel|only|skip|fixme))*$/;

function collectTests(file: string): TestEntry[] {
  const source = fs.readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const rel = path.relative(TESTS_DIR, file);
  const found: TestEntry[] = [];

  const visit = (node: ts.Node, stack: Scope[]): void => {
    if (ts.isCallExpression(node)) {
      const name = calleeName(node.expression);
      const fn = node.arguments.find(
        (a) => ts.isArrowFunction(a) || ts.isFunctionExpression(a),
      );
      if (DESCRIBE.test(name) && fn) {
        const scope = readDetails(node.arguments, sf);
        ts.forEachChild(fn, (child) => visit(child, [...stack, scope]));
        return;
      }
      if (
        name.startsWith("test") &&
        TEST_MODIFIERS.has(name.slice(4)) &&
        fn &&
        node.arguments.length >= 2
      ) {
        const own = readDetails(node.arguments, sf);
        const tags = [...stack.flatMap((s) => s.tags), ...own.tags];
        found.push({
          file: rel,
          title: textOf(node.arguments[0], sf).replace(/\s+/g, " "),
          tags: [...new Set(tags)],
          annotations: [
            ...stack.flatMap((s) => s.annotations),
            ...own.annotations,
          ],
        });
        validate(found[found.length - 1], where(sf, node));
        return;
      }
    }
    ts.forEachChild(node, (child) => visit(child, stack));
  };
  visit(sf, []);
  return found;
}

function capabilityOf(t: TestEntry): string {
  return t.tags.find((tag) => tag.startsWith("@cap:"))?.slice(5) ?? "";
}
function classOf(t: TestEntry): TestClass {
  return t.tags.find((tag) =>
    (CLASS_TAGS as readonly string[]).includes(tag),
  ) as TestClass;
}

function validate(t: TestEntry, at: string): void {
  const caps = t.tags.filter((tag) => tag.startsWith("@cap:"));
  const classes = t.tags.filter((tag) =>
    (CLASS_TAGS as readonly string[]).includes(tag),
  );
  if (caps.length !== 1)
    errors.push(
      `${at}: needs exactly one @cap:<capability> tag (has ${caps.length})`,
    );
  if (classes.length !== 1)
    errors.push(
      `${at}: needs exactly one of ${CLASS_TAGS.join(" ")} (has ${classes.length})`,
    );
  const cap = caps[0]?.slice(5);
  if (cap && !(cap in capabilities))
    errors.push(
      `${at}: @cap:${cap} is not registered in tests/capabilities.ts`,
    );
  const annotationType = ANNOTATED[classes[0] as TestClass];
  if (
    annotationType &&
    !t.annotations.some((a) => a.type === annotationType && a.description)
  )
    errors.push(
      `${at}: ${classes[0]} tests need annotation { type: "${annotationType}", description: "…" }`,
    );
}

// ---------------------------------------------------------------- rendering

const ICON: Record<TestClass, string> = {
  "@atomic": "✅",
  "@coupled": "◐",
  "@journey": "⛓",
  "@workflow": "🔗",
};
/** Escapes text for a Markdown table cell: backslashes first, then `<` and `|`. */
const esc = (s: string) =>
  s
    .replace(/\\/g, "\\\\")
    .replace(/</g, "&lt;")
    .replace(/\|/g, "\\|")
    .replace(/\n/g, " ");
const short = (s: string, n: number) =>
  s.length > n ? `${s.slice(0, n - 1)}…` : s;
const fileLink = (t: TestEntry, text: string) => `[${esc(text)}](${t.file})`;
const code = (s?: string) => (s ? `\`${s.replace(/^tests\//, "")}\`` : "—");
const list = (items?: string[]) =>
  items?.length ? esc(items.slice(0, 3).join(", ")) : "—";
const domainOf = (cap: string): [string, string] =>
  DOMAINS.find(([key]) => key === cap.split(".")[0]) ?? OTHER_DOMAIN;
const anchor = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/ /g, "-");
const backendMark = (t: TestEntry) =>
  t.tags.includes("@mocked")
    ? " 🎭"
    : t.tags.includes("@unit")
      ? " (unit)"
      : "";
const realBackend = (t: TestEntry) =>
  !BACKEND_TAGS.some((tag) => t.tags.includes(tag));

function primaryOf(tests: TestEntry[]): TestEntry {
  return (
    tests.find((t) => classOf(t) === "@atomic" && realBackend(t)) ??
    tests.find((t) => classOf(t) === "@atomic") ??
    tests.find((t) => classOf(t) === "@workflow") ??
    tests[0]
  );
}

function count(tests: TestEntry[], cls: TestClass) {
  return tests.filter((t) => classOf(t) === cls).length;
}

function render(tests: TestEntry[], specCount: number): string {
  const byCap = new Map<string, TestEntry[]>();
  for (const t of tests) {
    const cap = capabilityOf(t);
    if (!byCap.has(cap)) byCap.set(cap, []);
    byCap.get(cap)!.push(t);
  }
  const domains = [...DOMAINS, OTHER_DOMAIN].filter(([key]) =>
    [...byCap.keys()].some((cap) => domainOf(cap)[0] === key),
  );
  const capsIn = (key: string) =>
    [...byCap.entries()]
      .filter(([cap]) => domainOf(cap)[0] === key)
      .sort(([a], [b]) => a.localeCompare(b));
  const reg = (cap: string): Capability => capabilities[cap] ?? { label: "" };

  const L: string[] = [];
  L.push(
    "# Atomic Test Index",
    "",
    "<!-- Generated by `npm run playwright:index` from test tags and tests/capabilities.ts. Do not edit by hand. -->",
    "",
    "Every Playwright test, grouped by the **capability** it verifies: one user intent such as `patient.register` or `encounter.create`. For each capability: the atomic test that proves it works on its own, the **step** function that performs it (reuse it in workflow tests), the **seed** that creates the same thing through the API, and what it requires and produces.",
    "",
    "Conventions for tags, capabilities and step functions: [PLAYWRIGHT_GUIDE.md](PLAYWRIGHT_GUIDE.md#tags-capabilities-and-step-functions). Run a slice of the suite by tag, e.g. `npx playwright test --grep @workflow` or `--grep @cap:billing`.",
    "",
  );
  L.push(
    "**Legend:** ✅ `@atomic` one capability, runs alone · ◐ `@coupled` one capability but depends on order or shared state (reason listed) · ⛓ `@journey` spans several capabilities · 🔗 `@workflow` composed from step functions · 🎭 `@mocked` runs on stubbed API responses, nothing persists · (unit) `@unit` no browser.",
    "",
  );

  // Summary
  L.push("## Summary", "");
  L.push(
    `${tests.length} tests in ${specCount} spec files across ${byCap.size} capabilities: ` +
      `${count(tests, "@atomic")} atomic, ${count(tests, "@coupled")} coupled, ${count(tests, "@journey")} journeys, ${count(tests, "@workflow")} workflows. ` +
      `${tests.filter((t) => t.tags.includes("@mocked")).length} run on mocked APIs and ${tests.filter((t) => t.tags.includes("@unit")).length} are unit tests.`,
    "",
  );
  L.push(
    "| Domain | Capabilities | Tests | ✅ | ◐ | ⛓ | 🔗 | With a step |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
  );
  for (const [key, title] of domains) {
    const caps = capsIn(key);
    const all = caps.flatMap(([, ts]) => ts);
    const withStep = caps.filter(([cap]) => reg(cap).step).length;
    L.push(
      `| [${title}](#${anchor(title)}) | ${caps.length} | ${all.length} | ${count(all, "@atomic")} | ${count(all, "@coupled")} | ${count(all, "@journey")} | ${count(all, "@workflow")} | ${withStep} |`,
    );
  }
  L.push("");

  // Domains
  for (const [key, title] of domains) {
    const caps = capsIn(key);
    L.push(`## ${title}`, "");
    L.push(
      "| Capability | What it covers | Primary test | ✅/◐/⛓ | Step | Seed | Requires | Produces |",
      "| --- | --- | --- | :---: | --- | --- | --- | --- |",
    );
    for (const [cap, capTests] of caps) {
      const p = primaryOf(capTests);
      const r = reg(cap);
      L.push(
        `| \`${cap}\` | ${esc(short(r.label, 80))} | ${ICON[classOf(p)]} ${fileLink(p, short(p.title, 60))}${backendMark(p)} | ` +
          `${count(capTests, "@atomic")}/${count(capTests, "@coupled")}/${count(capTests, "@journey")} | ${code(r.step)} | ${code(r.seed)} | ${list(r.requires)} | ${list(r.produces)} |`,
      );
    }
    L.push("");
    const n = caps.reduce((sum, [, ts]) => sum + ts.length, 0);
    L.push(`<details><summary>All ${n} tests</summary>`, "");
    for (const [cap, capTests] of caps) {
      L.push(`- \`${cap}\``);
      for (const t of capTests)
        L.push(
          `  - ${ICON[classOf(t)]}${backendMark(t)} ${esc(short(t.title, 110))} · [${path.basename(t.file)}](${t.file})`,
        );
    }
    L.push("", "</details>", "");
  }

  // Journeys and coupled tests
  const annotated = (cls: TestClass, heading: string, intro: string) => {
    const rows = tests.filter((t) => classOf(t) === cls);
    if (!rows.length) return;
    L.push(`## ${heading}`, "", intro, "");
    L.push("| Test | Capability | Why |", "| --- | --- | --- |");
    for (const t of rows) {
      const why =
        t.annotations.find((a) => a.type === ANNOTATED[cls])?.description ?? "";
      L.push(
        `| ${fileLink(t, short(t.title, 70))} | \`${capabilityOf(t)}\` | ${esc(short(why, 200))} |`,
      );
    }
    L.push("");
  };
  annotated(
    "@journey",
    "Journeys",
    "Tests that already chain several capabilities. Check them before writing a new workflow.",
  );
  annotated(
    "@coupled",
    "Coupled tests",
    "One capability each, but they depend on order, shared state or the environment. Don't reuse them as building blocks until they are isolated.",
  );

  // Capabilities with no step
  const noStep = [...byCap.keys()]
    .filter((cap) => !reg(cap).step && domainOf(cap)[0] !== "workflow")
    .sort();
  if (noStep.length) {
    L.push("## Capabilities without a step function", "");
    L.push(
      `${noStep.length} capabilities have no exported step yet; their actions live inside spec files. Extract one into \`tests/helper/<domain>.ts\` before a workflow needs it.`,
      "",
    );
    for (const [key, title] of domains) {
      const caps = noStep.filter((cap) => domainOf(cap)[0] === key);
      if (caps.length)
        L.push(`- **${title}:** ${caps.map((cap) => `\`${cap}\``).join(", ")}`);
    }
    L.push("");
  }
  return L.join("\n");
}

async function main() {
  const files = listSpecFiles(TESTS_DIR);
  const tests = files.flatMap(collectTests);

  const used = new Set(tests.map(capabilityOf));
  for (const cap of Object.keys(capabilities))
    if (!used.has(cap))
      errors.push(
        `tests/capabilities.ts: "${cap}" has no tests; remove it or tag a test with @cap:${cap}`,
      );
  for (const [cap, entry] of Object.entries(capabilities)) {
    for (const ref of [entry.step, entry.seed]) {
      if (!ref) continue;
      const [file, fn] = ref.split(":");
      const full = path.join(ROOT, file);
      if (
        !fs.existsSync(full) ||
        !new RegExp(`export (async )?(function|const) ${fn}\\b`).test(
          fs.readFileSync(full, "utf8"),
        )
      )
        errors.push(
          `tests/capabilities.ts: "${cap}" points at ${ref}, which is not an exported function`,
        );
    }
  }

  if (errors.length) {
    console.error(
      `✖ ${errors.length} problem(s) with test tags or the capability registry:\n`,
    );
    for (const e of errors) console.error(`  ${e}`);
    process.exit(1);
  }

  const options = (await prettier.resolveConfig(INDEX_PATH)) ?? {};
  const markdown = await prettier.format(render(tests, files.length), {
    ...options,
    plugins: [],
    parser: "markdown",
  });

  if (CHECK) {
    const current = fs.existsSync(INDEX_PATH)
      ? fs.readFileSync(INDEX_PATH, "utf8")
      : "";
    if (current !== markdown) {
      console.error(
        "✖ tests/ATOMIC_TEST_INDEX.md is out of date. Run `npm run playwright:index` and commit the result.",
      );
      process.exit(1);
    }
    console.log(`✔ ${tests.length} tests tagged; index is up to date.`);
    return;
  }
  fs.writeFileSync(INDEX_PATH, markdown);
  console.log(
    `✔ Wrote ${path.relative(ROOT, INDEX_PATH)} (${tests.length} tests, ${used.size} capabilities).`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
