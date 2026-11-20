import {
  type TypstCompiler,
  createTypstCompiler,
} from "@myriaddreamin/typst.ts/compiler";
import {
  disableDefaultFontAssets,
  loadFonts,
} from "@myriaddreamin/typst.ts/options.init";
import type { WebAssemblyModuleRef } from "@myriaddreamin/typst.ts/wasm";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { join, relative } from "node:path";
import { before, test } from "node:test";

import type { PrescriptionsPrintContent } from "@/components/Prescription/prescriptionsPrintData";
import type { DetailsTablePrintContent } from "@/print/detailsTable";
import type { PrintLayout } from "@/print/types";

const PRINT_DIR = join(process.cwd(), "src/print");
const MM = 72 / 25.4;
const MARGIN_MM = 10;

const LONG_WORD = "PhenoxymethylpenicillinPhenoxymethylpenicillin";
const LONG_NAME = `Amoxicillin 875 mg and clavulanicacid(as clavulanate potassium) 125 mg oral tablet ${LONG_WORD}`;
const JOINED_NAME =
  "DICLOFENAC SODIUM TAB IP(GASTRO-RESISTANT),DOMPERIDONE TAB IP (FILM COATED)_2321312";
const LONG_LOT = "LOTBATCH20261120ABCDEF1234567890XYZ";
const LONG_FREQUENCY =
  "Every 4 hours as needed for breakthrough pain, maximum 6 doses in 24 hours";

const layout: PrintLayout = {
  title: "Test",
  page: {
    paper: "a4",
    flipped: false,
    margin: {
      top: MARGIN_MM,
      right: MARGIN_MM,
      bottom: MARGIN_MM,
      left: MARGIN_MM,
    },
  },
  header: null,
  footer_image: null,
  watermark: null,
  status_watermark: null,
  labels: { page_x_of_y: "Page {current} of {total}" },
};

function filesUnder(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? filesUnder(join(dir, entry.name))
      : [join(dir, entry.name)],
  );
}

let compiler: TypstCompiler;

before(async () => {
  const require = createRequire(join(process.cwd(), "package.json"));
  const wasm = readFileSync(
    require.resolve("@myriaddreamin/typst-ts-web-compiler/wasm"),
  );
  const fonts = filesUnder(join(PRINT_DIR, "fonts"))
    .filter((path) => path.endsWith(".ttf"))
    .map((path) => new Uint8Array(readFileSync(path)));

  compiler = createTypstCompiler();
  await compiler.init({
    getModule: () =>
      ({ module_or_path: wasm }) as unknown as WebAssemblyModuleRef,
    beforeBuild: [disableDefaultFontAssets(), loadFonts(fonts)],
  });
  for (const path of filesUnder(PRINT_DIR).filter((p) => p.endsWith(".typ"))) {
    compiler.addSource(
      `/${relative(PRINT_DIR, path)}`,
      readFileSync(path, "utf8"),
    );
  }
});

async function compile(template: string, content: unknown) {
  compiler.mapShadow(
    "/data.json",
    new TextEncoder().encode(JSON.stringify({ layout, content })),
  );
  try {
    const result = await compiler.runWithWorld(
      {
        mainFilePath: `/templates/${template}.typ`,
        inputs: { data: "/data.json" },
      },
      async (world) => {
        const compiled = await world.compile({ diagnostics: "unix" });
        if (compiled.hasError) return { diagnostics: compiled.diagnostics };
        return world.pdf({ diagnostics: "unix" });
      },
    );
    if (!("result" in result) || !result.result) {
      throw new Error(
        `Couldn't compile ${template}: ${JSON.stringify(result.diagnostics)}`,
      );
    }
    return result.result;
  } finally {
    compiler.unmapShadow("/data.json");
  }
}

interface TextBox {
  text: string;
  left: number;
  right: number;
  bottom: number;
  top: number;
}

async function readPdf(pdf: Uint8Array) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjs.getDocument({ data: pdf.slice() }).promise;
  const pages: { width: number; boxes: TextBox[] }[] = [];
  let text = "";
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const content = await page.getTextContent({ disableNormalization: true });
    const boxes: TextBox[] = [];
    for (const item of content.items) {
      if (!("str" in item)) continue;
      // No line ends, so a word broken over two lines reads whole.
      text += item.str;
      if (!item.str.trim()) continue;
      const [, , , , x, y] = item.transform as number[];
      // Baseline to roughly cap height, so adjacent lines don't overlap.
      boxes.push({
        text: item.str,
        left: x,
        right: x + item.width,
        bottom: y,
        top: y + item.height * 0.7,
      });
    }
    pages.push({ width: page.view[2], boxes });
  }
  return { pages, text };
}

