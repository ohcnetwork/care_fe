#!/usr/bin/env tsx
/**
 * clone-component
 *
 * Recursively clone a React component (and every local file it imports) from
 * the main `src/` tree into one of the plugin apps under `apps/<plugin>/src/`.
 *
 * Resolves and rewrites the path aliases used by the main app:
 *   - `@/...`         -> kept as `@/...` (target tsconfig uses the same alias)
 *   - `@core/...`     -> rewritten to `@/...`
 *   - `@careConfig`   -> rewritten to `@/care.config` (file is copied in)
 *
 * External packages (anything that does not resolve to a file inside the
 * workspace) are left untouched and reported at the end so you can add them to
 * the plugin's `package.json`.
 *
 * Usage:
 *   tsx scripts/clone-component.ts <source> <target-app> [--force] [--dry-run]
 *
 * Examples:
 *   tsx scripts/clone-component.ts src/components/Common/Loading.tsx care_voice_fe
 *   tsx scripts/clone-component.ts @/components/ui/button care_ask_fe --force
 */
import fs from "node:fs";
import { builtinModules } from "node:module";
import path from "node:path";
import process from "node:process";

const ROOT = path.resolve(__dirname, "..");
const SRC_ROOT = path.join(ROOT, "src");
const APPS_ROOT = path.join(ROOT, "apps");
const CARE_CONFIG = path.join(ROOT, "care.config.ts");
const ROOT_PACKAGE_JSON = path.join(ROOT, "package.json");

const CODE_EXTS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];
const RESOLVE_EXTS = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".css",
  ".scss",
  ".svg",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".lottie",
];

const DEPENDENCY_FIELDS = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
] as const;

type DependencyField = (typeof DEPENDENCY_FIELDS)[number];

const BUILTIN_PACKAGES = new Set(
  builtinModules.flatMap((name) => [name, `node:${name}`]),
);

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  [key: string]: unknown;
}

interface Args {
  source: string;
  app: string;
  force: boolean;
  dryRun: boolean;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const positional: string[] = [];
  let force = false;
  let dryRun = false;
  for (const a of argv) {
    if (a === "--force" || a === "-f") force = true;
    else if (a === "--dry-run" || a === "-n") dryRun = true;
    else if (a === "--help" || a === "-h") {
      printHelp();
      process.exit(0);
    } else positional.push(a);
  }
  if (positional.length < 2) {
    printHelp();
    process.exit(1);
  }
  return { source: positional[0], app: positional[1], force, dryRun };
}

function printHelp() {
  console.log(
    `\nclone-component\n\n` +
      `Usage:\n` +
      `  tsx scripts/clone-component.ts <source> <target-app> [--force] [--dry-run]\n\n` +
      `Arguments:\n` +
      `  <source>       Path to a component file. Accepts a workspace-relative\n` +
      `                 path (src/components/Foo.tsx), an absolute path, or an\n` +
      `                 alias (@/components/Foo, @core/components/Foo).\n` +
      `  <target-app>   Name of the plugin under apps/ (e.g. care_voice_fe).\n\n` +
      `Options:\n` +
      `  -f, --force    Overwrite files that already exist in the target app.\n` +
      `  -n, --dry-run  Print what would happen without writing any files.\n` +
      `  -h, --help     Show this message.\n`,
  );
}

function resolveAlias(spec: string, fromFile: string): string | null {
  if (spec === "@careConfig") return CARE_CONFIG;
  if (spec.startsWith("@/")) return path.join(SRC_ROOT, spec.slice(2));
  if (spec.startsWith("@core/")) return path.join(SRC_ROOT, spec.slice(6));
  if (spec.startsWith("./") || spec.startsWith("../"))
    return path.resolve(path.dirname(fromFile), spec);
  return null; // external package
}

/**
 * Resolve a module specifier path (without extension) to an actual file on
 * disk. Mirrors Node/TS module resolution for the extensions we care about.
 */
function resolveToFile(target: string): string | null {
  if (fs.existsSync(target) && fs.statSync(target).isFile()) return target;
  for (const ext of RESOLVE_EXTS) {
    const candidate = target + ext;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile())
      return candidate;
  }
  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
    for (const ext of RESOLVE_EXTS) {
      const candidate = path.join(target, "index" + ext);
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile())
        return candidate;
    }
  }
  return null;
}

