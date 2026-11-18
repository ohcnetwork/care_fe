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
 * How a PDF is printed in this browser: a hidden `iframe` (desktop browsers), or
 * a `new-tab` PDF viewer (touch-first devices such as iPhone, iPad and Android,
 * which can't print from an iframe).
 */
export type PdfPrintMethod = "iframe" | "new-tab";

export function getPdfPrintMethod(): PdfPrintMethod {
  if (matchMedia("(pointer: coarse)").matches) return "new-tab";
  return "iframe";
}