function assertReadable({ pages, text }: Awaited<ReturnType<typeof readPdf>>) {
  assert.ok(!text.includes("\u200B"), "zero-width spaces in the PDF text");
  for (const { width, boxes } of pages) {
    const rightEdge = width - MARGIN_MM * MM;
    for (const box of boxes) {
      assert.ok(
        box.right <= rightEdge + 1,
        `"${box.text}" runs past the right margin`,
      );
    }
    for (const a of boxes) {
      for (const b of boxes) {
        if (a === b) continue;
        const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const overlapY = Math.min(a.top, b.top) - Math.max(a.bottom, b.bottom);
        assert.ok(
          overlapX <= 1 || overlapY <= 1,
          `"${a.text}" is drawn over "${b.text}"`,
        );
      }
    }
  }
}

function detailsTable(
  table: DetailsTablePrintContent["table"],
): DetailsTablePrintContent {
  return {
    heading: "Medication return",
    patient: null,
    patient_label: "Patient",
    details: { left: [], right: [] },
    title: null,
    note: null,
    table_title: "Items returned",
    table,
    footer: { left: "Computer generated", right: "Generated today" },
  };
}

test("details-table: long names and lot numbers stay in their columns", async () => {
  const pdf = await readPdf(
    await compile(
      "details-table",
      detailsTable({
        header: [
          "Item",
          "Batch",
          "Quantity",
          "Expiry Date",
          "Condition",
          "Return Date",
        ],
        widths: [3, 1.5, null, null, null, null],
        rows: [
          [JOINED_NAME, LONG_LOT, "1.00", "27/06/2030", "Normal", "20/11/2026"],
          [LONG_NAME, "2", "15.00", "09/09/2027", "Damaged", "20/11/2026"],
          [
            "Paracetamol 500 mg oral tablet",
            "B12",
            "10.00",
            "-",
            "Normal",
            "-",
          ],
        ],
      }),
    ),
  );

  assertReadable(pdf);
  for (const value of [LONG_WORD, LONG_LOT, "RESISTANT),DOMPERIDONE"]) {
    assert.ok(pdf.text.includes(value), `"${value}" lost characters`);
  }
  assert.ok(pdf.text.includes("Paracetamol 500 mg oral tablet"));
  assert.ok(pdf.text.includes("27/06/2030"));
});

test("details-table: rejects widths that don't match the header", async () => {
  await assert.rejects(
    compile(
      "details-table",
      detailsTable({
        header: ["Item", "Quantity"],
        widths: [1],
        rows: [["Paracetamol", "1"]],
      }),
    ),
    /one entry per header column/,
  );
});

test("prescriptions: a long medicine name or frequency keeps every column", async () => {
  const content: PrescriptionsPrintContent = {
    labels: {
      patient: "Patient",
      prescribed_by: "Prescribed by",
      note: "Note",
    },
    patient: { name: "Test Patient", identifiers: [] },
    details: {
      left: [{ label: "Patient", value: "Test Patient" }],
      right: [{ label: "Date", value: "20 Nov 2026" }],
      location: null,
    },
    qr_code: null,
    count_text: null,
    table_header: [
      "#",
      "Medicine",
      "Dosage",
      "Frequency",
      "Duration",
      "Instructions",
    ],
    prescriptions: [
      {
        symbol: "Rx",
        title: "Medicine instructions",
        progress: null,
        date: "20 Nov 2026",
        prescribed_by: "Dr. Test",
        note: null,
        medications: [
          {
            index: "1",
            name: LONG_NAME,
            instructions: [
              {
                dosage: "1 microgram",
                frequency: LONG_FREQUENCY,
                duration: "4 days",
                text: "Take after food with water.",
              },
              {
                dosage: "2 tablets",
                frequency: "1-0-1 (Twice a day)",
                duration: "3 days",
                text: "Then reduce the dose.",
              },
            ],
            note: `Note: ${LONG_WORD}`,
          },
          {
            index: "2",
            name: JOINED_NAME,
            instructions: [
              {
                dosage: "1 tablets",
                frequency: "1-1-1 (Thrice a day)",
                duration: "5 days",
                text: "Take after food",
              },
            ],
            note: null,
          },
        ],
      },
    ],
    footer: "Computer generated",
  };

  const pdf = await readPdf(await compile("prescriptions", content));

  assertReadable(pdf);
  const words = pdf.pages.flatMap((page) => page.boxes.map((box) => box.text));
  assert.ok(
    words.some((word) => word.includes("Instructions")),
    "the Instructions column header is missing or split",
  );
  for (const value of [LONG_WORD, "RESISTANT),DOMPERIDONE"]) {
    assert.ok(pdf.text.includes(value), `"${value}" lost characters`);
  }
});