function resolveSourceArg(source: string): string {
  // Allow alias-style sources directly from CLI.
  if (
    source === "@careConfig" ||
    source.startsWith("@/") ||
    source.startsWith("@core/")
  ) {
    const aliased = resolveAlias(source, path.join(ROOT, "__cli__"));
    if (!aliased) throw new Error(`Cannot resolve alias: ${source}`);
    const resolved = resolveToFile(aliased);
    if (!resolved) throw new Error(`Cannot resolve source file: ${source}`);
    return resolved;
  }
  const abs = path.isAbsolute(source) ? source : path.resolve(ROOT, source);
  const resolved = resolveToFile(abs);
  if (!resolved) throw new Error(`Source file not found: ${source}`);
  return resolved;
}

/**
 * Yields every import/export specifier string in a source file along with the
 * (start, end) range of the specifier inside the matched statement so we can
 * rewrite it later.
 */
interface ImportRef {
  spec: string;
  /** absolute index of the opening quote in the original source */
  quoteStart: number;
  /** absolute index of the closing quote in the original source */
  quoteEnd: number;
}

function stripCommentsPreserveLength(code: string): string {
  const chars = code.split("");
  let index = 0;
  let state:
    | "code"
    | "line-comment"
    | "block-comment"
    | "single-quote"
    | "double-quote"
    | "template"
    | "template-expression" = "code";
  let templateExpressionDepth = 0;

  while (index < chars.length) {
    const current = chars[index];
    const next = chars[index + 1];

    if (state === "line-comment") {
      if (current === "\n") {
        state = "code";
      } else {
        chars[index] = " ";
      }
      index += 1;
      continue;
    }

    if (state === "block-comment") {
      if (current === "*" && next === "/") {
        chars[index] = " ";
        chars[index + 1] = " ";
        state = "code";
        index += 2;
      } else {
        if (current !== "\n") {
          chars[index] = " ";
        }
        index += 1;
      }
      continue;
    }

    if (state === "single-quote") {
      if (current === "\\") {
        index += 2;
        continue;
      }
      if (current === "'") {
        state = "code";
      }
      index += 1;
      continue;
    }

    if (state === "double-quote") {
      if (current === "\\") {
        index += 2;
        continue;
      }
      if (current === '"') {
        state = "code";
      }
      index += 1;
      continue;
    }

    if (state === "template") {
      if (current === "\\") {
        index += 2;
        continue;
      }
      if (current === "`") {
        state = "code";
        index += 1;
        continue;
      }
      if (current === "$" && next === "{") {
        state = "template-expression";
        templateExpressionDepth = 1;
        index += 2;
        continue;
      }
      index += 1;
      continue;
    }

    if (state === "template-expression") {
      if (current === "'" || current === '"' || current === "`") {
        state =
          current === "'"
            ? "single-quote"
            : current === '"'
              ? "double-quote"
              : "template";
        index += 1;
        continue;
      }
      if (current === "/" && next === "/") {
        chars[index] = " ";
        chars[index + 1] = " ";
        state = "line-comment";
        index += 2;
        continue;
      }
      if (current === "/" && next === "*") {
        chars[index] = " ";
        chars[index + 1] = " ";
        state = "block-comment";
        index += 2;
        continue;
      }
      if (current === "{") {
        templateExpressionDepth += 1;
      } else if (current === "}") {
        templateExpressionDepth -= 1;
        if (templateExpressionDepth === 0) {
          state = "template";
        }
      }
      index += 1;
      continue;
    }

    if (current === "/" && next === "/") {
      chars[index] = " ";
      chars[index + 1] = " ";
      state = "line-comment";
      index += 2;
      continue;
    }

    if (current === "/" && next === "*") {
      chars[index] = " ";
      chars[index + 1] = " ";
      state = "block-comment";
      index += 2;
      continue;
    }

    if (current === "'") {
      state = "single-quote";
      index += 1;
      continue;
    }

    if (current === '"') {
      state = "double-quote";
      index += 1;
      continue;
    }

    if (current === "`") {
      state = "template";
      index += 1;
      continue;
    }

    index += 1;
  }

  return chars.join("");
}

