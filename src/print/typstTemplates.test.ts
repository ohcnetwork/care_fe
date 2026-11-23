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
import type { InvoicePrintContent } from "@/pages/Facility/billing/invoice/invoicePrintData";
import type { DetailsTablePrintContent } from "@/print/detailsTable";
import type { PrintLayout, TypstPaper } from "@/print/types";

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

const layoutFor = (paper: TypstPaper): PrintLayout => ({
  title: "Test",
  page: {
    paper,
    flipped: false,
    margin: {
      top: MARGIN_MM,
      right: MARGIN_MM,
      bottom: MARGIN_MM,
      left: MARGIN_MM,
    },
  },
  header: {
    hidden: false,
    image: null,
    logo: null,
    facility: {
      name: "Sample District Multispeciality Charitable Hospital",
      address:
        "12 Example Road, Test Nagar, Sample Town, Test District, 600001\nDL No. : XYZ20AB2023000001,XYZ21AB2023000002, XYZ20AB2023000003\nGSTIN : 00AAAAA0000A1Z0",
      phone: "+910000000000",
    },
  },
  footer_image: null,
  watermark: null,
  status_watermark: null,
  labels: { page_x_of_y: "Page {current} of {total}" },
});

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

async function compile(
  template: string,
  content: unknown,
  paper: TypstPaper = "a4",
  layout: PrintLayout = layoutFor(paper),
) {
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
  /** Font size in points. */
  size: number;
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
        size: item.height,
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

test("header: the hospital name is smaller on A5, but not beside a wide logo on A4", async () => {
  // A logo this wide leaves the name's own cell narrower than A5's page on A4.
  compiler.mapShadow(
    "/assets/logo",
    new TextEncoder().encode(
      '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="40"><rect width="200" height="40"/></svg>',
    ),
  );
  const nameSize = async (paper: TypstPaper) => {
    const layout = layoutFor(paper);
    layout.header!.logo = {
      path: "/assets/logo",
      width: 200,
      height: null,
      alignment: "right",
    };
    const content = detailsTable({
      header: ["Item"],
      widths: [null],
      rows: [["Paracetamol"]],
    });
    const pdf = await readPdf(
      await compile("details-table", content, paper, layout),
    );
    const name = pdf.pages[0].boxes.find((box) =>
      box.text.startsWith("Sample"),
    );
    return name && Math.round(name.size * 10) / 10;
  };
  try {
    assert.equal(await nameSize("a4"), 18);
    assert.equal(await nameSize("a5"), 15);
  } finally {
    compiler.unmapShadow("/assets/logo");
  }
});

test("details-table: Indian-script text prints with real letters", async () => {
  const names = {
    NotoSansMalayalam: "രാഹുൽ കൃഷ്ണൻ",
    NotoSansDevanagari: "राहुल कुमार",
    NotoSansTamil: "ராகுல் கிருஷ்ணன்",
    NotoSansKannada: "ರಾಹುಲ್ ಕೃಷ್ಣ",
  };
  const bytes = await compile("details-table", {
    ...detailsTable({
      header: ["ഇനം", "ബാച്ച്", "അളവ്"],
      widths: [2, 1, null],
      rows: Object.values(names).map((name) => [name, "B12", "1.00"]),
    }),
    heading: "മരുന്ന് തിരികെ നൽകൽ",
  });

  // A missing letter prints as an empty box but keeps its character in the
  // text, so check the fonts the PDF was drawn with instead.
  const pdfSource = Buffer.from(bytes).toString("latin1");
  for (const font of Object.keys(names)) {
    assert.match(pdfSource, new RegExp(`/BaseFont /[A-Z]{6}\\+${font}-`));
  }
  assert.match(pdfSource, /\+NotoSansMalayalam-Bold/, "semibold heading");
  assertReadable(await readPdf(bytes));
});

test("fit-words: never breaks a Kannada joined letter", async () => {
  // Typst's clusters split ಸ್ವಾ into ಸ್ + ವಾ; a break there would print a
  // half letter. Some of these widths break right at such a spot.
  compiler.addSource(
    "/templates/test-kannada.typ",
    `#import "../typst/care.typ": *
#set page(width: 400pt, height: auto, margin: 10pt)
#set text(font: fonts, size: 10pt)
#for w in range(20, 90, step: 2) {
  block(width: w * 1pt, fit-words("ಲಕ್ಷ್ಮೀನಾರಾಯಣಕೃಷ್ಣಸ್ವಾಮಿಪ್ರಸಾದ"))
}`,
  );
  const { pages } = await readPdf(await compile("test-kannada", null));

  const lines = new Map<number, TextBox[]>();
  for (const box of pages.flatMap((page) => page.boxes)) {
    const y = Math.round(box.bottom);
    lines.set(y, [...(lines.get(y) ?? []), box]);
  }
  for (const boxes of lines.values()) {
    const line = boxes
      .sort((a, b) => a.left - b.left)
      .map((box) => box.text)
      .join("")
      .trim();
    assert.ok(!line.endsWith("್"), `"${line}" ends in half a letter`);
  }
});

function prescriptionsContent(
  medications: PrescriptionsPrintContent["prescriptions"][number]["medications"],
): PrescriptionsPrintContent {
  return {
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
        medications,
      },
    ],
    footer: "Computer generated",
  };
}

