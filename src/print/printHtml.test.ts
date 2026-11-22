import assert from "node:assert/strict";
import { test } from "node:test";

import { buildPrintHtml } from "@/print/printHtml";
import type { PrintLayout } from "@/print/types";

const A5 = { width: 419.53, height: 595.28 };

/** Shaped like the Typst renderer's output: every page stacked in one image. */
const SVG =
  `<svg class="typst-doc" viewBox="0 0 420 1192" xmlns="http://www.w3.org/2000/svg">` +
  `<style>svg { fill: none; }</style><defs class="glyph"><path id="g1"/></defs>` +
  `<g class="typst-page" transform="translate(0, 0)" data-page-width="420"><use href="#g1"/>one</g>` +
  `<g class="typst-page" transform="translate(0, 596)" data-page-width="420">two</g>` +
  `</svg>`;

function page(overrides: Partial<PrintLayout["page"]> = {}) {
  return {
    paper: "a5",
    flipped: false,
    margin: { top: 10, right: 10, bottom: 10, left: 10 },
    ...overrides,
  } satisfies PrintLayout["page"];
}

test("print HTML: sets the paper from the layout", () => {
  const html = buildPrintHtml({
    svg: SVG,
    pages: [A5, A5],
    page: page(),
    title: "Rx",
  });
  assert.match(html, /@page \{ size: A5 portrait; margin: 0; \}/);

  const landscape = buildPrintHtml({
    svg: SVG,
    pages: [A5, A5],
    page: page({ paper: "us-letter", flipped: true }),
    title: "Rx",
  });
  assert.match(landscape, /@page \{ size: letter landscape; margin: 0; \}/);
});

test("print HTML: one sheet per page, each at the top of its own image", () => {
  const html = buildPrintHtml({
    svg: SVG,
    pages: [A5, A5],
    page: page(),
    title: "Rx",
  });

  assert.equal(html.match(/<div class="page"/g)?.length, 2);
  assert.equal(
    html.match(/viewBox="0 0 419\.53 595\.28"/g)?.length,
    2,
    "each page's image has the page's own size",
  );
  assert.ok(!html.includes("translate(0, 596)"), "page 2 is still offset");
  // Glyphs are defined once, before the pages that use them.
  assert.equal(html.match(/<path id="g1"\/>/g)?.length, 1);
  assert.ok(html.indexOf('id="g1"') < html.indexOf('<div class="page"'));
  assert.ok(html.indexOf(">one</g>") < html.indexOf(">two</g>"));
});

test("print HTML: escapes the title", () => {
  const html = buildPrintHtml({
    svg: SVG,
    pages: [A5, A5],
    page: page(),
    title: "A & B <script>",
  });
  assert.ok(html.includes("<title>A &amp; B &lt;script&gt;</title>"));
});

test("print HTML: rejects an SVG whose pages don't match the document", () => {
  assert.throws(
    () => buildPrintHtml({ svg: SVG, pages: [A5], page: page(), title: "Rx" }),
    /expected 1 SVG pages, found 2/,
  );
});
