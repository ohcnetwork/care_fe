import { isIOSDevice } from "@/Utils/utils";

/**
 * How a generated PDF is printed in this browser:
 * - `iframe`: load it in a hidden iframe and open the print dialog from there
 *   (Chromium, Firefox).
 * - `new-tab`: open it in the browser's own PDF viewer, which has print and
 *   share actions (Safari, all iOS browsers). Safari doesn't reliably print
 *   PDFs from an iframe.
 * - `share`: hand the file to the OS share sheet (Android, where browsers
 *   can't display PDFs). Falls back to downloading it.
 */
export type PdfPrintMethod = "iframe" | "new-tab" | "share";

export function getPdfPrintMethod(): PdfPrintMethod {
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return "share";

  // iPadOS reports itself as a Mac.
  const isIPad = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  const isSafari =
    /Safari/.test(ua) && !/Chrome|Chromium|Edg|OPR|Firefox/.test(ua);
  if (isIOSDevice || isIPad || isSafari) return "new-tab";

  return "iframe";
}

/** A file name for the PDF, e.g. "Invoice INV-001.pdf". */
export function pdfFileName(title: string) {
  const name = title.replace(/[\\/:*?"<>|]+/g, "-").trim() || "document";
  return `${name}.pdf`;
}

export function downloadPdf(url: string, fileName: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
}

/** Opens the OS share sheet with the PDF, or downloads it if sharing files isn't supported. */
export async function sharePdf(pdf: Uint8Array, url: string, fileName: string) {
  const file = new File([pdf as BlobPart], fileName, {
    type: "application/pdf",
  });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: fileName });
      return;
    } catch (error) {
      // Closing the share sheet isn't an error.
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
  }
  downloadPdf(url, fileName);
}
