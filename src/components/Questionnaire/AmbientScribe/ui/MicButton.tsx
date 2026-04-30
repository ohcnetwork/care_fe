import { Loader2, Mic, MicOff } from "lucide-react";

import { cn } from "@/lib/utils";

import type { ScribeStatus } from "@/components/Questionnaire/AmbientScribe/types";

interface MicButtonProps {
  status: ScribeStatus;
  onClick: () => void;
  disabled?: boolean;
  ariaLabel: string;
  size?: "sm" | "lg";
}

export function MicButton({
  status,
  onClick,
  disabled,
  ariaLabel,
  size = "lg",
}: MicButtonProps) {
  const isListening = status === "listening";
  const isConnecting = status === "connecting";
  const isError = status === "error";

  const base = size === "lg" ? "size-20" : "size-12";
  const inner = size === "lg" ? "size-7" : "size-4";

  return (
    <button
      type="button"
      disabled={disabled || isConnecting}
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "relative rounded-full flex items-center justify-center transition-all duration-200",
        "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2",
        base,
        isListening
          ? "bg-linear-to-br from-primary-500 to-primary-700 text-white shadow-lg shadow-primary-500/30"
          : isError
            ? "bg-red-50 text-red-700 border border-red-300"
            : "bg-gray-50 text-gray-700 border border-gray-300 hover:bg-gray-100",
        disabled && "opacity-60 cursor-not-allowed",
      )}
    >
      {isListening && (
        <>
          <span
            aria-hidden
            className="absolute inset-0 rounded-full bg-primary-500/40 animate-ping"
          />
          <span
            aria-hidden
            className="absolute inset-[-6px] rounded-full border-2 border-primary-400/60 animate-pulse"
          />
        </>
      )}
      {isConnecting ? (
        <Loader2 className={cn(inner, "animate-spin")} />
      ) : isError ? (
        <MicOff className={inner} />
      ) : (
        <Mic className={cn(inner, "relative z-10")} />
      )}
    </button>
  );
}
