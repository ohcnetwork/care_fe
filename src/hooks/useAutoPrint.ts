import { sleep } from "@/Utils/utils";
import { useEffect } from "react";

export interface AutoPrintOptions {
  enabled?: boolean;
  delay?: number;
  window?: Window;
}

/**
 * React hook to automatically trigger window.print() after a delay
 *
 * Usage:
 * ```
 * useAutoPrint({ enabled: !isLoading, delay: 1000 });
 * ```
 */
export default function useAutoPrint({
  enabled = true,
  delay = 300,
  window: printWindow = window,
}: AutoPrintOptions) {
  useEffect(() => {
    if (enabled) {
      const timer = setTimeout(async () => {
        printWindow.print();
        await sleep(300);
        window.history.go(-1);
      }, delay); // Delay to ensure content is rendered

      return () => clearTimeout(timer);
    }
  }, [enabled, printWindow]);
}
