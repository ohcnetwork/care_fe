import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { useAuthContext } from "@/hooks/useAuthUser";
import { useSessionTimer } from "@/hooks/useSessionTimer";

// Define digitMaps outside the component to prevent recreation on each render
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

export default function RippleDigitalTimer() {
  const { signOut } = useAuthContext();
  const { t } = useTranslation();

  useEffect(() => {
    toast.dismiss();
  }, []);

  const { seconds, breathState, timeStr, scaleFactor, shouldShowTime } =
    useSessionTimer();

  const renderSegmentedDigit = (digit: string) => {
    const map = digitMaps[digit] || digitMaps["0"];

    return (
      <div className="inline-block mx-0.5">
        {map.map((row, rowIndex) => (
          <div key={rowIndex} className="flex">
            {row.map((cell, cellIndex) => (
              <div
                key={cellIndex}
                className={`w-1.5 h-1.5 m-px ${
                  cell ? "bg-gray-400" : "bg-transparent"
                }`}
              ></div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  const renderSegmentedTime = (timeStr: string) => (
    <div
      className={cn("flex items-center justify-center transform origin-center")}
      style={{ transform: `scale(${scaleFactor})` }}
    >
      {timeStr.split("").map((char, index) => (
        <div key={index}>{renderSegmentedDigit(char)}</div>
      ))}
    </div>
  );

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center w-full h-screen bg-white",
      )}
    >
      <div className="relative flex items-center justify-center w-72 h-72 md:w-96 md:h-96">
        {/* Ripples */}
        <div
          className={cn("absolute inset-0 flex items-center justify-center")}
        >
          <div
            className={cn(
              "absolute w-80 h-80 bg-emerald-400/20 rounded-full animate-ping-slow",
            )}
          ></div>
          <div
            className={cn(
              "absolute w-64 h-64 bg-emerald-500/20 rounded-full animate-ping-medium",
            )}
          ></div>
          <div
            className={cn(
              "absolute w-48 h-48 bg-emerald-600/20 rounded-full animate-ping-fast",
            )}
          ></div>
        </div>

        {/* Timer Display */}
        <div
          className={cn(
            "absolute flex flex-col items-center justify-center w-40 h-40 p-4 bg-gray-50 rounded-full border border-white shadow-lg z-10",
          )}
        >
          <div
            className={cn(
              "bg-gray-200 p-2 rounded-full shadow-inner mb-1 flex w-full items-center justify-center relative",
            )}
          >
            <div className={cn("flex-shrink min-w-0 scale-65")}>
              {seconds === 0
                ? renderSegmentedTime("··:··")
                : shouldShowTime
                  ? renderSegmentedTime(timeStr)
                  : null}
            </div>
          </div>

          {/* Breathing Text */}
          <div
            className={cn(
              "text-xs text-center uppercase font-medium text-gray-400 mt-1 h-4 transition",
            )}
          >
            {t("Breathe")}{" "}
            <span className={cn("block animate-fade")}>{t(breathState)}</span>
          </div>
        </div>
      </div>
      <div className={cn("max-w-lg mx-auto text-center px-4")}>
        <h1 className={cn("mt-2 text-xl md:text-4xl text-gray-950 font-bold")}>
          {t("Welcome back!")}
        </h1>
        <p
          className={cn(
            "max-w-md mx-auto px-2 text-sm md:text-base mt-2 text-gray-600",
          )}
        >
          {t(
            "It looks like your session timed out for a moment. Take a quick breather, then log in again to continue.",
          )}
        </p>
        <button
          type="button"
          onClick={signOut}
          className={cn(
            "mt-6 transition duration-300 ease-in-out rounded-md select-none",
            "bg-emerald-700 px-3.5 py-2.5 text-sm font-semibold text-white",
            "shadow-sm hover:bg-emerald-600 focus-visible:outline-2",
            "focus-visible:outline-offset-2 focus-visible:outline-emerald-800",
          )}
        >
          {t("Log in again")}
        </button>
      </div>

      {/* Animations are now defined in the Tailwind config */}
    </div>
  );
}
