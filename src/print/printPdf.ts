import { isIOSDevice, sleep } from "@/Utils/utils";

/**
 * Resolves once the print dialog has closed. `print()` on an iframe returns
 * at once, but the open dialog takes focus; without a focus change this
 * resolves after 3 seconds.
 */
export async function waitForPrintDialogToClose() {
  const waitUntil = async (condition: () => boolean, timeoutMs: number) => {
    const end = Date.now() + timeoutMs;
    while (Date.now() < end) {
      if (condition()) return;
      await sleep(100);
    }
  };
  await waitUntil(() => !document.hasFocus(), 3000);
  await waitUntil(() => document.hasFocus(), 10 * 60_000);
}

/**
 * How a PDF is printed in this browser: a hidden `iframe` (Chromium, Firefox),
 * a `new-tab` PDF viewer (Safari and iOS, which can't print from an iframe),
 * or the OS `share` sheet (Android, where browsers can't display PDFs).
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

export function pdfFileName(title: string) {
  const name = title.replace(/[\\/:*?"<>|]+/g, "-").trim() || "document";
  return `${name}.pdf`;
}

function downloadPdf(url: string, fileName: string) {
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
