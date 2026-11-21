#!/usr/bin/env node
/**
 * Detects unused translation keys in public/locale/en.json.
 *
 * A key counts as used when ANY of these holds:
 *   1. its exact text appears as a string literal anywhere under src/
 *      (t("key"), i18nKey="key", or a literal inside a config/lookup object
 *      that is later passed to t()). Plural keys (`x_one`, `x_other`, ...)
 *      are covered by a literal `x`.
 *   2. it matches a key pattern built by a legacy dynamic call such as
 *      t(`prefix_${x}`) or t("prefix_" + x). These patterns are derived from
 *      the source automatically (no hand-maintained allowlist), and the
 *      `static-translation-keys` ESLint rule stops new ones from being added.
 *      As soon as a dynamic call is rewritten into literal keys its pattern
 *      disappears from the source and stops protecting anything.
 *
 * Usage:
 *   node scripts/check-locale.mjs            # report, exit 1 when keys are unused
 *   node scripts/check-locale.mjs --fix      # remove unused keys from en.json
 *   node scripts/check-locale.mjs --verbose  # also list keys kept alive only by dynamic patterns
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LOCALE_FILE = path.join(root, "public/locale/en.json");
const SRC_DIR = path.join(root, "src");
const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/;
const MIN_LITERAL_LENGTH = 3; // ignore patterns like `${a}` that would match every key
const KEY_SHAPED = /^[A-Za-z0-9_.]*$/; // literal chunks of a plausible translation key

const args = new Set(process.argv.slice(2));
const FIX = args.has("--fix");
const VERBOSE = args.has("--verbose");

function listSourceFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules") continue;
      out.push(...listSourceFiles(full));
    } else if (
      /\.(tsx?|jsx?)$/.test(entry.name) &&
      !/\.d\.ts$/.test(entry.name)
    ) {
      out.push(full);
    }
  }
  return out;
}

function flatten(obj, prefix = "") {
  const keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object") keys.push(...flatten(v, full));
    else keys.push(full);
  }
  return keys;
}

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Parts of a runtime-built key: literal chunks separated by unknown values. */
function patternFromKeyExpression(node) {
  if (
    ts.isParenthesizedExpression(node) ||
    ts.isAsExpression(node) ||
    ts.isNonNullExpression(node) ||
    ts.isSatisfiesExpression?.(node)
  ) {
    return patternFromKeyExpression(node.expression);
  }
  if (ts.isConditionalExpression(node)) {
    return [
      ...patternFromKeyExpression(node.whenTrue),
      ...patternFromKeyExpression(node.whenFalse),
    ];
  }
  if (ts.isTemplateExpression(node)) {
    const parts = [
      node.head.text,
      ...node.templateSpans.map((s) => s.literal.text),
    ];
    return [parts];
  }
  if (
    ts.isBinaryExpression(node) &&
    node.operatorToken.kind === ts.SyntaxKind.PlusToken
  ) {
    const parts = [];
    const walk = (n) => {
      if (
        ts.isBinaryExpression(n) &&
        n.operatorToken.kind === ts.SyntaxKind.PlusToken
      ) {
        walk(n.left);
        walk(n.right);
      } else if (ts.isStringLiteralLike(n)) {
        parts.push(n.text);
      } else {
        parts.push(null); // unknown value
      }
    };
    walk(node);
    // collapse to [literal, ..., literal] with unknowns as boundaries
    const chunks = [""];
    for (const p of parts) {
      if (p === null) chunks.push("");
      else chunks[chunks.length - 1] += p;
    }
    return chunks.length > 1 ? [chunks] : [];
  }
  return [];
}

function isTranslationCall(expr) {
  if (ts.isIdentifier(expr)) return expr.text === "t";
  return (
    ts.isPropertyAccessExpression(expr) &&
    expr.name.text === "t" &&
    ts.isIdentifier(expr.expression) &&
    (expr.expression.text === "i18n" || expr.expression.text === "i18next")
  );
}

const literals = new Set();
const dynamicSites = []; // { file, line, text, chunks }
const unresolvable = []; // dynamic keys with no usable literal part

