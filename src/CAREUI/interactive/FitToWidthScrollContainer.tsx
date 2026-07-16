import { ReactNode, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * A container that renders content at full width, scales it to fit the
 * container width, and allows the user to scroll to view all content.
 */
export const FitToWidthScrollContainer = (props: {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const fitScaleRef = useRef(1);

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

  const currentScale = scale ?? 1;
  const scaledWidth = naturalSize.width * currentScale;
  const scaledHeight = naturalSize.height * currentScale;

  return (
    <div ref={containerRef} className={cn("overflow-auto", props.className)}>
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
  );
};
