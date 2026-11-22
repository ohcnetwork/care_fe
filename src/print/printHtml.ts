import type { PrintLayout, TypstPaper } from "@/print/types";

/** A page's size in points, as the Typst renderer reports it. */
export interface PrintPageSize {
  width: number;
  height: number;
}

/** CSS `@page` names for the papers; a printer matches them to its trays. */
const CSS_PAPERS: Record<TypstPaper, string> = {
  a4: "A4",
  a5: "A5",
  "us-letter": "letter",
  "us-legal": "legal",
};

export const PRINT_HTML_TYPE = "application/xhtml+xml";

const PAGE_START = '<g class="typst-page"';
const PAGE_OFFSET = /^<g class="typst-page" transform="translate\([^)]*\)"/;

const NAMESPACES = [
  'xmlns="http://www.w3.org/2000/svg"',
  'xmlns:xlink="http://www.w3.org/1999/xlink"',
  'xmlns:h5="http://www.w3.org/1999/xhtml"',
].join(" ");

function escapeXml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Splits the Typst renderer's SVG, which stacks every page in one image, into
 * what the pages share (styles, glyphs, patterns) and each page's content.
 */
function splitPages(svg: string, count: number) {
  const starts: number[] = [];
  for (
    let at = svg.indexOf(PAGE_START);
    at !== -1;
    at = svg.indexOf(PAGE_START, at + 1)
  ) {
    starts.push(at);
  }
  const end = svg.lastIndexOf("</svg>");
  if (starts.length !== count || count === 0 || end === -1) {
    throw new Error(
      `Print: expected ${count} SVG pages, found ${starts.length}`,
    );
  }

  return {
    shared: svg.slice(svg.indexOf(">") + 1, starts[0]),
    pages: starts.map((start, i) =>
      svg
        .slice(start, starts[i + 1] ?? end)
        // Each page gets its own image, so it no longer sits below the others.
        .replace(PAGE_OFFSET, PAGE_START),
    ),
  };
}

/**
 * A document that prints the Typst pages on the layout's paper. Unlike a PDF,
 * whose paper the print dialog chooses, a web page sets it with `@page`: the
 * browser then prints on that paper whatever the last print used.
 *
 * It is XHTML because the SVG's text layer uses XML namespaces.
 */
export function buildPrintHtml({
  svg,
  pages,
  page,
  title,
}: {
  /** From the Typst renderer's `renderSvg`. */
  svg: string;
  pages: PrintPageSize[];
  page: PrintLayout["page"];
  title: string;
}) {
  const { shared, pages: bodies } = splitPages(svg, pages.length);
  const orientation = page.flipped ? "landscape" : "portrait";

  const sheets = bodies.map((body, i) => {
    const { width, height } = pages[i];
    return (
      `<div class="page" style="width:${width}pt;height:${height}pt">` +
      `<svg ${NAMESPACES} viewBox="0 0 ${width} ${height}">${body}</svg>` +
      `</div>`
    );
  });

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<html xmlns="http://www.w3.org/1999/xhtml">`,
    `<head>`,
    `<title>${escapeXml(title)}</title>`,
    `<style>`,
    `@page { size: ${CSS_PAPERS[page.paper]} ${orientation}; margin: 0; }`,
    `html, body { margin: 0; padding: 0; background: #fff; }`,
    `.shared { position: absolute; width: 0; height: 0; }`,
    `.page { overflow: hidden; break-after: page; break-inside: avoid; }`,
    `.page:last-child { break-after: auto; }`,
    `.page > svg { display: block; width: 100%; height: 100%; }`,
    `</style>`,
    `</head>`,
    `<body>`,
    `<svg ${NAMESPACES} class="shared" aria-hidden="true">${shared}</svg>`,
    ...sheets,
    `</body>`,
    `</html>`,
  ].join("\n");
}
