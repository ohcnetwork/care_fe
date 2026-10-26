import assert from "node:assert/strict";
import { test } from "node:test";

import { getPrintPage, resolvePrintTemplate } from "@/Utils/print";
import type { PrintTemplate } from "@/types/facility/printTemplate";

const defaults: PrintTemplate = {
  slug: "default",
  page: {
    size: "A5",
    orientation: "landscape",
    margin: { top: 12, right: 8, bottom: 14, left: 9 },
  },
  branding: {
    logo: { url: "/logo.svg", alignment: "left", width: 80 },
    header_image: { url: "/header.svg", height: 60 },
    footer_image: { url: "/footer.svg", height: 40 },
  },
  print_setup: { auto_print: true },
  watermark: { enabled: true, text: "Facility", opacity: 0.1 },
};

test("missing document templates fall back to the facility default", () => {
  assert.equal(resolvePrintTemplate(undefined, "invoice"), undefined);
  assert.equal(resolvePrintTemplate([], "invoice"), undefined);
  assert.equal(resolvePrintTemplate([defaults], "invoice"), defaults);
  assert.equal(resolvePrintTemplate([defaults], "default"), defaults);
});

test("document settings inherit global page settings and branding without mutation", () => {
  const original = structuredClone(defaults);
  const result = resolvePrintTemplate(
    [
      defaults,
      {
        slug: "invoice",
        page: { orientation: "portrait" },
        branding: { logo: { url: "/invoice.svg", alignment: "right" } },
      },
    ],
    "invoice",
  );
  assert.deepEqual(result?.page, { ...defaults.page, orientation: "portrait" });
  assert.deepEqual(result?.branding, {
    ...defaults.branding,
    logo: { url: "/invoice.svg", alignment: "right", width: 80 },
  });
  assert.deepEqual(result?.print_setup, defaults.print_setup);
  assert.deepEqual(result?.watermark, defaults.watermark);
  assert.deepEqual(defaults, original);
});

test("explicit false, zero, and empty branding URLs override defaults", () => {
  const result = resolvePrintTemplate(
    [
      defaults,
      {
        slug: "invoice",
        print_setup: { auto_print: false },
        watermark: { enabled: false, opacity: 0 },
        branding: { header_image: { url: "" } },
        page: { margin: { top: 0, right: 0, bottom: 0, left: 0 } },
      },
    ],
    "invoice",
  );
  assert.equal(result?.print_setup?.auto_print, false);
  assert.equal(result?.watermark?.enabled, false);
  assert.equal(result?.watermark?.opacity, 0);
  assert.equal(result?.branding?.header_image?.url, "");
  assert.deepEqual(getPrintPage(result).margin, {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });
});

test("document templates also work without a global default", () => {
  const template: PrintTemplate = { slug: "invoice", page: { size: "Legal" } };
  assert.equal(resolvePrintTemplate([template], "invoice"), template);
  assert.equal(resolvePrintTemplate([template], "prescription"), undefined);
});

test("paper dimensions and printable area use physical units", () => {
  assert.deepEqual(
    [
      getPrintPage(defaults).width,
      getPrintPage(defaults).height,
      getPrintPage(defaults).contentWidth,
      getPrintPage(defaults).contentHeight,
    ],
    [210, 148, 193, 122],
  );
  assert.match(getPrintPage(defaults).style, /size: A5 landscape/);
  assert.match(getPrintPage(defaults).style, /margin: 12mm 8mm 14mm 9mm/);
  assert.equal(getPrintPage().contentHeight, 277);
  assert.equal(
    getPrintPage({ slug: "default", page: { size: "Letter" } }).height,
    279.4,
  );
  assert.equal(
    getPrintPage({ slug: "default", page: { size: "Legal" } }).height,
    355.6,
  );
});

test("invalid stored page settings cannot inject CSS or create negative printable areas", () => {
  const template = {
    slug: "default",
    page: {
      size: "A4; } body { display: none",
      orientation: "invalid",
      margin: { top: NaN, right: 500, bottom: -5, left: Infinity },
    },
  } as unknown as PrintTemplate;
  const page = getPrintPage(template);
  assert.equal(page.contentWidth, 190);
  assert.equal(page.contentHeight, 277);
  assert.equal(
    page.style,
    "@media print { @page { size: A4 portrait; margin: 10mm 10mm 10mm 10mm; } }",
  );
});

test("document fallback page settings never override facility configuration", () => {
  const chartPage = {
    size: "A4",
    orientation: "landscape",
    margin: { top: 6, right: 6, bottom: 6, left: 6 },
  } as const;
  assert.match(getPrintPage(undefined, chartPage).style, /A4 landscape/);
  assert.match(getPrintPage(defaults, chartPage).style, /A5 landscape/);
  assert.deepEqual(
    getPrintPage(defaults, chartPage).margin,
    defaults.page?.margin,
  );
});
