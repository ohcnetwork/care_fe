import assert from "node:assert/strict";
import { test } from "node:test";

import type { TFunction } from "i18next";

import type { FacilityRead } from "@/types/facility/facility";
import type { PrintTemplate } from "@/types/facility/printTemplate";

import {
  type BrandingAsset,
  buildPrintLayout,
  getBrandingAssetUrls,
} from "./printLayout";

const t = ((key: string, options?: Record<string, string>) =>
  key === "page_x_of_y"
    ? `Page ${options?.current} of ${options?.total}`
    : key) as unknown as TFunction;

const facility = (templates: PrintTemplate[] = []) =>
  ({
    name: "Taluk Hospital",
    address: "MC Road\nKottayam",
    phone_number: "",
    print_templates: templates,
  }) as unknown as FacilityRead;

const layout = (
  templates: PrintTemplate[],
  loaded: BrandingAsset[] = [],
  extra: Partial<Parameters<typeof buildPrintLayout>[0]> = {},
) =>
  buildPrintLayout({
    facility: facility(templates),
    templateSlug: "invoice",
    title: "Invoice 1",
    lang: "en",
    loadedAssets: new Set(loaded),
    t,
    ...extra,
  });

test("without a print template: A4 portrait, 10mm margins, default logo on the right", () => {
  const result = layout([], ["logo"]);
  assert.deepEqual(result.page, {
    paper: "a4",
    flipped: false,
    margin: { top: 10, right: 10, bottom: 10, left: 10 },
  });
  assert.deepEqual(result.header?.logo, {
    path: "/assets/logo",
    width: null,
    height: null,
    alignment: "right",
  });
  assert.deepEqual(result.header?.facility, {
    name: "Taluk Hospital",
    address: "MC Road\nKottayam",
    phone: null,
  });
  assert.equal(result.watermark, null);
  assert.equal(result.labels.page_x_of_y, "Page {current} of {total}");
});

test("applies the matching template's page, logo and watermark settings", () => {
  const result = layout(
    [
      { slug: "default", page: { size: "A4" } },
      {
        slug: "invoice",
        page: {
          size: "A5",
          orientation: "landscape",
          margin: { top: 5, right: 6, bottom: 7, left: 8 },
        },
        branding: {
          logo: { url: "https://x/logo.png", width: 120, alignment: "left" },
        },
        watermark: { enabled: true, text: "COPY", opacity: 4, rotation: 15 },
      },
    ],
    ["logo"],
  );
  assert.deepEqual(result.page, {
    paper: "a5",
    flipped: true,
    margin: { top: 5, right: 6, bottom: 7, left: 8 },
  });
  assert.deepEqual(result.header?.logo, {
    path: "/assets/logo",
    width: 120,
    height: null,
    alignment: "left",
  });
  // Opacity is clamped to 0–1.
  assert.deepEqual(result.watermark, {
    text: "COPY",
    opacity: 1,
    rotation: 15,
  });
});

test("falls back to the default template", () => {
  const result = layout([{ slug: "default", page: { size: "Legal" } }]);
  assert.equal(result.page.paper, "us-legal");
});

test("leaves out images that didn't load", () => {
  const result = layout([
    {
      slug: "invoice",
      branding: {
        header_image: { url: "https://x/header.png", height: 80 },
        footer_image: { url: "https://x/footer.png" },
      },
    },
  ]);
  assert.equal(result.header?.image, null);
  assert.equal(result.header?.logo, null);
  assert.equal(result.footer_image, null);
});

test("disabled or empty watermarks are left out", () => {
  assert.equal(
    layout([{ slug: "invoice", watermark: { enabled: false, text: "X" } }])
      .watermark,
    null,
  );
  assert.equal(
    layout([{ slug: "invoice", watermark: { enabled: true, text: "" } }])
      .watermark,
    null,
  );
});

test("status watermark defaults to red; unknown languages fall back to English", () => {
  const result = layout([], [], {
    statusWatermark: { text: "Draft" },
    lang: "en-US",
  });
  assert.deepEqual(result.status_watermark, { text: "Draft", color: "red" });
  assert.equal(result.lang, "en");
});

test("branding images to fetch", () => {
  const withHeader = facility([
    {
      slug: "invoice",
      branding: {
        logo: { url: "https://x/logo.png", alignment: "right" },
        header_image: { url: "https://x/header.png" },
        footer_image: { url: "https://x/footer.png" },
      },
    },
  ]);
  // A header image replaces the logo.
  assert.deepEqual(
    getBrandingAssetUrls({
      facility: withHeader,
      templateSlug: "invoice",
      defaultLogoUrl: "/care.svg",
    }),
    {
      headerImage: "https://x/header.png",
      footerImage: "https://x/footer.png",
    },
  );
  // A hidden header needs only the footer image.
  assert.deepEqual(
    getBrandingAssetUrls({
      facility: withHeader,
      templateSlug: "invoice",
      hideFacilityHeader: true,
    }),
    { footerImage: "https://x/footer.png" },
  );
  assert.deepEqual(
    getBrandingAssetUrls({
      facility: facility(),
      templateSlug: "invoice",
      defaultLogoUrl: "/care.svg",
    }),
    { logo: "/care.svg" },
  );
});
