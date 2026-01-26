import { useEffect } from "react";

interface Options {
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
  delay = 1000,
  window: printWindow = window,
}: Options) {
  useEffect(() => {
    if (enabled) {
      const timer = setTimeout(() => {
        printWindow.print();
      }, delay); // Delay to ensure content is rendered

      return () => clearTimeout(timer);
    }
  }, [enabled, printWindow]);
}