test("prescriptions: a long medicine name or frequency keeps every column", async () => {
  const content = prescriptionsContent([
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
  ]);

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

test("prescriptions: a row taller than the page continues on the next page", async () => {
  // Numbered sentences show exactly which part of the note went missing. 900
  // words in one cell is past the ~500 show-rule matches Typst allows in a
  // paragraph, which fit-words once exceeded ("maximum grouping depth").
  const sentences = Array.from(
    { length: 60 },
    (_, i) =>
      `S${i + 1}: take with warm water after food and watch for drowsiness, rash or stomach upset.`,
  );
  const pdf = await readPdf(
    await compile(
      "prescriptions",
      prescriptionsContent([
        {
          index: "1",
          name: "Paracetamol 500 mg oral tablet",
          instructions: [
            {
              dosage: "1 tablets",
              frequency: "1-0-1 (Twice a day)",
              duration: "5 days",
              text: "After food",
            },
          ],
          note: `Note: ${sentences.join(" ")}`,
        },
      ]),
      "a5",
    ),
  );

  const printed = new Set(
    [...pdf.text.matchAll(/S(\d+):/g)].map((match) => Number(match[1])),
  );
  const missing = sentences.map((_, i) => i + 1).filter((n) => !printed.has(n));
  assert.deepEqual(missing, [], `note sentences ${missing} were cut off`);
  assert.equal(pageWith(pdf, "Medicine"), 1, "the table starts on page 1");
});

test("prescriptions: on A5 the details wrap into one column, like the HTML print", async () => {
  // Any square SVG stands in for the QR code, which takes width from the details.
  compiler.mapShadow(
    "/assets/qr-code.svg",
    new TextEncoder().encode(
      '<svg xmlns="http://www.w3.org/2000/svg" width="29" height="29"><rect width="29" height="29"/></svg>',
    ),
  );
  const content: PrescriptionsPrintContent = {
    ...prescriptionsContent([
      {
        index: "1",
        name: "Paracetamol 500 mg oral tablet",
        instructions: [
          {
            dosage: "1 tablets",
            frequency: "1-0-1 (Twice a day)",
            duration: "5 days",
            text: "After food",
          },
        ],
        note: null,
      },
    ]),
    details: {
      left: [
        { label: "Patient", value: "Test Patient" },
        { label: "Age / Sex", value: "25y, Male" },
        { label: "Mobile Number", value: "+91 00000 00000" },
      ],
      right: [
        { label: "Hospital ID", value: "1" },
        { label: "Encounter Date", value: "28 Oct 2026, Wednesday" },
      ],
      location: null,
    },
    qr_code: "/assets/qr-code.svg",
  };
  const details = async (paper: TypstPaper) => {
    const { boxes } = (
      await readPdf(await compile("prescriptions", content, paper))
    ).pages[0];
    const label = (text: string) => {
      const box = boxes.find((b) => b.text.trim() === text);
      assert.ok(box, `no "${text}" on ${paper}`);
      return box;
    };
    return {
      patient: label("Patient"),
      mobile: label("Mobile Number"),
      hospitalId: label("Hospital ID"),
      // A wrapped value is split into one text box per line.
      dateOnOneLine: boxes.some((b) =>
        b.text.includes("28 Oct 2026, Wednesday"),
      ),
    };
  };
  try {
    const a5 = await details("a5");
    assert.ok(a5.dateOnOneLine, "the encounter date wrapped on A5");
    assert.ok(
      Math.abs(a5.hospitalId.left - a5.patient.left) < 1 &&
        a5.hospitalId.top < a5.mobile.bottom,
      "on A5, Hospital ID isn't below Mobile Number in one column",
    );

    const a4 = await details("a4");
    assert.ok(
      a4.hospitalId.left > a4.patient.left + 100,
      "on A4, the details lost their second column",
    );
  } finally {
    compiler.unmapShadow("/assets/qr-code.svg");
  }
});

function pageWith(pdf: Awaited<ReturnType<typeof readPdf>>, text: string) {
  const index = pdf.pages.findIndex((page) =>
    page.boxes.some((box) => box.text.trim() === text),
  );
  return index === -1 ? null : index + 1;
}

const dispenseOrder = (note: string | null): DetailsTablePrintContent => ({
  heading: "Dispense order",
  patient: { name: "Test Patient", identifiers: [] },
  patient_label: "Patient",
  details: {
    left: [
      { label: "Patient", value: "Test Patient" },
      { label: "Age / Sex", value: "25y, Male" },
      { label: "Hospital ID", value: "1" },
    ],
    right: [
      { label: "Date", value: "22 Nov 2026, Sunday" },
      { label: "Mobile Number", value: "+91 00000 00000" },
      { label: "Location", value: "Pharmacy" },
    ],
  },
  title: null,
  note,
  table_title: "Medication Dispenses",
  table: {
    header: [
      "Medicine",
      "Dosage",
      "Frequency",
      "Quantity",
      "Lot/Batch Number",
      "Expiry Date",
      "Prepared date",
    ],
    widths: [3, null, 2, null, 1.5, null, null],
    rows: [
      [
        JOINED_NAME,
        "1 tablets",
        "0-0-1 (Night only)",
        "1.00",
        "9999",
        "27/06/2030",
        "11/20/2026",
      ],
      [
        LONG_NAME,
        "1 microgram",
        "1-0-1 (Twice a day)",
        "1.00",
        "99998",
        "27/06/2030",
        "11/20/2026",
      ],
    ],
  },
  footer: { left: "Computer generated", right: "Generated today" },
});

test("details-table: on A5 the table starts on the first page", async () => {
  const pdf = await readPdf(
    await compile("details-table", dispenseOrder(null), "a5"),
  );

  assertReadable(pdf);
  assert.equal(pageWith(pdf, "Medicine"), 1);
  assert.ok(pdf.text.includes("RESISTANT),DOMPERIDONE"));
});

test("details-table: a table pushed to the next page takes its title along", async () => {
  const note = Array(26)
    .fill("A long note that pushes the table down the page.")
    .join(" ");
  const pdf = await readPdf(
    await compile("details-table", dispenseOrder(note), "a5"),
  );

  assert.equal(
    pageWith(pdf, "Medication Dispenses"),
    pageWith(pdf, "Medicine"),
  );
});

test("invoice: on A5 amounts stay whole and the Item column keeps its width", async () => {
  const taxes = ["CGST", "SGST", "IGST"];
  const labels = Object.fromEntries(
    [
      "patient",
      "address",
      "amount",
      "bill_to",
      "created_by",
      "credit_notes_title",
      "date_and_time",
      "discount",
      "grand_total",
      "invoice",
      "issue_date",
      "item",
      "location",
      "net_amount",
      "no_address_provided",
      "no_charge_items",
      "payment_method",
      "payment_terms",
      "qty",
      "reference",
      "total",
      "total_credit_notes",
      "total_received",
      "unit_price",
    ].map((key) => [key, key === "item" ? "Item" : key.replace(/_/g, " ")]),
  );
  const invoice: InvoicePrintContent = {
    labels,
    number: "INV/26-27/0003",
    issue_date: "20 Nov, 2026 4:02 PM",
    patient: {
      name: "Test Patient",
      gender_age: "Male, 25y",
      identifiers: [],
      address: null,
    },
    qr_code: null,
    tax_columns: taxes,
    items: [
      {
        index: 1,
        title: LONG_NAME,
        subtitle: "Lot: 99998 | Expiry: 27/06/2030",
        unit_price: "1,25,000.00",
        quantity: "1.00",
        discount: { total: "23.00", parts: ["0.00", "23.00"] },
        taxes: [
          { total: "1.62", unit: "6.00%" },
          { total: "2.43", unit: "9.00%" },
          { total: "4.86", unit: "18.00%" },
        ],
        total: "1,25,035.91",
      },
    ],
    totals: { components: [], net: "₹1,25,035.91", gross: "₹1,25,035.91" },
    payments: null,
    credit_notes: null,
    payment_terms: null,
    created_by: "Dr. Test",
    location: null,
  };

  const pdf = await readPdf(await compile("invoice", invoice, "a5"));

  assertReadable(pdf);
  for (const amount of ["1,25,000.00", "1,25,035.91", "18.00%"]) {
    assert.ok(
      pdf.pages.some((page) =>
        page.boxes.some((box) => box.text.includes(amount)),
      ),
      `"${amount}" was split`,
    );
  }
  assert.notEqual(pageWith(pdf, "Item"), null, "the Item column collapsed");
});
