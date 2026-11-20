import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

// Ported from the careui staff-sign-in-01 block, trimmed to its "care" variant.

interface Pixel {
  x: number;
  y: number;
  size: number;
  intensity: number;
  targetIntensity: number;
  colorPhase: number;
}

const PIXEL_SIZE = 12;
const FADE_SPEED = 0.045;
const POINTER_RADIUS = 120;
const COLORS = ["#065f46", "#10b981", "#a7f3d0"];
const PALETTE = COLORS.map((hex) => ({
  r: parseInt(hex.slice(1, 3), 16),
  g: parseInt(hex.slice(3, 5), 16),
  b: parseInt(hex.slice(5, 7), 16),
}));
// The Care cross, drawn around the pointer once it rests for a moment.
const CARE_PATTERN = [
  [0, 0.4, 0, 0.4, 0],
  [0.4, 0, 0.8, 0, 0.4],
  [0, 0.8, 0.8, 0.8, 0],
  [0, 0, 0.8, 0, 0],
] as const;

function supportsPixelCanvas() {
  const browser = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const mobile =
    navigator.maxTouchPoints > 0 || coarsePointer || window.innerWidth <= 767;

  return (
    !reducedMotion &&
    !mobile &&
    (navigator.hardwareConcurrency || 4) > 2 &&
    (browser.deviceMemory ?? 4) > 2 &&
    !browser.connection?.saveData
  );
}

function colorForPixel(
  intensity: number,
  phase: number,
  shapeProgress: number,
) {
  const randomPosition = ((phase + intensity) % 1) * (COLORS.length - 1);
  const position = randomPosition + (1 - randomPosition) * shapeProgress;
  const index = Math.floor(position);
  const from = PALETTE[index];
  const to = PALETTE[Math.min(index + 1, PALETTE.length - 1)];
  const amount = position - index;
  const channel = (start: number, end: number) =>
    Math.round(start + (end - start) * amount);
  return `rgb(${channel(from.r, to.r)}, ${channel(from.g, to.g)}, ${channel(from.b, to.b)})`;
}

export function PixelCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !supportsPixelCanvas()) return;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    let pixels: Pixel[][] = [];
    let pointer = { x: -1000, y: -1000 };
    let animationFrame = 0;
    let columns = 0;
    let rows = 0;
    let width = 0;
    let height = 0;
    let shapeStartedAt: number | null = null;
    let holdTimer: ReturnType<typeof setTimeout> | undefined;

    const resetHold = () => {
      clearTimeout(holdTimer);
      holdTimer = undefined;
      shapeStartedAt = null;
    };

    const resize = () => {
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.ceil(width * dpr);
      canvas.height = Math.ceil(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      columns = Math.ceil(width / PIXEL_SIZE);
      rows = Math.ceil(height / PIXEL_SIZE);

      pixels = Array.from({ length: columns }, (_, column) =>
        Array.from({ length: rows }, (_, row) => {
          const previous = pixels[column]?.[row];
          return {
            x: column * PIXEL_SIZE,
            y: row * PIXEL_SIZE,
            size: PIXEL_SIZE - 1,
            intensity: previous?.intensity ?? 0,
            targetIntensity: 0,
            colorPhase: previous?.colorPhase ?? Math.random(),
          };
        }),
      );
    };

    const draw = () => {
      animationFrame = 0;
      context.clearRect(0, 0, width, height);
      const pointerColumn = Math.floor(pointer.x / PIXEL_SIZE);
      const pointerRow = Math.floor(pointer.y / PIXEL_SIZE);
      const revealProgress =
        shapeStartedAt === null
          ? 0
          : Math.min((performance.now() - shapeStartedAt) / 700, 1);
      const shapeProgress =
        revealProgress * revealProgress * (3 - 2 * revealProgress);
      let needsAnotherFrame = revealProgress > 0 && revealProgress < 1;

      for (let column = 0; column < columns; column += 1) {
        for (let row = 0; row < rows; row += 1) {
          const pixel = pixels[column]?.[row];
          if (!pixel) continue;

          const dx = pointer.x - (pixel.x + pixel.size / 2);
          const dy = pointer.y - (pixel.y + pixel.size / 2);
          const distance = Math.sqrt(dx * dx + dy * dy);
          const proximity =
            distance < POINTER_RADIUS
              ? Math.pow(1 - distance / POINTER_RADIUS, 1.5)
              : 0;

          const blockOpacity =
            shapeStartedAt === null
              ? 0
              : (CARE_PATTERN[row - pointerRow + 2]?.[
                  column - pointerColumn + 2
                ] ?? 0);
          const randomIntensity = proximity * 0.25;
          const heldIntensity = blockOpacity || proximity * 0.12;
          pixel.targetIntensity =
            randomIntensity + (heldIntensity - randomIntensity) * shapeProgress;

          const fadeSpeed =
            pixel.targetIntensity > pixel.intensity ? 0.3 : FADE_SPEED;
          pixel.intensity +=
            (pixel.targetIntensity - pixel.intensity) * fadeSpeed;
          if (Math.abs(pixel.targetIntensity - pixel.intensity) > 0.005) {
            needsAnotherFrame = true;
          }
          if (pixel.intensity <= 0.01) continue;

          context.globalAlpha = pixel.intensity;
          context.fillStyle = colorForPixel(
            pixel.intensity,
            pixel.colorPhase,
            blockOpacity ? shapeProgress : 0,
          );
          context.beginPath();
          context.roundRect(
            pixel.x,
            pixel.y,
            pixel.size,
            pixel.size,
            pixel.size * 0.12,
          );
          context.fill();
        }
      }

      context.globalAlpha = 1;
      if (needsAnotherFrame) {
        animationFrame = requestAnimationFrame(draw);
      }
    };

    const scheduleDraw = () => {
      if (document.visibilityState === "hidden" || animationFrame) return;
      animationFrame = requestAnimationFrame(draw);
    };

    const onMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const next = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
      if (next.x !== pointer.x || next.y !== pointer.y) {
        resetHold();
        holdTimer = setTimeout(() => {
          holdTimer = undefined;
          shapeStartedAt = performance.now();
          scheduleDraw();
        }, 300);
      }
      pointer = next;
      scheduleDraw();
    };

    const pause = () => {
      resetHold();
      pointer = { x: -1000, y: -1000 };
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      }
    };

    const onMouseLeave = () => {
      resetHold();
      pointer = { x: -1000, y: -1000 };
      scheduleDraw();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") pause();
      else scheduleDraw();
    };

    resize();
    const observer = new ResizeObserver(() => {
      resize();
      scheduleDraw();
    });
    observer.observe(container);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", pause);
    container.addEventListener("mousemove", onMouseMove);
    container.addEventListener("mouseleave", onMouseLeave);

    return () => {
      pause();
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", pause);
      container.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={cn("overflow-hidden", className)}
    >
      <canvas ref={canvasRef} className="pointer-events-none block size-full" />
    </div>
  );
}
