import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

import { useAuthContext } from "@/hooks/useAuthUser";

const digitMaps: Record<string, number[][]> = {
  "0": [
    [1, 1, 1],
    [1, 0, 1],
    [1, 0, 1],
    [1, 0, 1],
    [1, 1, 1],
  ],
  "1": [
    [0, 0, 1],
    [0, 0, 1],
    [0, 0, 1],
    [0, 0, 1],
    [0, 0, 1],
  ],
  "2": [
    [1, 1, 1],
    [0, 0, 1],
    [1, 1, 1],
    [1, 0, 0],
    [1, 1, 1],
  ],
  "3": [
    [1, 1, 1],
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 1],
    [1, 1, 1],
  ],
  "4": [
    [1, 0, 1],
    [1, 0, 1],
    [1, 1, 1],
    [0, 0, 1],
    [0, 0, 1],
  ],
  "5": [
    [1, 1, 1],
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 1],
    [1, 1, 1],
  ],
  "6": [
    [1, 1, 1],
    [1, 0, 0],
    [1, 1, 1],
    [1, 0, 1],
    [1, 1, 1],
  ],
  "7": [
    [1, 1, 1],
    [0, 0, 1],
    [0, 0, 1],
    [0, 0, 1],
    [0, 0, 1],
  ],
  "8": [
    [1, 1, 1],
    [1, 0, 1],
    [1, 1, 1],
    [1, 0, 1],
    [1, 1, 1],
  ],
  "9": [
    [1, 1, 1],
    [1, 0, 1],
    [1, 1, 1],
    [0, 0, 1],
    [1, 1, 1],
  ],
  ":": [
    [0, 0, 0],
    [0, 1, 0],
    [0, 0, 0],
    [0, 1, 0],
    [0, 0, 0],
  ],
  "-": [
    [0, 0, 0],
    [0, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
    [0, 0, 0],
  ],
  "·": [
    [0, 0, 0],
    [0, 0, 0],
    [0, 1, 0],
    [0, 0, 0],
    [0, 0, 0],
  ],
};

const SegmentedDigit = ({ digit }: { digit: string }) => {
  const map = digitMaps[digit] || digitMaps["0"];
  return (
    <div className="inline-block mx-0.5">
      {map.map((row, rowIndex) => (
        <div key={rowIndex} className="flex">
          {row.map((cell, cellIndex) => (
            <div
              key={cellIndex}
              className={cn(
                "size-1.5 m-px",
                cell ? "bg-gray-400" : "bg-transparent",
              )}
            ></div>
          ))}
        </div>
      ))}
    </div>
  );
};

type SegmentedTimeProps = {
  timeStr: string;
  scaleFactor: number;
};

const SegmentedTime = ({ timeStr, scaleFactor }: SegmentedTimeProps) => (
  <div
    className="flex items-center justify-center transform origin-center"
    style={{ transform: `scale(${scaleFactor})` }}
  >
    {timeStr.split("").map((char, index) => (
      <div key={index}>
        <SegmentedDigit digit={char} />
      </div>
    ))}
  </div>
);

export default function SessionExpired() {
  const { signOut } = useAuthContext();
  const { t } = useTranslation();

  const [seconds, setSeconds] = useState(0);
  const [breathState, setBreathState] = useState<"in" | "out">("in");
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    toast.dismiss();
  }, []);

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const elapsedMs = now - startTimeRef.current;
      const elapsedSec = Math.floor(elapsedMs / 1000);
      setSeconds(elapsedSec); // Positive count
    };

    const timer = setInterval(tick, 1000);
    tick();

    const breathTimer = setInterval(() => {
      setBreathState((prev) => (prev === "in" ? "out" : "in"));
    }, 4000);

    return () => {
      clearInterval(timer);
      clearInterval(breathTimer);
    };
  }, []);

  // Format time string
  const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    let timeStr = "";
    if (hours > 0) {
      timeStr += `${String(hours).padStart(2, "0")}:`;
    }
    timeStr += `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    return timeStr;
  };

  const getScaleFactor = (timeStr: string): number => {
    const length = timeStr.length;
    if (length <= 5) return 1;
    if (length <= 8) return 0.75;
    return 0.6;
  };

  const timeStr = formatTime(seconds);
  const scaleFactor = getScaleFactor(timeStr);
  const shouldShowTime = seconds > 0;

  return (
    <div className="flex flex-col items-center justify-center w-full fixed inset-0 bg-white">
      <div className="relative flex items-center justify-center size-72 md:size-96">
        {/* Ripples */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute size-80 bg-emerald-400/20 rounded-full animate-ping-slow"></div>
          <div className="absolute size-64 bg-emerald-500/20 rounded-full animate-ping-medium"></div>
          <div className="absolute size-48 bg-emerald-600/20 rounded-full animate-ping-fast"></div>
        </div>

        {/* Timer Display */}
        <div className="absolute flex flex-col items-center justify-center size-40 p-4 bg-gray-50 rounded-full border border-white shadow-lg z-10">
          <div className="bg-gray-200 p-2 rounded-full shadow-inner mb-1 flex w-full items-center justify-center relative">
            <div className="flex-shrink min-w-0 scale-65">
              {seconds === 0 ? (
                <SegmentedTime timeStr="··:··" scaleFactor={scaleFactor} />
              ) : shouldShowTime ? (
                <SegmentedTime timeStr={timeStr} scaleFactor={scaleFactor} />
              ) : null}
            </div>
          </div>

          {/* Breathing Text */}
          <div className="text-xs text-center uppercase font-medium text-gray-400 mt-1 h-4 transition">
            {t("breathe")}{" "}
            <span className="block animate-fade">
              {breathState === "in" ? t("in") : t("out")}
            </span>
          </div>
        </div>
      </div>
      <div className="max-w-lg mx-auto text-center px-4">
        <h1 className="mt-2 text-xl md:text-4xl text-gray-950 font-bold">
          {t("welcome_back")}
        </h1>
        <p className="max-w-md mx-auto px-2 text-sm md:text-base mt-2 text-gray-600">
          {t("session_expired_message")}
        </p>
        <Button
          type="button"
          variant="primary"
          className="mt-6"
          onClick={signOut}
        >
          {t("log_in_again")}
        </Button>
      </div>
    </div>
  );
}
