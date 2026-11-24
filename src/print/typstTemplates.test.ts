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

import type { QuestionnaireResponsePrintContent } from "@/components/Facility/ConsultationDetails/questionnaireResponsePrintData";
import type { MedicationAdministrationPrintContent } from "@/components/Medicine/MedicationAdministration/medicationAdministrationPrintData";
import {
  formatDosage,
  joinInstructionTexts,
} from "@/components/Medicine/utils";
import type { PrescriptionsPrintContent } from "@/components/Prescription/prescriptionsPrintData";
import type { ResourceLetterPrintContent } from "@/components/Resource/resourceLetterPrintData";
import type { AppointmentPrintContent } from "@/pages/Appointments/appointmentPrintData";
import type { ChargeItemsPrintContent } from "@/pages/Facility/billing/account/components/chargeItemsPrintData";
import type { InvoicePrintContent } from "@/pages/Facility/billing/invoice/invoicePrintData";
import type { PaymentReceiptPrintContent } from "@/pages/Facility/billing/paymentReconciliation/paymentReceiptPrintData";
import type { DiagnosticReportPrintContent } from "@/pages/Facility/services/diagnosticReports/diagnosticReportPrintData";
import type { DetailsTablePrintContent } from "@/print/detailsTable";
import { richTextToPrint } from "@/print/richText";
import type { PrintLayout, TypstPaper } from "@/print/types";
import type { MedicationRequestDosageInstruction } from "@/types/emr/medicationRequest/medicationRequest";

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

const quantity = (value: string, unit: string) => ({
  value,
  unit: { code: unit, display: unit, system: "http://unitsofmeasure.org" },
});

const doseRange = (low: string, high: string, unit: string) =>
  ({
    dose_and_rate: {
      dose_range: { low: quantity(low, unit), high: quantity(high, unit) },
    },
  }) as MedicationRequestDosageInstruction;

test("details-table: on A5 a dose range wraps between its doses and leaves the other columns room", async () => {
  // Column 1 is the dispense order's `auto` Dosage column.
  for (const [low, high, unit] of [
    ["1", "2", "tablets"],
    ["250", "500", "milligram"],
  ]) {
    const dosage = formatDosage(doseRange(low, high, unit), { print: true });
    const content = dispenseOrder(null);
    content.table.rows = content.table.rows.map((row) =>
      row.map((cell, i) => (i === 1 ? dosage : cell)),
    );
    const pdf = await readPdf(await compile("details-table", content, "a5"));

    assertReadable(pdf);
    // Squeezed `fr` columns split even short words.
    for (const word of ["Medicine", "DICLOFENAC"]) {
      assert.ok(pageWith(pdf, word), `${dosage}: "${word}" is split`);
    }
    const lines = pdf.pages.flatMap((page) =>
      page.boxes.map((box) => box.text.replace(/\s/g, " ")),
    );
    for (const dose of [`${low} ${unit}`, `${high} ${unit}`]) {
      assert.ok(
        lines.some((line) => line.includes(dose)),
        `${dosage}: "${dose}" is split over two lines`,
      );
    }
  }
});

test("formatDosage: prints keep each number with its unit, screens don't", () => {
  const range = doseRange("1", "2", "tablets");
  const single = {
    dose_and_rate: { dose_quantity: quantity("250", "milligram") },
  } as MedicationRequestDosageInstruction;

  assert.equal(formatDosage(range), "1 tablets → 2 tablets");
  assert.equal(formatDosage(single), "250 milligram");
  assert.equal(
    formatDosage(range, { print: true }),
    "1\u00a0tablets → 2\u00a0tablets",
  );
  assert.equal(formatDosage(single, { print: true }), "250\u00a0milligram");
  // `joinInstructionTexts` maps it, so its second argument is an index.
  assert.equal(
    joinInstructionTexts([range], formatDosage),
    "1 tablets → 2 tablets",
  );
});

