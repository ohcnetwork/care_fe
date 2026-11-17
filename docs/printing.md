# Printing with Typst

Print documents (invoices, prescriptions, …) are being moved from the browser's print engine (`src/CAREUI/misc/PrintPreview.tsx`) to PDFs generated in the browser with [Typst](https://typst.app). The output is the same in every browser. Page size, margins, headers, watermarks and page numbers come from the facility's print template.

Status: the **invoice** has a Typst template. Turn it on with `REACT_ENABLE_TYPST_PRINT=true`. Other documents still use `PrintPreview`.

## How it works

```
page component ──▶ build<Doc>PrintContent()   display-ready data (strings, i18n done)
       │
       ▼
<TypstPrintPreview template="invoice" content=… facility=… templateSlug=…>
       │  useTypstPdf: fetch branding images, map the facility's print template
       │  to a layout (printLayout.ts), read CAREUI colours (printTheme.ts)
       ▼
web worker (typstWorker.ts): Typst compiler (WebAssembly) + fonts
       │  compiles src/print/templates/<template>.typ with /data.json
       ▼
PDF bytes ──▶ preview (pdf.js), Print / Download / Share
```

| Path                             | What it is                                                                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `src/print/typst/care.typ`       | Shared Typst library: page setup from the print template, header, watermarks, page numbers, `data-table`, `summary`, `print-meta`, … |
| `src/print/templates/<name>.typ` | One template per document, with `<name>.sample.json` for previews and tests.                                                         |
| `src/print/types.ts`             | The data contract between the app and `care.typ`.                                                                                    |
| `src/print/fonts/`               | Figtree and Geist Mono (CAREUI's fonts), plus Noto Sans Malayalam, Devanagari, Tamil and Kannada.                                    |
| `plugins/typstCompilerWasm.ts`   | Ships the compiler gzipped (see "Deployment").                                                                                       |

## Adding a document

1. Write `src/print/templates/<name>.typ`:

   ```typst
   #import "../typst/care.typ": *
   #let data = json(sys.inputs.at("data", default: "<name>.sample.json"))
   #show: document.with(data.layout)

   // data.content is whatever your builder returns
   ```

2. Add `<name>.sample.json` (`{ "layout": …, "content": … }`; copy the layout from `invoice.sample.json`).
3. Write a builder that turns API data into the template's content. Do all formatting there, not in Typst: translations (`t()`), dates, currency, names. See `src/pages/Facility/billing/invoice/invoicePrintData.ts`.
4. Render `<TypstPrintPreview>` behind `careConfig.typstPrint`. See `TypstInvoicePrint.tsx`.

`npm run test:unit` compiles every template with its sample data.

### Previewing templates

- **Editor:** install the [Tinymist](https://marketplace.visualstudio.com/items?itemName=myriad-dreamin.tinymist) VS Code extension and open a template. It previews live against the sample JSON. Install the fonts in `src/print/fonts/` locally, or the preview falls back to system fonts.
- **Command line:** `npm run print:render -- invoice` writes `invoice.pdf` with the app's compiler and fonts. Use `--data <file>` for other data and `--asset /assets/logo=<file>` for images.

### Writing Typst for CARE

- Sizes follow Tailwind: `px(14)` is `text-sm`; `text-size.sm`, `.xs`, … are defined. Lines are measured like CSS, so `stack(spacing: px(4))` matches `gap-1`.
- Colours: `gray(500)` matches `text-gray-500`; `palette("red", 600)` for others. Values come from the app's CSS variables, so they follow CAREUI.
- Insert data as values (`text(invoice.number)`, `[#invoice.number]`). Never `eval` data.
- Images and other files are passed as bytes at a virtual path (e.g. `/assets/qr-code.svg`). The compiler has no network access.

## Facility print templates

Everything in `PrintTemplate` (facility settings → print templates) is applied:

| Setting                | Effect                                                                                                      |
| ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| Page size, orientation | Paper size of the PDF. A4, A5, Letter, Legal.                                                               |
| Margins (mm)           | Page margins. Default 10mm.                                                                                 |
| Auto print             | Opens the print dialog as soon as the PDF is ready (Chromium and Firefox; elsewhere the user clicks Print). |
| Logo, size, alignment  | Header logo. Without one, CARE's logo.                                                                      |
| Header image           | Replaces the header.                                                                                        |
| Footer image           | Bottom of the last page.                                                                                    |
| Watermark              | Tiled text on every page.                                                                                   |

A document can also show a status watermark (e.g. "Cancelled").

**Images must allow cross-origin requests.** Branding images are downloaded into the PDF, so their host must send CORS headers. An `<img>` didn't need them. Images that fail to load are left out and the preview shows a warning.

## Printing

| Browser                         | Print button                                                            |
| ------------------------------- | ----------------------------------------------------------------------- |
| Chrome, Edge, Firefox (desktop) | Print dialog for the PDF, from a hidden iframe.                         |
| Safari, iOS                     | Opens the PDF in a new tab, with the browser's print and share actions. |
| Android                         | Share sheet (save, print via an app), or download.                      |

Ctrl/Cmd+P prints the PDF, not the page. Paper size is set by the PDF, but printers can still scale it ("Fit to page"). For exact sizes, users choose "Actual size".

## Deployment

- **Size:** the compiler is ~28 MB of WebAssembly. Builds ship it gzipped (~11 MB) and the worker decompresses it. This keeps it under Cloudflare Pages' 25 MiB file limit. Fonts are ~1.4 MB. Both load on the first print only, with hashed file names, so browsers cache them.
- **Content-Security-Policy:** if a deployment enforces a CSP, it needs `script-src 'wasm-unsafe-eval'` (compiling WebAssembly), `worker-src 'self'`, `frame-src blob:` (printing) and `connect-src` for any hosts serving branding images.
