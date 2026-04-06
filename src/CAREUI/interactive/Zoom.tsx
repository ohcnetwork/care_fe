import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut } from "lucide-react";

type ProviderValue = {
  scale: number;
  zoomIn: () => void;
  zoomOut: () => void;
};

const ZoomContext = createContext<ProviderValue | null>(null);

type Props = {
  initialScale?: number;
  scaleRatio?: number;
  children: ReactNode;
};

export const ZoomProvider = ({
  initialScale = 1,
  scaleRatio = 1.25,
  children,
}: Props) => {
  const [scale, setScale] = useState(initialScale);

  return (
    <ZoomContext.Provider
      value={{
        scale,
        zoomIn: () => setScale((scale) => scale * scaleRatio),
        zoomOut: () => setScale((scale) => scale / scaleRatio),
      }}
    >
      {children}
    </ZoomContext.Provider>
  );
};

export const ZoomTransform = (props: {
  children: ReactNode;
  className?: string;
}) => {
  const ctx = useContext(ZoomContext);

  if (ctx == null) {
    throw new Error("Component must be used with ZoomProvider");
  }

  return (
    <>
      <style>{`
        @media not print {
          :root {
            --print-preview-zoom-scale: ${ctx.scale};
          }
        }
      `}</style>
      <div
        className={cn(props.className, "scale-(--print-preview-zoom-scale)")}
      >
        {props.children}
      </div>
    </>
  );
};

/**
 * A container that renders the content at full A4-like width and allows
 * the user to scroll (pan) and pinch-to-zoom on touch devices.
 * Single-finger scrolls in both directions; two-finger pinch zooms.
 * After zooming, the scroll area expands so you can scroll to all edges.
 */
export const PinchZoomScrollContainer = (props: {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  showZoomControls?: boolean;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const baseDistRef = useRef<number | null>(null);
  const baseScaleRef = useRef(1);
  const isPinchingRef = useRef(false);
  const fitScaleRef = useRef(1);
  const ZOOM_STEP = 1.25;

  const clampScale = useCallback(
    (s: number) => Math.min(Math.max(s, fitScaleRef.current), 3),
    [],
  );

  const zoomIn = useCallback(() => {
    setScale((prev) => clampScale((prev ?? 1) * ZOOM_STEP));
  }, [clampScale]);

  const zoomOut = useCallback(() => {
    setScale((prev) => clampScale((prev ?? 1) / ZOOM_STEP));
  }, [clampScale]);

  // Measure the natural (unscaled) content size and compute fit-to-width scale
  useEffect(() => {
    const content = contentRef.current;
    const container = containerRef.current;
    if (!content || !container) return;

    const measure = () => {
      const cw = content.scrollWidth;
      const ch = content.scrollHeight;
      setNaturalSize({ width: cw, height: ch });

      // Compute fit-to-width scale on first measurement
      if (cw > 0 && scale === null) {
        const containerWidth = container.clientWidth;
        const fitScale = Math.min(containerWidth / cw, 1);
        fitScaleRef.current = fitScale;
        setScale(fitScale);
      }
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(content);
    return () => observer.disconnect();
  }, [scale]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        isPinchingRef.current = true;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        baseDistRef.current = Math.hypot(dx, dy);
        baseScaleRef.current = scale ?? 1;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      // Only intercept two-finger pinch; let single-finger scroll through
      if (
        e.touches.length === 2 &&
        isPinchingRef.current &&
        baseDistRef.current !== null
      ) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const newScale = clampScale(
          baseScaleRef.current * (dist / baseDistRef.current),
        );
        setScale(newScale);
        e.preventDefault();
      }
    };

    const onTouchEnd = () => {
      baseDistRef.current = null;
      isPinchingRef.current = false;
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [scale, clampScale]);

  // Sizer dimensions so the scroll container knows the zoomed extent.
  const currentScale = scale ?? 1;
  const scaledWidth = naturalSize.width * currentScale;
  const scaledHeight = naturalSize.height * currentScale;

  return (
    <>
      <div
        ref={containerRef}
        className={cn(
          "overflow-auto overscroll-contain",
          "print:overflow-visible",
          props.className,
        )}
      >
        {/* This wrapper provides the scroll dimensions */}
        <div
          style={{
            width: scaledWidth || undefined,
            height: scaledHeight || undefined,
          }}
          className="print:w-auto! print:h-auto!"
        >
          {/* The actual content, scaled from top-left */}
          <div
            ref={contentRef}
            className={cn(
              "origin-top-left w-max",
              "print:transform-none!",
              props.contentClassName,
            )}
            style={{ transform: `scale(${currentScale})` }}
          >
            {props.children}
          </div>
        </div>
      </div>
      {props.showZoomControls !== false && (
        <ZoomControls
          scale={currentScale}
          zoomIn={zoomIn}
          zoomOut={zoomOut}
          disabled={currentScale >= 3}
        />
      )}
    </>
  );
};

export const ZoomControls = (props: {
  disabled?: boolean;
  scale?: number;
  zoomIn?: () => void;
  zoomOut?: () => void;
}) => {
  const ctx = useContext(ZoomContext);

  const scale = props.scale ?? ctx?.scale;
  const zoomIn = props.zoomIn ?? ctx?.zoomIn;
  const zoomOut = props.zoomOut ?? ctx?.zoomOut;

  if (scale == null || !zoomIn || !zoomOut) {
    throw new Error(
      "ZoomControls must be used with ZoomProvider or receive scale/zoomIn/zoomOut props",
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-center gap-1 rounded-full border border-secondary-300 bg-white/90 p-0.5 shadow-lg backdrop-blur-sm print:hidden">
      <Button
        disabled={props.disabled}
        variant="ghost"
        size="icon"
        className="size-8 rounded-full"
        onClick={zoomIn}
      >
        <ZoomIn className="text-base" />
      </Button>
      <span className="min-w-[3ch] text-center text-xs font-medium text-secondary-700">
        {Math.round(scale * 100)}%
      </span>
      <Button
        disabled={props.disabled}
        variant="ghost"
        size="icon"
        className="size-8 rounded-full"
        onClick={zoomOut}
      >
        <ZoomOut className="text-base" />
      </Button>
    </div>
  );
};