function findImports(code: string): ImportRef[] {
  const refs: ImportRef[] = [];
  const searchableCode = stripCommentsPreserveLength(code);
  // Matches: import ... from "x"; import "x"; export ... from "x";
  // dynamic import("x"); require("x").
  const patterns: RegExp[] = [
    /(?:^|[\s;{}()])import\s+(?:[\s\S]*?from\s+)?(["'])([^"']+)\1/g,
    /(?:^|[\s;{}()])export\s+[\s\S]*?\sfrom\s+(["'])([^"']+)\1/g,
    /\bimport\s*\(\s*(["'])([^"']+)\1\s*\)/g,
    /\brequire\s*\(\s*(["'])([^"']+)\1\s*\)/g,
  ];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(searchableCode)) !== null) {
      const quote = m[1];
      const spec = m[2];
      const quoteStart = m.index + m[0].lastIndexOf(quote + spec + quote);
      const quoteEnd = quoteStart + spec.length + 2;
      refs.push({ spec, quoteStart, quoteEnd });
    }
  }
  // De-dupe overlapping matches and sort by position.
  const seen = new Set<string>();
  return refs
    .filter((r) => {
      const key = `${r.quoteStart}:${r.spec}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.quoteStart - b.quoteStart);
}

/**
 * Compute the destination path inside the target app for a given absolute
 * source file. Returns null if the file lives outside paths we can copy.
 */
function destinationFor(absFile: string, targetSrc: string): string | null {
  if (absFile === CARE_CONFIG) return path.join(targetSrc, "care.config.ts");
  if (absFile.startsWith(SRC_ROOT + path.sep)) {
    return path.join(targetSrc, path.relative(SRC_ROOT, absFile));
  }
  return null;
}

/**
 * Rewrite alias specifiers inside a code file before writing it to the target
 * app. We only touch `@core/...` and `@careConfig`; `@/...` is left alone
 * because the target tsconfig defines the same alias.
 */
function rewriteCode(code: string, refs: ImportRef[]): string {
  // Apply replacements right-to-left so indices remain valid.
  const sorted = [...refs].sort((a, b) => b.quoteStart - a.quoteStart);
  let out = code;
  for (const r of sorted) {
    let next = r.spec;
    if (r.spec === "@careConfig") next = "@/care.config";
    else if (r.spec.startsWith("@core/"))
      next = "@/" + r.spec.slice("@core/".length);
    if (next === r.spec) continue;
    const quote = out[r.quoteStart];
    out =
      out.slice(0, r.quoteStart) + quote + next + quote + out.slice(r.quoteEnd);
  }
  return out;
}

interface Report {
  copied: string[];
  skippedExisting: string[];
  unresolved: { from: string; spec: string }[];
  external: Set<string>;
  syncedPackages: string[];
  existingPackages: string[];
  missingPackages: string[];
  skippedBuiltins: string[];
}

function readJsonFile<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function writeJsonFile(filePath: string, data: PackageJson) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
}

function sortDependencyMap(record?: Record<string, string>) {
  if (!record) return record;
  return Object.fromEntries(
    Object.entries(record).sort(([left], [right]) => left.localeCompare(right)),
  );
}

function normalizePackageJson(pkg: PackageJson): PackageJson {
  for (const field of DEPENDENCY_FIELDS) {
    if (pkg[field]) {
      pkg[field] = sortDependencyMap(pkg[field]);
    }
  }
  return pkg;
}

function getPackageName(spec: string): string {
  return spec.startsWith("@")
    ? spec.split("/").slice(0, 2).join("/")
    : spec.split("/")[0];
}

function findDependency(
  pkg: PackageJson,
  dependencyName: string,
): { field: DependencyField; version: string } | null {
  for (const field of DEPENDENCY_FIELDS) {
    const version = pkg[field]?.[dependencyName];
    if (version) {
      return { field, version };
    }
  }
  return null;
}

function syncExternalPackages(
  appDir: string,
  args: Args,
  report: Report,
): void {
  const targetPackageJsonPath = path.join(appDir, "package.json");
  const rootPackageJson = readJsonFile<PackageJson>(ROOT_PACKAGE_JSON);
  const targetPackageJson = readJsonFile<PackageJson>(targetPackageJsonPath);
  let changed = false;

  for (const dependencyName of [...report.external].sort()) {
    if (BUILTIN_PACKAGES.has(dependencyName)) {
      report.skippedBuiltins.push(dependencyName);
      continue;
    }

    const existing = findDependency(targetPackageJson, dependencyName);
    if (existing) {
      report.existingPackages.push(
        `${dependencyName}@${existing.version} (${existing.field})`,
      );
      continue;
    }

    const source = findDependency(rootPackageJson, dependencyName);
    if (!source) {
      report.missingPackages.push(dependencyName);
      continue;
    }

    const section =
      (targetPackageJson[source.field] as Record<string, string> | undefined) ??
      {};
    section[dependencyName] = source.version;
    targetPackageJson[source.field] = section;
    report.syncedPackages.push(
      `${dependencyName}@${source.version} (${source.field})${args.dryRun ? " (dry-run)" : ""}`,
    );
    changed = true;
  }

  if (!changed || args.dryRun) {
    return;
  }

  writeJsonFile(targetPackageJsonPath, normalizePackageJson(targetPackageJson));
}

function isCodeFile(file: string): boolean {
  return CODE_EXTS.includes(path.extname(file));
}

function clone(args: Args): Report {
  const appDir = path.join(APPS_ROOT, args.app);
  if (!fs.existsSync(appDir) || !fs.statSync(appDir).isDirectory()) {
    throw new Error(`Target app not found: apps/${args.app}`);
  }
  const targetSrc = path.join(appDir, "src");
  if (!fs.existsSync(targetSrc)) {
    throw new Error(`Target app has no src/ directory: apps/${args.app}/src`);
  }

  const entry = resolveSourceArg(args.source);
  const queue: string[] = [entry];
  const visited = new Set<string>();
  const report: Report = {
    copied: [],
    skippedExisting: [],
    unresolved: [],
    external: new Set(),
    syncedPackages: [],
    existingPackages: [],
    missingPackages: [],
    skippedBuiltins: [],
  };

  while (queue.length) {
    const abs = queue.shift()!;
    if (visited.has(abs)) continue;
    visited.add(abs);

    const dest = destinationFor(abs, targetSrc);
    if (!dest) {
      report.unresolved.push({
        from: path.relative(ROOT, abs),
        spec: "(source outside src/ and not care.config.ts)",
      });
      continue;
    }

    const code = isCodeFile(abs) ? fs.readFileSync(abs, "utf8") : null;

    if (code !== null) {
      const refs = findImports(code);
      for (const ref of refs) {
        const aliased = resolveAlias(ref.spec, abs);
        if (!aliased) {
          report.external.add(getPackageName(ref.spec));
          continue;
        }
        const resolved = resolveToFile(aliased);
        if (!resolved) {
          report.unresolved.push({
            from: path.relative(ROOT, abs),
            spec: ref.spec,
          });
          continue;
        }
        // Only follow files inside src/ or care.config.ts.
        if (
          resolved !== CARE_CONFIG &&
          !resolved.startsWith(SRC_ROOT + path.sep)
        ) {
          report.unresolved.push({
            from: path.relative(ROOT, abs),
            spec: ref.spec,
          });
          continue;
        }
        if (!visited.has(resolved)) queue.push(resolved);
      }

      writeFile(dest, rewriteCode(code, findImports(code)), args, report);
    } else {
      // Binary asset – copy bytes verbatim.
      writeFile(dest, fs.readFileSync(abs), args, report);
    }
  }

  syncExternalPackages(appDir, args, report);

  return report;
}

function writeFile(
  dest: string,
  content: string | Buffer,
  args: Args,
  report: Report,
) {
  const rel = path.relative(ROOT, dest);
  if (fs.existsSync(dest) && !args.force) {
    report.skippedExisting.push(rel);
    return;
  }
  if (args.dryRun) {
    report.copied.push(rel + " (dry-run)");
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, content);
  report.copied.push(rel);
}

function printReport(report: Report) {
  console.log(`\n✓ Copied ${report.copied.length} file(s):`);
  for (const f of report.copied) console.log(`  + ${f}`);
  if (report.skippedExisting.length) {
    console.log(
      `\n• Skipped ${report.skippedExisting.length} existing file(s) (use --force to overwrite):`,
    );
    for (const f of report.skippedExisting) console.log(`  = ${f}`);
  }
  if (report.external.size) {
    console.log(`\n• External packages referenced:`);
    for (const p of [...report.external].sort()) console.log(`  - ${p}`);
  }
  if (report.syncedPackages.length) {
    console.log(
      `\n✓ Synced ${report.syncedPackages.length} package(s) into the target app's package.json:`,
    );
    for (const p of report.syncedPackages) console.log(`  + ${p}`);
  }
  if (report.existingPackages.length) {
    console.log(
      `\n• Packages already present in the target app's package.json:`,
    );
    for (const p of report.existingPackages) console.log(`  = ${p}`);
  }
  if (report.skippedBuiltins.length) {
    console.log(`\n• Skipped Node builtins:`);
    for (const p of report.skippedBuiltins) console.log(`  = ${p}`);
  }
  if (report.missingPackages.length) {
    console.log(`\n! External packages missing from the root package.json:`);
    for (const p of report.missingPackages) console.log(`  ? ${p}`);
  }
  if (report.unresolved.length) {
    console.log(`\n! Unresolved imports:`);
    for (const u of report.unresolved)
      console.log(`  ? ${u.spec}  (from ${u.from})`);
  }
  console.log("");
}

try {
  const args = parseArgs();
  const report = clone(args);
  printReport(report);
} catch (err) {
  console.error(
    `\nclone-component failed: ${err instanceof Error ? err.message : err}\n`,
  );
  process.exit(1);
}
