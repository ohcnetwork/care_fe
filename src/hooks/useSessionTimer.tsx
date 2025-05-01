import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type BreathState = "in" | "out";

export function useSessionTimer() {
  const [seconds, setSeconds] = useState(0);
  const [breathState, setBreathState] = useState<BreathState>("in");
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    toast.dismiss();

    const tick = () => {
      const now = Date.now();
      const elapsedMs = now - startTimeRef.current;
      const elapsedSec = Math.floor(elapsedMs / 1000);
      setSeconds(-elapsedSec); // Negative count
    };

    const timer = setInterval(tick, 1000);
    tick();

    const breathTimer = setInterval(() => {
      setBreathState((prev) => (prev === "in" ? "out" : "in"));
    }, 4000); // Sync with ripple cycle

    return () => {
      clearInterval(timer);
      clearInterval(breathTimer);
    };
  }, []);

  const formatTime = (totalSeconds: number): string => {
    const isNegative = totalSeconds < 0;
    const absSeconds = Math.abs(totalSeconds);

    if (absSeconds >= 3600) {
      const hours = Math.floor(absSeconds / 3600);
      const minutes = Math.floor((absSeconds % 3600) / 60);
      const seconds = absSeconds % 60;
      return `${isNegative ? "-" : " "}${String(hours).padStart(
        2,
        "0",
      )}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
        2,
        "0",
      )}`;
    } else {
      const minutes = Math.floor(absSeconds / 60);
      const seconds = absSeconds % 60;
      return `${isNegative ? "-" : " "}${String(minutes).padStart(
        2,
        "0",
      )}:${String(seconds).padStart(2, "0")}`;
    }
  };

  const getScaleFactor = (timeStr: string): number => {
    const length = timeStr.length;
    if (length <= 5) return 1;
    if (length <= 8) return 0.75;
    return 0.6;
  };

  const timeStr = formatTime(seconds);
  const scaleFactor = getScaleFactor(timeStr);
  const shouldShowTime = seconds < 0;

  return {
    seconds,
    breathState,
    timeStr,
    scaleFactor,
    shouldShowTime,
  };
}
