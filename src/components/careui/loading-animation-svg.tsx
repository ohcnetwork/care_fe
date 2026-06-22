import { cn } from "@/lib/utils";
import * as React from "react";

// ─── Static cell data ─────────────────────────────────────────────────────────

const HEART_PATTERN = [
  [0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [1, 1, 0, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
  [0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
] as const;

const LOGO_PATTERN = [
  [0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
  [0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
  [1, 1, 0, 0, 1, 1, 0, 0, 1, 1],
  [1, 1, 0, 0, 1, 1, 0, 0, 1, 1],
  [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
  [0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
] as const;

const ROWS = 8;
const COLS = 10;
const WAVE_STEP_MS = 50; // ring step — wider gap = distinct ring boundaries in the ripple
const HOLD_MS = 650;
const CELL_ANIM_MS = 300; // must be well below (WAVE_STEP_MS × numRings) so rings don't bleed

// Colors matching the div-based component
const HEART_FILL = "#f43f5e"; // rose-500
const LOGO_LIGHT = "#059669"; // emerald-600
const LOGO_DARK = "#047857"; // emerald-700

// Corner radius in SVG units (cell = 1×1); matches rounded-xs at display size
const R = 0.3;

type CornerSpec = { tl?: number; tr?: number; bl?: number; br?: number };

// Same outer-corner positions as the div version (shared by both shapes)
const CORNER_MAP: Record<string, CornerSpec> = {
  "0,2": { tl: R },
  "0,3": { tr: R },
  "0,6": { tl: R },
  "0,7": { tr: R },
  "2,0": { tl: R },
  "3,0": { bl: R },
  "2,9": { tr: R },
  "3,9": { br: R },
  "7,4": { bl: R },
  "7,5": { br: R },
};

// Build an SVG path string for a 1.01×1.01 cell with per-corner rounding
function cellPath(x: number, y: number, c: CornerSpec = {}): string {
  const w = 1.01,
    h = 1.01;
  const { tl = 0, tr = 0, br = 0, bl = 0 } = c;
  const p: string[] = [];
  p.push(`M ${x + tl},${y}`);
  p.push(`L ${x + w - tr},${y}`);
  if (tr) p.push(`Q ${x + w},${y} ${x + w},${y + tr}`);
  p.push(`L ${x + w},${y + h - br}`);
  if (br) p.push(`Q ${x + w},${y + h} ${x + w - br},${y + h}`);
  p.push(`L ${x + bl},${y + h}`);
  if (bl) p.push(`Q ${x},${y + h} ${x},${y + h - bl}`);
  p.push(`L ${x},${y + tl}`);
  if (tl) p.push(`Q ${x},${y} ${x + tl},${y}`);
  p.push("Z");
  return p.join("");
}

type CellData = {
  row: number;
  col: number;
  idx: number;
  inHeart: boolean;
  inLogo: boolean;
  isLogoLight: boolean;
  d: string; // pre-computed SVG path
};

function buildCellData(): CellData[] {
  const LOGO_LIGHT_KEYS = new Set([
    "0,2",
    "1,2",
    "0,3",
    "1,3",
    "0,6",
    "1,6",
    "0,7",
    "1,7",
    "2,0",
    "2,1",
    "3,0",
    "3,1",
    "2,8",
    "2,9",
    "3,8",
    "3,9",
  ]);
  const raw: CellData[] = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const key = `${row},${col}`;
      raw.push({
        row,
        col,
        idx: row * COLS + col,
        inHeart: HEART_PATTERN[row][col] === 1,
        inLogo: LOGO_PATTERN[row][col] === 1,
        isLogoLight: LOGO_LIGHT_KEYS.has(key),
        d: cellPath(col, row, CORNER_MAP[key]),
      });
    }
  }
  raw.sort((a, b) => {
    const d = (r: number, c: number) =>
      Math.sqrt((r - 3.5) ** 2 + (c - 4.5) ** 2);
    return d(a.row, a.col) - d(b.row, b.col);
  });
  return raw;
}

const CELL_DATA = buildCellData();

const CELL_BY_IDX: CellData[] = Array(ROWS * COLS);
CELL_DATA.forEach((c) => {
  CELL_BY_IDX[c.idx] = c;
});

// Ring groups — same quantization as the div-based component.
// Cells at the same rounded radial distance fire together as a crisp concentric ring.
const WAVE_GROUPS: { indices: number[] }[] = (() => {
  const map = new Map<number, number[]>();
  CELL_DATA.forEach((c) => {
    const key = Math.round(
      Math.sqrt((c.row - 3.5) ** 2 + (c.col - 4.5) ** 2) * 2,
    );
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(c.idx);
  });
  return [...map.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, indices]) => ({ indices }));
})();

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * LoadingAnimationSvg
 */
export function LoadingAnimationSvg({ className }: { className?: string }) {
  const beatRef = React.useRef<SVGGElement>(null);
  const rectRefs = React.useRef<(Element | null)[]>(
    Array(ROWS * COLS).fill(null),
  );
  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([]);
  const mounted = React.useRef(true);
  const isFirstShow = React.useRef(true);

  const schedule = React.useCallback((fn: () => void, delay: number) => {
    const id: ReturnType<typeof setTimeout> = setTimeout(() => {
      timers.current = timers.current.filter((t) => t !== id);
      fn();
    }, delay);
    timers.current.push(id);
  }, []);

  const clearAllTimers = React.useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const show = React.useCallback(
    (next: "heart" | "logo", onDone?: () => void) => {
      const first = isFirstShow.current;
      if (first) isFirstShow.current = false;

      const nextProp = next === "heart" ? "inHeart" : "inLogo";
      const prevProp = next === "heart" ? "inLogo" : "inHeart";
      const groups = next === "logo" ? [...WAVE_GROUPS].reverse() : WAVE_GROUPS;
      const waveDuration = (groups.length - 1) * WAVE_STEP_MS;
      schedule(
        () => {
          if (!mounted.current) return;
          beatRef.current?.animate(
            [
              { transform: "scale(1)", offset: 0 },
              { transform: "scale(1.08)", offset: 0.2 }, // lub — shape ~half filled
              { transform: "scale(1)", offset: 0.46 },
              { transform: "scale(1.03)", offset: 0.68 }, // dub — outer rings settling
              { transform: "scale(1)", offset: 1 },
            ],
            { duration: 580, easing: "ease-in-out", fill: "none" },
          );
        },
        Math.round(waveDuration * 0.45),
      );

      groups.forEach(({ indices }, i) => {
        schedule(() => {
          if (!mounted.current) return;
          indices.forEach((idx) => {
            const cell = CELL_BY_IDX[idx];
            if (!cell) return;
            const inNext = cell[nextProp as "inHeart" | "inLogo"];
            const inPrev = !first && cell[prevProp as "inHeart" | "inLogo"];
            if (!inNext && !inPrev) return;

            const el = rectRefs.current[idx];
            if (!el) return;

            el.getAnimations().forEach((a) => {
              try {
                a.commitStyles();
              } catch {
                /* ignore */
              }
              a.cancel();
            });

            const nextFill =
              next === "heart"
                ? HEART_FILL
                : cell.isLogoLight
                  ? LOGO_LIGHT
                  : LOGO_DARK;
            const prevFill =
              next === "heart"
                ? cell.isLogoLight
                  ? LOGO_LIGHT
                  : LOGO_DARK
                : HEART_FILL;

            if (inNext && inPrev) {
              el.animate(
                [
                  {
                    fill: prevFill,
                    transform: "scale(1)",
                    opacity: "1",
                    offset: 0,
                  },
                  {
                    fill: prevFill,
                    transform: "scale(0.68)",
                    opacity: "0.4",
                    offset: 0.3,
                  },
                  {
                    fill: nextFill,
                    transform: "scale(0.68)",
                    opacity: "0.4",
                    offset: 0.33,
                  },
                  {
                    fill: nextFill,
                    transform: "scale(1)",
                    opacity: "1",
                    offset: 1,
                  },
                ],
                {
                  duration: CELL_ANIM_MS,
                  easing: "ease-in-out",
                  fill: "forwards",
                },
              );
            } else if (inNext) {
              el.animate(
                [
                  { fill: nextFill, transform: "scale(0.35)", opacity: "0" },
                  { fill: nextFill, transform: "scale(1)", opacity: "1" },
                ],
                {
                  duration: CELL_ANIM_MS,
                  easing: "cubic-bezier(0.2, 0, 0.2, 1)",
                  fill: "forwards",
                },
              );
            } else {
              el.animate(
                [
                  { fill: prevFill, transform: "scale(1)", opacity: "1" },
                  { fill: prevFill, transform: "scale(0.35)", opacity: "0" },
                ],
                {
                  duration: CELL_ANIM_MS,
                  easing: "cubic-bezier(0.55, 0, 1, 0.45)",
                  fill: "forwards",
                },
              );
            }
          });
        }, i * WAVE_STEP_MS);
      });

      // Gentle breathing pulse mid-hold — keeps the settled shape alive rather than static.
      schedule(
        () => {
          if (!mounted.current) return;
          beatRef.current?.animate(
            [
              { transform: "scale(1)", offset: 0 },
              { transform: "scale(1.025)", offset: 0.5 },
              { transform: "scale(1)", offset: 1 },
            ],
            {
              duration: Math.round(HOLD_MS * 0.8),
              easing: "ease-in-out",
              fill: "none",
            },
          );
        },
        waveDuration + Math.round(CELL_ANIM_MS * 0.55),
      );

      schedule(() => {
        if (!mounted.current) return;
        onDone?.();
      }, waveDuration + HOLD_MS);
    },
    [schedule],
  );

  React.useEffect(() => {
    mounted.current = true;
    show("heart", () => {
      if (!mounted.current) return;
      function cycle() {
        show("logo", () => {
          if (!mounted.current) return;
          show("heart", () => {
            if (!mounted.current) return;
            cycle();
          });
        });
      }
      cycle();
    });
    return () => {
      mounted.current = false;
      clearAllTimers();
    };
  }, [show, clearAllTimers]);

  return (
    <div
      data-slot="loading-animation-svg"
      className={cn("grid place-items-center gap-3", className)}
    >
      <svg
        viewBox={`0 0 ${COLS} ${ROWS}`}
        className="w-16"
        style={{ aspectRatio: `${COLS}/${ROWS}` }}
        aria-hidden="true"
      >
        {/* beatRef <g> owns the heartbeat — all rects composite as one GPU layer */}
        <g
          ref={beatRef}
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
        >
          {Array.from({ length: ROWS * COLS }, (_, idx) => {
            const cell = CELL_BY_IDX[idx];
            return (
              <path
                key={idx}
                ref={(el) => {
                  rectRefs.current[idx] = el;
                }}
                d={cell.d}
                fill="transparent"
                opacity={0}
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
              />
            );
          })}
        </g>
      </svg>
      <p className="pl-3 text-center text-xs font-medium tracking-widest text-gray-500 uppercase">
        loading
        <span className="animate-blink opacity-0">.</span>
        <span className="animate-[blink_1.5s_0.2s_infinite] opacity-0">.</span>
        <span className="animate-[blink_1.5s_0.4s_infinite] opacity-0">.</span>
      </p>
    </div>
  );
}
