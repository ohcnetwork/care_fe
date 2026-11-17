/**
 * Compiles the Typst print templates with their sample data, and the invoice
 * with each print-template feature, using the same compiler and fonts as the
 * app.
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { join, relative } from "node:path";
import { before, test } from "node:test";

import {
  type TypstCompiler,
  createTypstCompiler,
} from "@myriaddreamin/typst.ts/compiler";
import {
  disableDefaultFontAssets,
  loadFonts,
} from "@myriaddreamin/typst.ts/options.init";
import type { WebAssemblyModuleRef } from "@myriaddreamin/typst.ts/wasm";

import type { PrintDocument, PrintLayout } from "./types";

const ROOT = import.meta.dirname;
const require = createRequire(import.meta.url);

const files = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? files(join(dir, entry.name))
      : [join(dir, entry.name)],
  );

let compiler: TypstCompiler;

before(async () => {
  const wasm = readFileSync(
    require.resolve("@myriaddreamin/typst-ts-web-compiler/wasm"),
  );
  const fonts = files(join(ROOT, "fonts"))
    .filter((f) => f.endsWith(".ttf"))
    .map((f) => new Uint8Array(readFileSync(f)));

  compiler = createTypstCompiler();
  await compiler.init({
    getModule: () =>
      ({ module_or_path: wasm }) as unknown as WebAssemblyModuleRef,
    beforeBuild: [disableDefaultFontAssets(), loadFonts(fonts)],
  });
  for (const file of files(ROOT).filter((f) => f.endsWith(".typ"))) {
    compiler.addSource(`/${relative(ROOT, file)}`, readFileSync(file, "utf8"));
  }
  compiler.mapShadow(
    "/assets/logo",
    new Uint8Array(readFileSync("public/images/care_logo.svg")),
  );
  const png = new Uint8Array(readFileSync("public/images/icons/pwa-64x64.png"));
  compiler.mapShadow("/assets/header-image", png);
  compiler.mapShadow("/assets/footer-image", png);
});

async function compile(template: string, data: unknown) {
  compiler.mapShadow(
    "/data.json",
    new TextEncoder().encode(JSON.stringify(data)),
  );
  const { result, diagnostics } = await compiler.compile({
    mainFilePath: `/templates/${template}.typ`,
    format: 1, // PDF
    inputs: { data: "/data.json" },
    diagnostics: "unix",
  });
  assert.ok(
    result,
    `${template} failed to compile:\n${diagnostics?.join("\n")}`,
  );
  const pdf = new TextDecoder("latin1").decode(result);
  assert.ok(pdf.startsWith("%PDF-"));
  return {
    pages: [...pdf.matchAll(/\/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/g)].map(
      ([, w, h]) => [Math.round(Number(w)), Math.round(Number(h))],
    ),
    tagged: pdf.includes("/StructTreeRoot"),
  };
}

const sample = <T>(template: string): PrintDocument<T> =>
  JSON.parse(
    readFileSync(join(ROOT, "templates", `${template}.sample.json`), "utf8"),
  );

const templates = files(join(ROOT, "templates"))
  .filter((f) => f.endsWith(".typ"))
  .map((f) => relative(join(ROOT, "templates"), f).replace(/\.typ$/, ""));

for (const template of templates) {
  test(`${template} compiles with its sample data`, async () => {
    const { pages, tagged } = await compile(template, sample(template));
    assert.ok(pages.length > 0);
    assert.ok(tagged, "PDF should be tagged for accessibility");
  });
}

type Invoice = Record<string, unknown>;
const invoice = (
  layout: Partial<PrintLayout>,
  content: Partial<Invoice> = {},
) => {
  const base = sample<Invoice>("invoice");
  return {
    layout: { ...base.layout, ...layout },
    content: { ...base.content, ...content },
  };
};
const header = sample<Invoice>("invoice").layout.header!;

test("invoice: A5 landscape with logo, watermarks and footer image", async () => {
  const { pages } = await compile(
    "invoice",
    invoice({
      page: {
        paper: "a5",
        flipped: true,
        margin: { top: 5, right: 5, bottom: 5, left: 5 },
      },
      header: {
        ...header,
        logo: {
          path: "/assets/logo",
          width: 120,
          height: null,
          alignment: "center",
        },
      },
      footer_image: { path: "/assets/footer-image", max_height: 40 },
      watermark: { text: "CONFIDENTIAL", opacity: 0.08, rotation: -30 },
      status_watermark: { text: "Cancelled", color: "red" },
    }),
  );
  // A5 landscape is 210mm × 148mm.
  assert.deepEqual(pages[0], [595, 420]);
  assert.ok(pages.length > 1);
});

test("invoice: header image, Letter and Legal paper", async () => {
  for (const [paper, size] of [
    ["us-letter", [612, 792]],
    ["us-legal", [612, 1008]],
  ] as const) {
    const { pages } = await compile(
      "invoice",
      invoice({
        page: { ...sample<Invoice>("invoice").layout.page, paper },
        header: {
          ...header,
          image: { path: "/assets/header-image", max_height: 60 },
        },
      }),
    );
    assert.deepEqual(pages[0], size);
  }
});

test("invoice: logo on the left, hidden header, no facility", async () => {
  await compile(
    "invoice",
    invoice({
      header: {
        ...header,
        logo: {
          path: "/assets/logo",
          width: null,
          height: 30,
          alignment: "left",
        },
      },
    }),
  );
  await compile("invoice", invoice({ header: { ...header, hidden: true } }));
  await compile("invoice", invoice({ header: null }));
});

test("invoice: no items or payments, with credit notes, in Malayalam", async () => {
  const { pages } = await compile(
    "invoice",
    invoice(
      { lang: "ml" },
      {
        items: [],
        payments: null,
        payment_terms: null,
        location: null,
        credit_notes: {
          rows: [
            {
              index: 1,
              datetime: "17 Nov 2026, 12:10 PM",
              id: "c0ffee00-0000-4000-8000-000000000000",
              method: "Cash",
              reference: "",
              amount: "100.00",
            },
          ],
          total: "₹100.00",
        },
      },
    ),
  );
  assert.equal(pages.length, 1);
});
