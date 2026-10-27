import { isTouchDevice } from "@/Utils/utils";
import { useEffect, useState } from "react";

export interface AutoPrintOptions {
  enabled?: boolean;
  delay?: number;
  window?: Window;
}

const RETURN_COUNTDOWN_SECONDS = 5;

export default function useAutoPrint({
  enabled = true,
  delay = 300,
  window: printWindow = window,
}: AutoPrintOptions) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCountdownVisible, setIsCountdownVisible] = useState(true);

  useEffect(() => {
    if (!enabled) {
      setIsProcessing(false);
      setCountdown(null);
      return;
    }

    let countdownTimer: ReturnType<typeof setInterval> | undefined;

    setIsProcessing(true);
    setCountdown(null);
    setIsCountdownVisible(true);

    const printTimer = setTimeout(() => {
      printWindow.print();

      if (isTouchDevice) {
        setIsProcessing(false);
        return;
      }

      setCountdown(RETURN_COUNTDOWN_SECONDS);

      let remaining = RETURN_COUNTDOWN_SECONDS;

      countdownTimer = setInterval(() => {
        remaining -= 1;

        if (remaining <= 0) {
          if (countdownTimer) {
            clearInterval(countdownTimer);
          }

          setCountdown(0);
          setIsProcessing(false);
          printWindow.history.go(-1);
          return;
        }

        setCountdown(remaining);
      }, 1000);
    }, delay);

    return () => {
      clearTimeout(printTimer);

      if (countdownTimer) {
        clearInterval(countdownTimer);
      }
    };
  }, [enabled, delay, printWindow]);

  return {
    isPrinting: isProcessing,
    countdown,
    isCountdownVisible,
    dismissCountdown: () => setIsCountdownVisible(false),
  };
}
