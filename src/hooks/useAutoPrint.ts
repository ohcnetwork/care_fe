import useAppHistory from "@/hooks/useAppHistory";
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
  const { goBack } = useAppHistory();
  useEffect(() => {
    if (enabled) {
      const timer = setTimeout(async () => {
        printWindow.print();
        await sleep(300);
        goBack();
      }, delay); // Delay to ensure content is rendered

      return () => clearTimeout(timer);
    }
  }, [enabled, printWindow]);
}
