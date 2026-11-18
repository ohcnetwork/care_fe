import { sleep } from "@/Utils/utils";

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
 * How a PDF is printed in this browser: a hidden `iframe` (desktop browsers),
 * the OS `share` sheet (touch devices that can share files, and whose share
 * sheet includes Print), or a `new-tab` PDF viewer (other touch devices).
 */
export type PdfPrintMethod = "iframe" | "share" | "new-tab";

export function getPdfPrintMethod(): PdfPrintMethod {
  if (!matchMedia("(pointer: coarse)").matches) return "iframe";
  return canSharePdf() ? "share" : "new-tab";
}

function pdfFile(pdf: Uint8Array, title: string) {
  const name = title.replace(/[\\/:*?"<>|]+/g, "-").trim() || "document";
  return new File([pdf as BlobPart], `${name}.pdf`, {
    type: "application/pdf",
  });
}

function canSharePdf() {
  return !!navigator.canShare?.({ files: [pdfFile(new Uint8Array(), "a")] });
}

export async function sharePdf(pdf: Uint8Array, title: string) {
  try {
    await navigator.share({ files: [pdfFile(pdf, title)], title });
  } catch {
    // Dismissing the share sheet rejects with AbortError.
  }
}
