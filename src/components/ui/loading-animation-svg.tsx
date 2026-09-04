/**
 * SVG-based pixel-art CARE loading animation.
 *
 * Cycles between a red heart shape and the green CARE logo with a
 * heartbeat-like ripple effect. All transitions use the Web Animations API
 * directly on SVG <path> elements, so the component never re-renders during
 * the animation loop.
 *
 * Respects `prefers-reduced-motion`: when enabled, renders a static CARE
 * logo instead of the animated cycle.
 */
import * as React from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

// ─── Pixel grid dimensions ────────────────────────────────────────────────────

const GRID_ROWS = 8;
const GRID_COLS = 10;

// ─── Shape bitmaps ────────────────────────────────────────────────────────────
// Each 1 marks a filled cell in the 10×8 pixel grid.

/** Pixel-art heart shape (red, rose-500). */
const HEART_BITMAP = [
  [0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [1, 1, 0, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
  [0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
] as const;

/** Pixel-art CARE logo shape (green, emerald-600 / emerald-700). */
const LOGO_BITMAP = [
  [0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
  [0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
  [1, 1, 0, 0, 1, 1, 0, 0, 1, 1],
  [1, 1, 0, 0, 1, 1, 0, 0, 1, 1],
  [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
  [0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
] as const;

// ─── Timing constants (ms) ───────────────────────────────────────────────────

/** Delay between concentric wave rings firing. */
const WAVE_STEP_MS = 50;
/** How long a shape is held on-screen before transitioning. */
const HOLD_MS = 650;
/** Duration of each individual cell's scale/fade transition. */
const CELL_ANIM_MS = 300;

// ─── Color palette ────────────────────────────────────────────────────────────

const COLORS = {
  heart: "#f43f5e", // rose-500
  logoLight: "#059669", // emerald-600 (outer corners of the logo)
  logoDark: "#047857", // emerald-700 (inner cells of the logo)
} as const;

// ─── Cell geometry helpers ────────────────────────────────────────────────────

/** Per-corner border-radius spec (SVG units; 1 unit = 1 cell). */
type CornerRadii = { tl?: number; tr?: number; bl?: number; br?: number };

/** Radius applied to outer corners of each shape (≈ rounded-xs at display). */
const CORNER_RADIUS = 0.3;

/** Map of "row,col" → which corners should be rounded on that cell. */
const ROUNDED_CORNERS: Record<string, CornerRadii> = {
  "0,2": { tl: CORNER_RADIUS },
  "0,3": { tr: CORNER_RADIUS },
  "0,6": { tl: CORNER_RADIUS },
  "0,7": { tr: CORNER_RADIUS },
  "2,0": { tl: CORNER_RADIUS },
  "3,0": { bl: CORNER_RADIUS },
  "2,9": { tr: CORNER_RADIUS },
  "3,9": { br: CORNER_RADIUS },
  "7,4": { bl: CORNER_RADIUS },
  "7,5": { br: CORNER_RADIUS },
};

/**
 * Build an SVG path `d` attribute for a 1.01×1.01 cell at (x, y) with
 * optional per-corner rounding. The 0.01 overlap prevents hairline gaps
 * between adjacent cells.
 */
function buildCellPath(
  x: number,
  y: number,
  { tl = 0, tr = 0, br = 0, bl = 0 }: CornerRadii = {},
): string {
  const size = 1.01;
  const segments: string[] = [];

  // Top edge: start → top-right
  segments.push(`M ${x + tl},${y}`);
  segments.push(`L ${x + size - tr},${y}`);
  if (tr) segments.push(`Q ${x + size},${y} ${x + size},${y + tr}`);

  // Right edge: top-right → bottom-right
  segments.push(`L ${x + size},${y + size - br}`);
  if (br)
    segments.push(`Q ${x + size},${y + size} ${x + size - br},${y + size}`);

  // Bottom edge: bottom-right → bottom-left
  segments.push(`L ${x + bl},${y + size}`);
  if (bl) segments.push(`Q ${x},${y + size} ${x},${y + size - bl}`);

  // Left edge: bottom-left → top-left
  segments.push(`L ${x},${y + tl}`);
  if (tl) segments.push(`Q ${x},${y} ${x + tl},${y}`);

  segments.push("Z");
  return segments.join(" ");
}

// ─── Pre-computed cell data ───────────────────────────────────────────────────

interface CellInfo {
  row: number;
  col: number;
  /** Flat index (row × GRID_COLS + col). */
  flatIndex: number;
  /** Whether this cell is part of the heart shape. */
  inHeart: boolean;
  /** Whether this cell is part of the logo shape. */
  inLogo: boolean;
  /** If part of the logo, whether it uses the lighter green. */
  isLogoLightColor: boolean;
  /** Pre-computed SVG path string. */
  pathData: string;
}

/** Cells in the logo that use the lighter emerald-600 (the outer corner blocks). */
const LOGO_LIGHT_CELLS = new Set([
  "0,2",
  "1,2",
  "0,3",
  "1,3", // top-left block
  "0,6",
  "1,6",
  "0,7",
  "1,7", // top-right block
  "2,0",
  "2,1",
  "3,0",
  "3,1", // left block
  "2,8",
  "2,9",
  "3,8",
  "3,9", // right block
]);

/** Distance from a cell to the grid center, used for radial sort/grouping. */
function distanceFromCenter(row: number, col: number): number {
  const centerRow = (GRID_ROWS - 1) / 2; // 3.5
  const centerCol = (GRID_COLS - 1) / 2; // 4.5
  return Math.sqrt((row - centerRow) ** 2 + (col - centerCol) ** 2);
}

/** Build cell metadata for every position in the grid. */
function buildAllCells(): CellInfo[] {
  const cells: CellInfo[] = [];
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const key = `${row},${col}`;
      cells.push({
        row,
        col,
        flatIndex: row * GRID_COLS + col,
        inHeart: HEART_BITMAP[row][col] === 1,
        inLogo: LOGO_BITMAP[row][col] === 1,
        isLogoLightColor: LOGO_LIGHT_CELLS.has(key),
        pathData: buildCellPath(col, row, ROUNDED_CORNERS[key]),
      });
    }
  }
  // Sort center-out so WAVE_GROUPS ripple outward
  cells.sort(
    (a, b) =>
      distanceFromCenter(a.row, a.col) - distanceFromCenter(b.row, b.col),
  );
  return cells;
}

// Pre-compute once at module load
const ALL_CELLS = buildAllCells();

/** Look up cell by flat index. */
const CELL_BY_INDEX: CellInfo[] = Array(GRID_ROWS * GRID_COLS);
ALL_CELLS.forEach((cell) => {
  CELL_BY_INDEX[cell.flatIndex] = cell;
});

/**
 * Group cells into concentric wave rings by quantized distance from center.
 * Each ring fires simultaneously during the ripple animation.
 */
const WAVE_RINGS: { cellIndices: number[] }[] = (() => {
  const ringMap = new Map<number, number[]>();
  ALL_CELLS.forEach((cell) => {
    const ringKey = Math.round(distanceFromCenter(cell.row, cell.col) * 2);
    if (!ringMap.has(ringKey)) ringMap.set(ringKey, []);
    ringMap.get(ringKey)!.push(cell.flatIndex);
  });
  return [...ringMap.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, cellIndices]) => ({ cellIndices }));
})();

// ─── Reduced motion helper ────────────────────────────────────────────────────

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false,
  );

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return reduced;
}

// ─── Component ────────────────────────────────────────────────────────────────

type Shape = "heart" | "logo";

/** Get the fill color for a cell in the given shape. */
function getFillColor(shape: Shape, cell: CellInfo): string {
  if (shape === "heart") return COLORS.heart;
  return cell.isLogoLightColor ? COLORS.logoLight : COLORS.logoDark;
}

/**
 * Cancel all running Web Animations on an element, committing their
 * current styles first so the next animation picks up where they left off.
 */
function commitAndCancelAnimations(el: Element): void {
  el.getAnimations().forEach((anim) => {
    try {
      anim.commitStyles();
    } catch {
      /* noop — element may have been removed */
    }
    anim.cancel();
  });
}

/**
 * Animate a single cell transitioning between shapes. Three cases:
 * - Cell exists in both shapes → cross-fade (shrink, recolor, grow)
 * - Cell only in the next shape → pop-in from center
 * - Cell only in the previous shape → shrink-out to center
 */
function animateCell(
  el: Element,
  cell: CellInfo,
  nextShape: Shape,
  isInNext: boolean,
  isInPrev: boolean,
): void {
  commitAndCancelAnimations(el);

  const nextColor = getFillColor(nextShape, cell);
  const prevShape: Shape = nextShape === "heart" ? "logo" : "heart";
  const prevColor = getFillColor(prevShape, cell);

  if (isInNext && isInPrev) {
    // Cross-fade: shrink with old color, swap color, grow with new color
    el.animate(
      [
        { fill: prevColor, transform: "scale(1)", opacity: "1", offset: 0 },
        {
          fill: prevColor,
          transform: "scale(0.68)",
          opacity: "0.4",
          offset: 0.3,
        },
        {
          fill: nextColor,
          transform: "scale(0.68)",
          opacity: "0.4",
          offset: 0.33,
        },
        { fill: nextColor, transform: "scale(1)", opacity: "1", offset: 1 },
      ],
      { duration: CELL_ANIM_MS, easing: "ease-in-out", fill: "forwards" },
    );
  } else if (isInNext) {
    // Pop-in: scale up from small
    el.animate(
      [
        { fill: nextColor, transform: "scale(0.35)", opacity: "0" },
        { fill: nextColor, transform: "scale(1)", opacity: "1" },
      ],
      {
        duration: CELL_ANIM_MS,
        easing: "cubic-bezier(0.2, 0, 0.2, 1)",
        fill: "forwards",
      },
    );
  } else {
    // Shrink-out: scale down to nothing
    el.animate(
      [
        { fill: prevColor, transform: "scale(1)", opacity: "1" },
        { fill: prevColor, transform: "scale(0.35)", opacity: "0" },
      ],
      {
        duration: CELL_ANIM_MS,
        easing: "cubic-bezier(0.55, 0, 1, 0.45)",
        fill: "forwards",
      },
    );
  }
}

/**
 * SVG-based pixel-art CARE loading animation.
 *
 * When `prefers-reduced-motion` is active, renders a static CARE logo.
 * Otherwise, cycles between the heart and logo shapes with a ripple effect.
 */
export function LoadingAnimationSvg({ className }: { className?: string }) {
  const { t } = useTranslation();
  const prefersReducedMotion = usePrefersReducedMotion();

  const beatGroupRef = React.useRef<SVGGElement>(null);
  const cellElementRefs = React.useRef<(Element | null)[]>(
    Array(GRID_ROWS * GRID_COLS).fill(null),
  );
  const pendingTimers = React.useRef<ReturnType<typeof setTimeout>[]>([]);
  const isMounted = React.useRef(true);
  const isFirstTransition = React.useRef(true);

  // ── Timer helpers ─────────────────────────────────────────────────────────

  const schedule = React.useCallback((fn: () => void, delayMs: number) => {
    const timerId: ReturnType<typeof setTimeout> = setTimeout(() => {
      pendingTimers.current = pendingTimers.current.filter(
        (t) => t !== timerId,
      );
      fn();
    }, delayMs);
    pendingTimers.current.push(timerId);
  }, []);

  const clearAllTimers = React.useCallback(() => {
    pendingTimers.current.forEach(clearTimeout);
    pendingTimers.current = [];
  }, []);

  // ── Shape transition ──────────────────────────────────────────────────────

  /** Reveal `nextShape` with a concentric ripple, then call `onComplete`. */
  const showShape = React.useCallback(
    (nextShape: Shape, onComplete?: () => void) => {
      const isFirst = isFirstTransition.current;
      if (isFirst) isFirstTransition.current = false;

      const nextKey = nextShape === "heart" ? "inHeart" : "inLogo";
      const prevKey = nextShape === "heart" ? "inLogo" : "inHeart";

      // Ripple direction: heart → inward-out, logo → outward-in
      const rings =
        nextShape === "logo" ? [...WAVE_RINGS].reverse() : WAVE_RINGS;
      const totalWaveMs = (rings.length - 1) * WAVE_STEP_MS;

      // Heartbeat "lub-dub" timed to mid-wave
      schedule(
        () => {
          if (!isMounted.current) return;
          beatGroupRef.current?.animate(
            [
              { transform: "scale(1)", offset: 0 },
              { transform: "scale(1.08)", offset: 0.2 }, // lub
              { transform: "scale(1)", offset: 0.46 },
              { transform: "scale(1.03)", offset: 0.68 }, // dub
              { transform: "scale(1)", offset: 1 },
            ],
            { duration: 580, easing: "ease-in-out", fill: "none" },
          );
        },
        Math.round(totalWaveMs * 0.45),
      );

      // Fire each concentric ring with a staggered delay
      rings.forEach(({ cellIndices }, ringIndex) => {
        schedule(() => {
          if (!isMounted.current) return;

          cellIndices.forEach((flatIdx) => {
            const cell = CELL_BY_INDEX[flatIdx];
            if (!cell) return;

            const isInNext = cell[nextKey as "inHeart" | "inLogo"];
            const isInPrev = !isFirst && cell[prevKey as "inHeart" | "inLogo"];
            if (!isInNext && !isInPrev) return;

            const el = cellElementRefs.current[flatIdx];
            if (!el) return;

            animateCell(el, cell, nextShape, isInNext, isInPrev);
          });
        }, ringIndex * WAVE_STEP_MS);
      });

      // Gentle breathing pulse while the shape holds
      schedule(
        () => {
          if (!isMounted.current) return;
          beatGroupRef.current?.animate(
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
        totalWaveMs + Math.round(CELL_ANIM_MS * 0.55),
      );

      // Signal completion after wave + hold
      schedule(() => {
        if (!isMounted.current) return;
        onComplete?.();
      }, totalWaveMs + HOLD_MS);
    },
    [schedule],
  );

  // ── Animation lifecycle ───────────────────────────────────────────────────

  React.useEffect(() => {
    if (prefersReducedMotion) return;

    isMounted.current = true;

    // Start with heart, then loop: heart → logo → heart → …
    showShape("heart", function startCycle() {
      if (!isMounted.current) return;
      showShape("logo", () => {
        if (!isMounted.current) return;
        showShape("heart", () => {
          if (!isMounted.current) return;
          startCycle();
        });
      });
    });

    return () => {
      isMounted.current = false;
      clearAllTimers();
    };
  }, [showShape, clearAllTimers, prefersReducedMotion]);

  // ── Render ────────────────────────────────────────────────────────────────

  const totalCells = GRID_ROWS * GRID_COLS;

  return (
    <div
      data-slot="loading-animation-svg"
      className={cn("grid place-items-center gap-3", className)}
    >
      <svg
        viewBox={`0 0 ${GRID_COLS} ${GRID_ROWS}`}
        className="w-16"
        style={{ aspectRatio: `${GRID_COLS}/${GRID_ROWS}` }}
        aria-hidden="true"
      >
        <g
          ref={beatGroupRef}
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
        >
          {Array.from({ length: totalCells }, (_, idx) => {
            const cell = CELL_BY_INDEX[idx];
            // For reduced motion, show a static CARE logo
            const isStatic = prefersReducedMotion && cell.inLogo;
            return (
              <path
                key={idx}
                ref={(el) => {
                  cellElementRefs.current[idx] = el;
                }}
                d={cell.pathData}
                fill={isStatic ? getFillColor("logo", cell) : "transparent"}
                opacity={isStatic ? 1 : 0}
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
              />
            );
          })}
        </g>
      </svg>
      <p
        className="pl-3 text-center text-xs font-medium uppercase tracking-widest text-gray-500"
        role="status"
        aria-live="polite"
      >
        {t("loading_ellipsis")}
        <span
          className="animate-blink opacity-0 motion-reduce:animate-none motion-reduce:opacity-100"
          aria-hidden="true"
        >
          .
        </span>
        <span
          className="animate-[blink_1.5s_0.2s_infinite] opacity-0 motion-reduce:animate-none motion-reduce:opacity-100"
          aria-hidden="true"
        >
          .
        </span>
        <span
          className="animate-[blink_1.5s_0.4s_infinite] opacity-0 motion-reduce:animate-none motion-reduce:opacity-100"
          aria-hidden="true"
        >
          .
        </span>
      </p>
    </div>
  );
}
