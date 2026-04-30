import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

interface SessionTimerProps {
  /** Wall-clock ms when the session started. Falsy → renders 00:00 muted. */
  startedAt?: number;
  className?: string;
}

function formatMmSs(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const mm = String(Math.floor(safe / 60)).padStart(2, "0");
  const ss = String(safe % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

/**
 * Renders an mm:ss elapsed counter for the current scribe session. Polls
 * once a second while a session is active; renders a muted 00:00 when no
 * session has started so the panel layout doesn't shift.
 */
export function SessionTimer({ startedAt, className }: SessionTimerProps) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!startedAt) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [startedAt]);

  const seconds = startedAt ? (now - startedAt) / 1000 : 0;
  const active = !!startedAt;

  return (
    <span
      aria-live="off"
      className={cn(
        "tabular-nums font-mono text-xs tracking-wide",
        active ? "text-primary-600" : "text-gray-400",
        className,
      )}
    >
      {formatMmSs(seconds)}
    </span>
  );
}