for (const file of listSourceFiles(SRC_DIR)) {
  const text = fs.readFileSync(file, "utf8");
  const kind = file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    kind,
  );
  const rel = path.relative(root, file);

  const registerDynamic = (keyNode, { fromTranslationCall }) => {
    const line =
      sf.getLineAndCharacterOfPosition(keyNode.getStart(sf)).line + 1;
    for (const chunks of patternFromKeyExpression(keyNode)) {
      const literal = chunks.join("");
      const site = {
        file: rel,
        line,
        source: keyNode.getText(sf).slice(0, 80),
        chunks,
      };
      if (literal.length < MIN_LITERAL_LENGTH) {
        if (fromTranslationCall) unresolvable.push(site);
        continue;
      }
      // Outside t() calls (e.g. a helper that returns `role_context__${x}`),
      // only accept key-shaped patterns so prose, URLs and class names do not
      // accidentally protect unrelated keys.
      if (
        !fromTranslationCall &&
        !(KEY_SHAPED.test(literal) && /[_.]/.test(literal))
      )
        continue;
      if (chunks.some((c) => !KEY_SHAPED.test(c))) continue;
      dynamicSites.push(site);
    }
  };

  const isPlus = (n) =>
    ts.isBinaryExpression(n) &&
    n.operatorToken.kind === ts.SyntaxKind.PlusToken;

  const visit = (node) => {
    if (ts.isStringLiteralLike(node)) literals.add(node.text);
    const isKeyArg =
      (ts.isCallExpression(node.parent ?? node) &&
        node.parent &&
        isTranslationCall(node.parent.expression) &&
        node.parent.arguments[0] === node) ||
      (node.parent &&
        ts.isJsxExpression(node.parent) &&
        node.parent.parent &&
        ts.isJsxAttribute(node.parent.parent) &&
        node.parent.parent.name.getText(sf) === "i18nKey");
    if (
      ts.isTemplateExpression(node) ||
      (isPlus(node) && !(node.parent && isPlus(node.parent)))
    ) {
      registerDynamic(node, { fromTranslationCall: Boolean(isKeyArg) });
    } else if (isKeyArg && !ts.isStringLiteralLike(node)) {
      // t(`${x}`), t(cond ? `a_${x}` : "b"): handle conditionals and parens
      registerDynamic(node, { fromTranslationCall: true });
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
}

const dynamicRegexes = dynamicSites.map((site) => ({
  site,
  regex: new RegExp("^" + site.chunks.map(escapeRegex).join("[^\\s]+?") + "$"),
}));

const raw = fs.readFileSync(LOCALE_FILE, "utf8");
const locale = JSON.parse(raw);
const keys = flatten(locale);

const unused = [];
const dynamicOnly = new Map(); // pattern source -> keys

for (const key of keys) {
  const base = key.replace(PLURAL_SUFFIX, "");
  if (literals.has(key) || literals.has(base)) continue;
  const match = dynamicRegexes.find(
    ({ regex }) => regex.test(key) || regex.test(base),
  );
  if (match) {
    const label = `${match.site.file}:${match.site.line}  ${match.site.source}`;
    if (!dynamicOnly.has(label)) dynamicOnly.set(label, []);
    dynamicOnly.get(label).push(key);
    continue;
  }
  unused.push(key);
}

const kept = [...dynamicOnly.values()].reduce((n, ks) => n + ks.length, 0);
console.log(
  `Locale check: ${keys.length} keys | ${keys.length - unused.length - kept} used literally | ${kept} used via dynamic key patterns | ${unused.length} unused`,
);

if (VERBOSE && dynamicOnly.size) {
  console.log(
    "\nKept alive only by dynamic key construction (rewrite these call sites to literal keys):",
  );
  for (const [label, ks] of dynamicOnly) {
    console.log(`  ${label}  -> ${ks.length} keys`);
  }
}
if (VERBOSE && unresolvable.length) {
  console.log(
    "\nDynamic calls with no literal part (keys they produce cannot be detected):",
  );
  for (const s of unresolvable)
    console.log(`  ${s.file}:${s.line}  ${s.source}`);
}

if (unused.length === 0) process.exit(0);

if (FIX) {
  const drop = new Set(unused);
  const prune = (obj, prefix = "") => {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      const full = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === "object") {
        const child = prune(v, full);
        if (Object.keys(child).length) out[k] = child;
      } else if (!drop.has(full)) {
        out[k] = v;
      }
    }
    return out;
  };
  fs.writeFileSync(LOCALE_FILE, JSON.stringify(prune(locale), null, 2) + "\n");
  console.log(
    `\nRemoved ${unused.length} unused keys from public/locale/en.json`,
  );
  process.exit(0);
}

console.error(
  `\nUnused translation keys in public/locale/en.json (no usage found in src/):\n${unused
    .map((k) => `  - ${k}`)
    .join("\n")}\n\nRemove them, or run: npm run lint:locale -- --fix\n` +
    `If a key is really used, make sure it appears as a string literal in src/ ` +
    `(e.g. in a lookup object) rather than being built at runtime.`,
);
process.exit(1);
