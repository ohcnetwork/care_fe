/**
 * Compiles a Typst print template to PDF outside the browser, using the same
 * compiler, fonts and library as the app.
 *
 *   npm run print:render -- invoice
 *   npm run print:render -- invoice --data my-data.json --out /tmp/invoice.pdf
 *   npm run print:render -- invoice --asset /assets/logo.svg=public/images/care_logo.svg
 *
 * Without --data, the template's `<name>.sample.json` is used.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { parseArgs } from "node:util";

import { createTypstCompiler, initOptions } from "@myriaddreamin/typst.ts";

const PRINT_ROOT = resolve("src/print");
const WASM = resolve(
  "node_modules/@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm",
);

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    data: { type: "string" },
    out: { type: "string" },
    asset: { type: "string", multiple: true, default: [] },
  },
});

const template = positionals[0];
if (!template) {
  console.error(
    "Usage: npm run print:render -- <template> [--data file] [--out file]",
  );
  process.exit(1);
}

const dataPath =
  values.data ?? join(PRINT_ROOT, "templates", `${template}.sample.json`);
const outPath = values.out ?? `${template}.pdf`;

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

const files = walk(PRINT_ROOT);
const fonts = files
  .filter((f) => f.endsWith(".ttf"))
  .map((f) => new Uint8Array(readFileSync(f)));

const compiler = createTypstCompiler();
await compiler.init({
  getModule: () => readFileSync(WASM),
  beforeBuild: [
    initOptions.disableDefaultFontAssets(),
    initOptions.loadFonts(fonts),
  ],
});

for (const file of files.filter((f) => f.endsWith(".typ"))) {
  compiler.addSource(
    `/${relative(PRINT_ROOT, file)}`,
    readFileSync(file, "utf8"),
  );
}
compiler.mapShadow("/data.json", new Uint8Array(readFileSync(dataPath)));
for (const mapping of values.asset ?? []) {
  const [virtualPath, localPath] = mapping.split("=");
  compiler.mapShadow(virtualPath, new Uint8Array(readFileSync(localPath)));
}

const started = performance.now();
const { result, diagnostics } = await compiler.compile({
  mainFilePath: `/templates/${template}.typ`,
  format: 1, // CompileFormatEnum.pdf
  inputs: { data: "/data.json" },
  diagnostics: "unix",
});

for (const diagnostic of diagnostics ?? []) console.error(diagnostic);
if (!result) process.exit(1);

writeFileSync(outPath, result);
console.log(
  `${outPath}: ${(result.length / 1024).toFixed(0)} KB in ${(performance.now() - started).toFixed(0)} ms`,
);
