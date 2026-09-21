import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { PrintPage } from "../../src/CAREUI/misc/PrintPage";
import { getPrintPage } from "../../src/Utils/print";
import type { PrintTemplate } from "../../src/types/facility/printTemplate";

// Exercise the real layout and global print rules without patient/backend fixtures.
const css = ["src/style/index.css", "src/CAREUI/misc/print.css"]
  .map((path) =>
    readFileSync(path, "utf8").replace(/^@(?:import|config).*;$/gm, ""),
  )
  .join("\n");

for (const size of ["A4", "A5", "Letter", "Legal"] as const) {
  for (const orientation of ["portrait", "landscape"] as const) {
    for (const rowCount of [1, 80]) {
      test(`${size} ${orientation}, ${rowCount} rows: branding without overlap or blank pages`, async ({
        page,
      }) => {
        const template: PrintTemplate = {
          slug: "default",
          page: {
            size,
            orientation,
            margin: { top: 10, right: 10, bottom: 10, left: 10 },
          },
        };
        const markup = renderToStaticMarkup(
          createElement(PrintPage, {
            template,
            header: createElement(
              "div",
              { style: { height: 40 } },
              "Facility header",
            ),
            footer: createElement(
              "div",
              { style: { height: 30 } },
              "Facility footer",
            ),
            children: Array.from({ length: rowCount }, (_, index) =>
              createElement(
                "p",
                {
                  key: index,
                  style: { height: 40, margin: 0, breakInside: "avoid" },
                },
                `Clinical row ${index}`,
              ),
            ),
          }),
        );
        await page.setContent(
          `<style>${css}</style><div style="transform:scale(0.6);overflow:auto">
          <nav>Do not print navigation</nav>
          <div id="section-to-print">${markup}</div>
        </div>`,
        );
        await page.emulateMedia({ media: "print" });
        // Static rendering has no effects; use the same measured footer reservation
        // that PrintPage's ResizeObserver and beforeprint listener supply in the app.
        await page.locator(".print-page").evaluate((node) => {
          const footer = node.querySelector<HTMLElement>(".print-page-footer")!;
          (node as HTMLElement).style.setProperty(
            "--print-footer-height",
            `${footer.offsetHeight}px`,
          );
        });
        const pdf = await getDocument({
          data: new Uint8Array(await page.pdf({ preferCSSPageSize: true })),
          useSystemFonts: true,
        }).promise;
        if (rowCount === 1) {
          expect(pdf.numPages).toBe(1);
        } else {
          expect(pdf.numPages).toBeGreaterThan(1);
        }
        const rows: string[] = [];
        const paper = getPrintPage(template);
        for (let index = 1; index <= pdf.numPages; index++) {
          const pdfPage = await pdf.getPage(index);
          const viewport = pdfPage.getViewport({ scale: 1 });
          expect(viewport.width).toBeCloseTo((paper.width / 25.4) * 72, 0);
          expect(viewport.height).toBeCloseTo((paper.height / 25.4) * 72, 0);
          const { items } = await pdfPage.getTextContent();
          const text = items.filter((item) => "str" in item);
          expect(text.some((item) => item.str === "Facility header")).toBe(
            true,
          );
          const footer = text.find((item) => item.str === "Facility footer");
          expect(footer).toBeDefined();
          expect(text.some((item) => item.str.includes("Do not print"))).toBe(
            false,
          );
          for (const item of text.filter((item) =>
            item.str.startsWith("Clinical row"),
          )) {
            rows.push(item.str);
            // PDF coordinates increase upwards from the bottom of the page.
            expect(item.transform[5]).toBeGreaterThan(
              footer!.transform[5] + 12,
            );
          }
        }
        expect(rows).toEqual(
          Array.from(
            { length: rowCount },
            (_, index) => `Clinical row ${index}`,
          ),
        );
        await pdf.destroy();
      });
    }
  }
}
