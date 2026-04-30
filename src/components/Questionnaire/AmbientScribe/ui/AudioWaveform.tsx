import { cn } from "@/lib/utils";

interface AudioWaveformProps {
  waveform: number[];
  active: boolean;
  className?: string;
}

/**
 * Animated vertical bar meter driven by `useAudioCapture`. Each value is
 * 0..1 and arrives pre-mirrored, so the meter is symmetric around the
 * vertical midline (left half mirrors right half).
 *
 * Bars are vertically centered (grow equally up and down), use a primary
 * gradient, and the whole strip is masked at the edges with a horizontal
 * fade so motion feels elegant rather than abruptly cropped.
 */
export function AudioWaveform({
  waveform,
  active,
  className,
}: AudioWaveformProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center gap-[3px] h-12 w-full",
        // Soft horizontal fade at both edges — the meter dissolves into
        // the surrounding card instead of stopping at a hard line.
        "[mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]",
        className,
      )}
    >
      {waveform.map((v, i) => {
        const amp = active ? Math.max(0.06, v) : 0.06;
        return (
          <span
            key={i}
            aria-hidden
            className={cn(
              "w-[3px] rounded-full",
              "transition-[height,opacity] duration-150 ease-out",
              "bg-linear-to-b from-primary-300 via-primary-500 to-primary-600",
              active ? "opacity-95" : "opacity-30",
            )}
            style={{
              height: `${Math.round(amp * 100)}%`,
              minHeight: "3px",
            }}
          />
        );
      })}
    </div>
  );
}
