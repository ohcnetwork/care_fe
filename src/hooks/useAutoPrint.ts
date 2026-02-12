import { sleep } from "@/Utils/utils";
import { useEffect, useState } from "react";

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
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (enabled) {
      setIsProcessing(true);
      const timer = setTimeout(async () => {
        printWindow.print();
        // Give some time for the print dialog to appear before navigating back
        await sleep(300);
        setIsProcessing(false);
        window.history.go(-1);
      }, delay); // Delay to ensure content is rendered

      return () => clearTimeout(timer);
    }
  }, [enabled, printWindow]);

  return { isPrinting: isProcessing };
}