test("prescriptions: a dose too wide for its cell breaks after the number instead of running over", async () => {
  // "100 international" is wider than the A5 Dosage column.
  const dosage = formatDosage(
    {
      dose_and_rate: { dose_quantity: quantity("100", "international unit") },
    } as MedicationRequestDosageInstruction,
    { print: true },
  );
  const pdf = await readPdf(
    await compile(
      "prescriptions",
      prescriptionsContent([
        {
          index: "1",
          name: "Insulin glargine 100 units/mL injection",
          instructions: [
            {
              dosage,
              frequency: "1-0-1 (Twice a day)",
              duration: "5 days",
              text: "After food",
            },
          ],
          note: null,
        },
      ]),
      "a5",
    ),
  );

  assertReadable(pdf);
});

const INVOICE_LABELS = Object.fromEntries(
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

test("invoice: on A5 amounts stay whole and the Item column keeps its width", async () => {
  const taxes = ["CGST", "SGST", "IGST"];
  const labels = INVOICE_LABELS;
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

// As the rich-text editor saves it (see richText.test.ts).
const EDITOR_MARKDOWN =
  "<u>***dfsh usdujhfjasjfd hdsj fhjsd fjdhfajs***</u>\n\n*dvsdadsfs*&#x20;\n\nddsfdsfs\n========\n\n- [x] done task";

function assertFormatted({ text }: Awaited<ReturnType<typeof readPdf>>) {
  for (const words of [
    "dfsh usdujhfjasjfd hdsj fhjsd fjdhfajs",
    "dvsdadsfs",
    "ddsfdsfs",
    "done task",
  ]) {
    assert.ok(text.includes(words), `"${words}" is missing`);
  }
  for (const symbol of ["***", "<u>", "&#x20;", "====", "[x]"]) {
    assert.ok(!text.includes(symbol), `"${symbol}" printed as written`);
  }
}

test("diagnostic report: the conclusion's Markdown prints as formatting", async () => {
  const content: DiagnosticReportPrintContent = {
    heading: "Diagnostic report",
    patient: { name: "Test Patient", identifiers: [] },
    patient_label: "Patient",
    patient_rows: [{ label: "Patient", value: "Test Patient" }],
    reports: [
      {
        title: "Sugar test",
        rows: [],
        results: null,
        note: null,
        conclusion: {
          label: "Conclusion",
          blocks: richTextToPrint(EDITOR_MARKDOWN),
        },
        attachments: [],
      },
    ],
    footer: { left: "Printed by Dr. Test", right: "Generated today" },
  };
  const bytes = await compile("diagnostic-report", content);

  assertFormatted(await readPdf(bytes));
  // Typst doesn't slant upright letters: italics need Figtree's italic faces.
  const pdfSource = Buffer.from(bytes).toString("latin1");
  assert.match(pdfSource, /\/BaseFont \/[A-Z]{6}\+Figtree-Italic\b/, "italic");
  assert.match(
    pdfSource,
    /\/BaseFont \/[A-Z]{6}\+Figtree-SemiBoldItalic\b/,
    "bold italic",
  );
});

test("prescriptions: the prescription note's Markdown prints as formatting", async () => {
  const content = prescriptionsContent([
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
  ]);
  content.prescriptions[0].note = richTextToPrint(EDITOR_MARKDOWN);
  const pdf = await readPdf(await compile("prescriptions", content));

  assertFormatted(pdf);
  assert.ok(pdf.text.includes("Note:"), "the note's label is missing");
});

test("appointment: the note's Markdown prints as formatting", async () => {
  const content: AppointmentPrintContent = {
    title: "Appointment details",
    date: "24 Nov 2026",
    resource: "Dr. Test",
    patient_rows: [{ label: "Patient", value: "Test Patient" }],
    token: null,
    qr_code: null,
    tags: null,
    charges: null,
    payments: null,
    note: { label: "Note", blocks: richTextToPrint(EDITOR_MARKDOWN) },
    footer: { left: "Created by Dr. Test", right: "Generated today" },
  };

  assertFormatted(await readPdf(await compile("appointment", content)));
});

/**
 * Finds the fewest rows before `title` that push `next`, the first thing the
 * title introduces, to page 2, and checks the title went with it. That's where
 * a title gets left behind: it needs a line, a table a header plus a row, so
 * some row count leaves room for the title alone at the foot of page 1.
 */
async function assertTitleKeptWithNext(
  template: string,
  contentWith: (rows: number) => unknown,
  title: string,
  next: string,
) {
  const pagesWith = async (rows: number) => {
    const pdf = await readPdf(await compile(template, contentWith(rows)));
    return { title: pageWith(pdf, title), next: pageWith(pdf, next) };
  };
  // More rows only ever push `next` later, so a binary search finds the first.
  let low = 1;
  let high = 120;
  assert.ok((await pagesWith(high)).next! > 1, `"${next}" never left page 1`);
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if ((await pagesWith(middle)).next! > 1) high = middle;
    else low = middle + 1;
  }
  const pages = await pagesWith(low);
  assert.equal(
    pages.title,
    pages.next,
    `with ${low} rows, "${title}" is left behind on page ${pages.title}`,
  );
}

test("diagnostic report: a report's title moves with its details and results", async () => {
  const results = (names: string[]) => ({
    header: ["Test", "Result", "Reference Range"],
    rows: names.map((name) => ({
      component: false,
      cells: [name, "4.5", "4.0 - 5.5"],
      highlight: false,
    })),
  });
  const report = (title: string) => ({
    rows: [{ label: "Specimen", value: "Serum" }],
    note: null,
    conclusion: null,
    attachments: [],
    title,
  });

  await assertTitleKeptWithNext(
    "diagnostic-report",
    (rows): DiagnosticReportPrintContent => ({
      heading: "Diagnostic report",
      patient: { name: "Test Patient", identifiers: [] },
      patient_label: "Patient",
      patient_rows: [{ label: "Patient", value: "Test Patient" }],
      reports: [
        {
          ...report("Complete Blood Count"),
          results: results(Array.from({ length: rows }, (_, i) => `Test ${i}`)),
        },
        { ...report("Lipid Profile"), results: results(["Cholesterol"]) },
      ],
      footer: { left: "Printed by Dr. Test", right: "Generated today" },
    }),
    "Lipid Profile",
    "Cholesterol",
  );
});

const appointmentWithCharges = (
  charges: number,
  extra: Partial<AppointmentPrintContent> = {},
): AppointmentPrintContent => ({
  title: "Appointment details",
  date: "24 Nov 2026",
  resource: "Dr. Test",
  patient_rows: [{ label: "Patient", value: "Test Patient" }],
  token: null,
  qr_code: null,
  tags: null,
  charges: {
    title: "Charges",
    header: ["#", "Item", "Amount", "Status"],
    rows: Array.from({ length: charges }, (_, i) => ({
      index: String(i + 1),
      title: `Consultation ${i}`,
      subtitle: null,
      amount: "₹100.00",
      status: "Billed",
    })),
    total: { label: "Total", value: "₹100.00" },
  },
  payments: null,
  note: null,
  footer: { left: "Created by Dr. Test", right: "Generated today" },
  ...extra,
});

test("appointment: the Payments title moves with the payments table", async () => {
  await assertTitleKeptWithNext(
    "appointment",
    (rows) =>
      appointmentWithCharges(rows, {
        payments: {
          title: "Payments",
          header: ["#", "Invoice", "Method", "Amount"],
          rows: [
            {
              index: "1",
              invoice: "INV/1",
              invoice_time: null,
              method: "Cheque",
              reference: null,
              amount: "₹100.00",
            },
          ],
          total: { label: "Total", value: "₹100.00" },
        },
      }),
    "Payments",
    "Cheque",
  );
});

test("appointment: the note's label moves with the note", async () => {
  await assertTitleKeptWithNext(
    "appointment",
    (rows) =>
      appointmentWithCharges(rows, {
        note: {
          label: "Note",
          blocks: richTextToPrint("Bring the earlier reports"),
        },
      }),
    "Note",
    "Bring the earlier reports",
  );
});

test("invoice: the credit notes title moves with its table", async () => {
  await assertTitleKeptWithNext(
    "invoice",
    (rows): InvoicePrintContent => ({
      labels: { ...INVOICE_LABELS, credit_notes_title: "Credit notes issued" },
      number: "INV/26-27/0003",
      issue_date: "20 Nov, 2026 4:02 PM",
      patient: {
        name: "Test Patient",
        gender_age: "Male, 25y",
        identifiers: [],
        address: null,
      },
      qr_code: null,
      tax_columns: [],
      items: Array.from({ length: rows }, (_, i) => ({
        index: i + 1,
        title: `Paracetamol 500 mg oral tablet ${i + 1}`,
        subtitle: null,
        unit_price: "10.00",
        quantity: "1.00",
        discount: { total: "0.00", parts: [] },
        taxes: [],
        total: "10.00",
      })),
      totals: { components: [], net: "₹10.00", gross: "₹10.00" },
      payments: null,
      credit_notes: {
        rows: [
          {
            index: 1,
            datetime: "20 Nov 2026, 04:02 PM",
            id: "cn-1",
            method: "Cash",
            reference: "CREDIT-REF-1",
            amount: "10.00",
          },
        ],
        total: "₹10.00",
      },
      payment_terms: null,
      created_by: "Dr. Test",
      location: null,
    }),
    "Credit notes issued",
    "CREDIT-REF-1",
  );
});

test("drug chart: a section's title moves with its chart", async () => {
  const content: MedicationAdministrationPrintContent = {
    labels: {
      patient: "Patient",
      product: "Medication",
      patient_name: "Patient name",
      age_sex: "Age / Sex",
      encounter_date: "Encounter date",
    },
    patient: { name: "Test Patient", identifiers: [] },
    title: "Medication administration record",
    info: {
      patient_name: "Test Patient",
      age_sex: "25y, Male",
      encounter_date: "28 Oct 2026",
    },
    slot_labels: ["00", "06", "12", "18"],
    sections: [
      {
        title: "Regular medications",
        prn: false,
        ranges: [
          {
            label: "28 Oct 2026 – 03 Nov 2026",
            days: ["Wed", "Thu", "Fri", "Sat", "Sun", "Mon", "Tue"].map(
              (weekday, i) => ({ weekday, date: `${28 + i}/10` }),
            ),
            rows: [
              {
                name: "Paracetamol 500 mg",
                summaries: ["1 tablet · Oral"],
                orders: null,
                counts: Array(28).fill(0),
              },
            ],
          },
        ],
      },
    ],
    footer: { left: "Printed by Dr. Test", right: "Generated today" },
  };
  // Later sections start on a new page, so only the first one can be left
  // behind: grow the top margin until its chart moves to page 2.
  const pagesWith = async (top: number) => {
    const layout = layoutFor("a4");
    layout.page.flipped = true;
    layout.page.margin.top = top;
    const pdf = await readPdf(
      await compile("medication-administration", content, "a4", layout),
    );
    return {
      title: pageWith(pdf, "REGULAR MEDICATIONS"),
      next: pageWith(pdf, "Paracetamol 500 mg"),
    };
  };
  let low = 10;
  let high = 180;
  assert.ok((await pagesWith(high)).next! > 1, "the chart never left page 1");
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if ((await pagesWith(middle)).next! > 1) high = middle;
    else low = middle + 1;
  }
  const pages = await pagesWith(low);
  assert.equal(
    pages.title,
    pages.next,
    `with a ${low}mm top margin, the title is left behind on page ${pages.title}`,
  );
});

test("charge items: a section's title moves with its table", async () => {
  const section = (
    title: string,
    items: string[],
  ): ChargeItemsPrintContent["sections"][number] => ({
    title,
    header: ["Item", "Qty", "Amount"],
    grow: 0,
    align: ["left", "right", "right"],
    rows: items.map((item) => ({
      type: "item",
      cells: [item, "1", "₹10.00"],
    })),
  });

  await assertTitleKeptWithNext(
    "charge-items",
    (rows): ChargeItemsPrintContent => ({
      warning: null,
      header_space: false,
      details: { left: [], right: [] },
      sections: [
        section(
          "Section One",
          Array.from({ length: rows }, (_, i) => `Item ${i}`),
        ),
        section("Section Two", ["Physiotherapy"]),
      ],
      account_summary: null,
      footer: { left: "Prepared by Dr. Test", right: "Generated today" },
    }),
    "Section Two",
    "Physiotherapy",
  );
});

test("prescriptions: a prescription's heading moves with its medicines", async () => {
  const medication = (name: string, index: number) => ({
    index: String(index + 1),
    name,
    instructions: [
      {
        dosage: "1 tablets",
        frequency: "1-0-1 (Twice a day)",
        duration: "5 days",
        text: "After food",
      },
    ],
    note: null,
  });

  await assertTitleKeptWithNext(
    "prescriptions",
    (rows) => {
      const content = prescriptionsContent(
        Array.from({ length: rows }, (_, i) => medication(`Medicine ${i}`, i)),
      );
      content.prescriptions.push({
        ...content.prescriptions[0],
        title: "Second prescription",
        prescribed_by: "Dr. Second",
        medications: [medication("Atorvastatin", 0)],
      });
      return content;
    },
    "SECOND PRESCRIPTION",
    "Atorvastatin",
  );
});

test("questionnaire response: a section heading moves with its questions", async () => {
  await assertTitleKeptWithNext(
    "questionnaire-response",
    (rows): QuestionnaireResponsePrintContent => ({
      heading: "Questionnaire response",
      patient: null,
      patient_label: "Patient",
      details: { left: [], right: [] },
      title: "Follow-up",
      description: null,
      responses: [
        {
          created: "Created by Dr. Test",
          date: "24 Nov 2026",
          blocks: [
            ...Array.from({ length: rows }, (_, i) => ({
              type: "question" as const,
              text: `Question ${i}`,
              answers: ["Yes"],
            })),
            { type: "heading", text: "Section B", rule: true },
            { type: "question", text: "Next visit", answers: ["1 Dec 2026"] },
          ],
        },
      ],
    }),
    "Section B",
    "Next visit",
  );
});

test("patient details: long values wrap inside their column on A4 and A5", async () => {
  // No spaces and no break points: Typst keeps each one a single word.
  const abha = "muhammedabdulrahmankunjumon1990@abdm";
  const mrn = "TVMMCH2026000123456789";

  for (const paper of ["a4", "a5"] as const) {
    const pdf = await readPdf(
      await compile(
        "details-table",
        {
          ...detailsTable({
            header: ["Item"],
            widths: [null],
            rows: [["Paracetamol"]],
          }),
          details: {
            left: [
              { label: "ABHA address", value: abha },
              { label: "MRN", value: mrn },
            ],
            right: [{ label: "Mobile Number", value: "+91 00000 00000" }],
          },
        },
        paper,
      ),
    );

    assertReadable(pdf);
    for (const value of [abha, mrn]) {
      assert.ok(pdf.text.includes(value), `${paper}: "${value}" lost letters`);
    }
    const { boxes } = pdf.pages[0];
    const rightColumn = boxes.find(
      (box) => box.text.trim() === "Mobile Number",
    );
    assert.ok(rightColumn, `${paper}: no right column`);
    for (const box of boxes) {
      const text = box.text.trim();
      if (text.length < 3 || !(abha.includes(text) || mrn.includes(text))) {
        continue;
      }
      assert.ok(
        box.right <= rightColumn.left,
        `${paper}: "${text}" runs into the right column`,
      );
    }
  }
});

test("questionnaire response: a long unbroken answer wraps on A5", async () => {
  const code = ("REF2026112400017" + "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")
    .repeat(2)
    .slice(0, 68);
  const content: QuestionnaireResponsePrintContent = {
    heading: "Questionnaire response",
    patient: null,
    patient_label: "Patient",
    details: { left: [], right: [] },
    title: "Follow-up",
    description: null,
    responses: [
      {
        created: "Created by Dr. Test",
        date: "24 Nov 2026",
        blocks: [{ type: "question", text: "Reference code", answers: [code] }],
      },
    ],
  };
  const pdf = await readPdf(
    await compile("questionnaire-response", content, "a5"),
  );

  assertReadable(pdf);
  assert.ok(pdf.text.includes(code), "the code lost letters");
});

test("user-entered text: long unbroken values wrap on A5 in every print", async () => {
  // One 70-character code per field, so a lost one is easy to spot.
  const code = (tag: string) =>
    (tag + "2026112400017ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".repeat(2)).slice(
      0,
      70,
    );
  const prints: [string, unknown, string[]][] = [
    [
      "details-table",
      {
        ...detailsTable({
          header: ["Item"],
          widths: [null],
          rows: [["Paracetamol"]],
        }),
        title: code("TITLE"),
        note: code("NOTE"),
      },
      [code("TITLE"), code("NOTE")],
    ],
    [
      "invoice",
      {
        labels: INVOICE_LABELS,
        number: "INV/26-27/0003",
        issue_date: "20 Nov, 2026 4:02 PM",
        patient: {
          name: "Test Patient",
          gender_age: "Male, 25y",
          identifiers: [{ label: "ABHA address", value: code("ABHA") }],
          address: code("ADDRESS"),
        },
        qr_code: null,
        tax_columns: [],
        items: [],
        totals: { components: [], net: "₹0.00", gross: "₹0.00" },
        payments: null,
        credit_notes: null,
        payment_terms: code("TERMS"),
        created_by: "Dr. Test",
        location: null,
      } satisfies InvoicePrintContent,
      [code("ABHA"), code("ADDRESS"), code("TERMS")],
    ],
    [
      "appointment",
      appointmentWithCharges(1, {
        tags: { label: "Tags", value: code("TAGS") },
      }),
      [code("TAGS")],
    ],
    [
      "payment-receipt",
      {
        labels: { notes: "Notes" },
        title: "Payment receipt",
        outcome: "Complete",
        details: {
          left: [{ label: "Name", value: "Test Patient" }],
          right: [],
        },
        invoice: null,
        breakdown: {
          header: ["Type", "Kind", "Issuer", "Amount"],
          row: ["Payment", "Deposit", "Patient", "₹10.00"],
        },
        totals: [{ label: "Total", value: "₹10.00", strong: true }],
        note: code("RECEIPT"),
        footer: { left: "Generated by Dr. Test", right: null },
      } satisfies PaymentReceiptPrintContent,
      [code("RECEIPT")],
    ],
    [
      "resource-letter",
      {
        title: code("LETTER"),
        reference: "REF-1",
        date: "24 Nov 2026",
        from: { label: "From", value: "Test Hospital" },
        subject: code("SUBJECT"),
        intro: "Please arrange the following.",
        fields: [{ label: "Contact", value: code("CONTACT") }],
        reason: { label: "Reason", value: code("REASON") },
        status: { label: "Status", value: "Pending" },
        signatures: [
          { label: "Requested by", name: "Dr. Test", date: "24 Nov 2026" },
        ],
      } satisfies ResourceLetterPrintContent,
      [code("LETTER"), code("SUBJECT"), code("CONTACT"), code("REASON")],
    ],
  ];

  for (const [template, content, codes] of prints) {
    const pdf = await readPdf(await compile(template, content, "a5"));
    assertReadable(pdf);
    for (const value of codes) {
      assert.ok(
        pdf.text.includes(value),
        `${template}: "${value}" lost letters`,
      );
    }
  }
});
