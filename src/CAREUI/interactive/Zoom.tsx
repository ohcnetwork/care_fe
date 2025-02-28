import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";

type ProviderValue = {
  scale: number;
  setScale: (scale: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  panPosition: { x: number; y: number };
  setPanPosition: (position: { x: number; y: number }) => void;
  resetView: () => void;
};

const ZoomContext = createContext<ProviderValue | null>(null);

type Props = {
  initialScale?: number;
  scaleRatio?: number;
  minScale?: number;
  maxScale?: number;
  children: ReactNode;
  enablePanning?: boolean;
};

export const ZoomProvider = ({
  initialScale = 1,
  scaleRatio = 1.25,
  minScale = 0.25,
  maxScale = 4,
  children,
}: Props) => {
  const [scale, setScaleState] = useState(initialScale);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });

  const setScale = (newScale: number) => {
    // Clamp scale between minScale and maxScale
    const clampedScale = Math.min(Math.max(newScale, minScale), maxScale);
    setScaleState(clampedScale);
  };

  const zoomIn = () => {
    setScale(scale * scaleRatio);
  };

  const zoomOut = () => {
    setScale(scale / scaleRatio);
  };

  const resetView = () => {
    setScaleState(initialScale);
    setPanPosition({ x: 0, y: 0 });
  };

  return (
    <ZoomContext.Provider
      value={{
        scale,
        setScale,
        zoomIn,
        zoomOut,
        panPosition,
        setPanPosition,
        resetView,
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
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [lastDistance, setLastDistance] = useState<number | null>(null);
  const [lastCenter, setLastCenter] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [, setContentSize] = useState({ width: 0, height: 0 });

  if (ctx == null) {
    throw new Error("Component must be used with ZoomProvider");
  }

  // Measure content size whenever scale changes
  useEffect(() => {
    if (contentRef.current) {
      const updateContentSize = () => {
        if (contentRef.current) {
          setContentSize({
            width: contentRef.current.scrollWidth * ctx.scale,
            height: contentRef.current.scrollHeight * ctx.scale,
          });
        }
      };

      updateContentSize();

      // Use ResizeObserver to detect changes in content size
      const resizeObserver = new ResizeObserver(updateContentSize);
      resizeObserver.observe(contentRef.current);

      return () => {
        if (contentRef.current) {
          // eslint-disable-next-line react-hooks/exhaustive-deps
          resizeObserver.unobserve(contentRef.current);
        }
      };
    }
  }, [ctx.scale]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Allow scrolling when content is larger than container
    const handleScroll = (e: WheelEvent) => {
      if (!e.ctrlKey) {
        // Natural scrolling (non-zooming)
        e.preventDefault();

        const scrollSpeed = 0.8; // Adjust scroll speed
        const deltaX = e.deltaX * scrollSpeed;
        const deltaY = e.deltaY * scrollSpeed;

        ctx.setPanPosition({
          x: ctx.panPosition.x - deltaX,
          y: ctx.panPosition.y - deltaY,
        });
      } else {
        // Zoom with Ctrl+Wheel
        e.preventDefault();

        // Adjust sensitivity
        const zoomFactor = 0.05;
        const delta = -e.deltaY * zoomFactor;

        // Get cursor position relative to container
        const rect = container.getBoundingClientRect();
        const cursorX = e.clientX - rect.left;
        const cursorY = e.clientY - rect.top;

        // Calculate new scale with smoother change
        const newScale = ctx.scale * (1 + delta);

        // Zoom toward cursor position
        if (newScale !== ctx.scale) {
          const scaleRatio = newScale / ctx.scale;

          // Adjust pan position to zoom toward cursor
          const newPanX =
            ctx.panPosition.x -
            (cursorX - ctx.panPosition.x) * (scaleRatio - 1);
          const newPanY =
            ctx.panPosition.y -
            (cursorY - ctx.panPosition.y) * (scaleRatio - 1);

          ctx.setScale(newScale);
          ctx.setPanPosition({ x: newPanX, y: newPanY });
        }
      }
    };

    // Handle any touch on the container for panning
    const handleTouchStart = (e: TouchEvent) => {
      // Only process if from the container
      if (!container.contains(e.target as Node)) return;

      if (e.touches.length === 1) {
        // Single touch - prepare for panning
        setIsDragging(true);
        setStartPos({
          x: e.touches[0].clientX - ctx.panPosition.x,
          y: e.touches[0].clientY - ctx.panPosition.y,
        });
        setLastDistance(null);
        setLastCenter(null);
      } else if (e.touches.length === 2) {
        // Two touches - prepare for pinch-to-zoom
        setIsDragging(false);

        // Calculate initial distance for pinch zoom
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY,
        );
        setLastDistance(distance);

        // Calculate center point between two touches
        const centerX = (touch1.clientX + touch2.clientX) / 2;
        const centerY = (touch1.clientY + touch2.clientY) / 2;
        setLastCenter({ x: centerX, y: centerY });
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Only process if from the container
      if (!container.contains(e.target as Node)) return;

      if (e.touches.length === 1 && isDragging) {
        // Single touch - handle panning
        e.preventDefault();

        // Apply some resistance/smoothing to make panning feel more natural
        const dampingFactor = 0.8; // Lower = more resistance
        const newX = (e.touches[0].clientX - startPos.x) * dampingFactor;
        const newY = (e.touches[0].clientY - startPos.y) * dampingFactor;

        ctx.setPanPosition({ x: newX, y: newY });
      } else if (
        e.touches.length === 2 &&
        lastDistance !== null &&
        lastCenter !== null
      ) {
        // Two touches - handle pinch-to-zoom
        e.preventDefault();

        const touch1 = e.touches[0];
        const touch2 = e.touches[1];

        // Calculate new distance
        const newDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY,
        );

        // Calculate zoom ratio with lower sensitivity
        const zoomSensitivity = 0.5; // Lower = less sensitive
        const ratio = 1 + (newDistance / lastDistance - 1) * zoomSensitivity;

        // Calculate center point between touches
        const newCenterX = (touch1.clientX + touch2.clientX) / 2;
        const newCenterY = (touch1.clientY + touch2.clientY) / 2;

        // Calculate new scale
        const newScale = ctx.scale * ratio;

        // Calculate pan position to zoom toward the center of the pinch
        const rect = container.getBoundingClientRect();
        const containerX = newCenterX - rect.left;
        const containerY = newCenterY - rect.top;

        const newPanX =
          ctx.panPosition.x - (containerX - ctx.panPosition.x) * (ratio - 1);
        const newPanY =
          ctx.panPosition.y - (containerY - ctx.panPosition.y) * (ratio - 1);

        // Update state
        ctx.setScale(newScale);
        ctx.setPanPosition({ x: newPanX, y: newPanY });

        // Store new distance for next move event
        setLastDistance(newDistance);
        setLastCenter({ x: newCenterX, y: newCenterY });
      }
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      setLastDistance(null);
      setLastCenter(null);
    };

    // Add momentum-based panning for more natural feel
    let momentum = { x: 0, y: 0 };
    let lastPanPosition = { ...ctx.panPosition };
    let animationFrameId: number;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const updateMomentum = () => {
      if (
        !isDragging &&
        (Math.abs(momentum.x) > 0.1 || Math.abs(momentum.y) > 0.1)
      ) {
        // Apply momentum with friction
        momentum.x *= 0.95;
        momentum.y *= 0.95;

        ctx.setPanPosition({
          x: ctx.panPosition.x + momentum.x,
          y: ctx.panPosition.y + momentum.y,
        });

        animationFrameId = requestAnimationFrame(updateMomentum);
      }
    };

    const calculateMomentum = () => {
      if (isDragging) {
        momentum = {
          x: ctx.panPosition.x - lastPanPosition.x,
          y: ctx.panPosition.y - lastPanPosition.y,
        };
        lastPanPosition = { ...ctx.panPosition };
      }

      animationFrameId = requestAnimationFrame(calculateMomentum);
    };

    // Support keyboard navigation for accessibility
    const handleKeyDown = (e: KeyboardEvent) => {
      const panStep = 20;
      const zoomStep = 0.1;

      switch (e.key) {
        case "ArrowUp":
          ctx.setPanPosition({
            ...ctx.panPosition,
            y: ctx.panPosition.y + panStep,
          });
          break;
        case "ArrowDown":
          ctx.setPanPosition({
            ...ctx.panPosition,
            y: ctx.panPosition.y - panStep,
          });
          break;
        case "ArrowLeft":
          ctx.setPanPosition({
            ...ctx.panPosition,
            x: ctx.panPosition.x + panStep,
          });
          break;
        case "ArrowRight":
          ctx.setPanPosition({
            ...ctx.panPosition,
            x: ctx.panPosition.x - panStep,
          });
          break;
        case "+":
          ctx.setScale(ctx.scale + zoomStep);
          break;
        case "-":
          ctx.setScale(ctx.scale - zoomStep);
          break;
        case "0":
          ctx.resetView();
          break;
      }
    };

    // Start momentum calculation
    calculateMomentum();

    // Add event listeners to entire container
    container.addEventListener("wheel", handleScroll, { passive: false });
    container.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    container.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    container.addEventListener("touchend", handleTouchEnd);
    container.addEventListener("keydown", handleKeyDown);

    // Ensure we're capturing events from the container itself
    const handleContainerClick = () => {
      container.focus();
    };

    container.addEventListener("click", handleContainerClick);

    return () => {
      // Clean up
      container.removeEventListener("wheel", handleScroll);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      container.removeEventListener("keydown", handleKeyDown);
      container.removeEventListener("click", handleContainerClick);

      cancelAnimationFrame(animationFrameId);
    };
  }, [ctx, isDragging, startPos, lastDistance, lastCenter]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-hidden"
      tabIndex={0}
      aria-label="Zoomable content"
    >
      <div
        ref={contentRef}
        className={`${props.className} transition-transform duration-100`}
        style={{
          transform: `scale(${ctx.scale}) translate(${ctx.panPosition.x / ctx.scale}px, ${ctx.panPosition.y / ctx.scale}px)`,
          transformOrigin: "0 0",
          width: "fit-content",
          minWidth: "100%",
          minHeight: "100%",
          touchAction: "none",
        }}
      >
        {props.children}
      </div>
    </div>
  );
};

export const ZoomControls = (props: {
  disabled?: boolean;
  showPanControls?: boolean;
  minimal?: boolean;
}) => {
  const ctx = useContext(ZoomContext);

  if (ctx == null) {
    throw new Error("Component must be used with ZoomProvider");
  }

  if (props.minimal) {
    return (
      <div className="fixed bottom-8 right-8 flex items-center gap-1 rounded-full border border-secondary-400 bg-white p-1 shadow-lg">
        <Button
          disabled={props.disabled}
          variant="ghost"
          className="p-2 rounded-full"
          onClick={ctx.zoomOut}
          aria-label="Zoom out"
        >
          <CareIcon icon="l-search-minus" className="text-base" />
        </Button>

        <span className="text-xs font-semibold text-secondary-800 min-w-8 text-center">
          {Math.round(ctx.scale * 100)}%
        </span>

        <Button
          disabled={props.disabled}
          variant="ghost"
          className="p-2 rounded-full"
          onClick={ctx.zoomIn}
          aria-label="Zoom in"
        >
          <CareIcon icon="l-search-plus" className="text-base" />
        </Button>

        <div className="h-4 w-px bg-secondary-300 mx-1" />

        <Button
          disabled={props.disabled}
          variant="ghost"
          className="p-2 rounded-full"
          onClick={ctx.resetView}
          aria-label="Reset view"
        >
          <CareIcon icon="l-refresh" className="text-base" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-8 right-8 flex flex-col items-center justify-center gap-1 rounded-full border border-secondary-400 bg-white p-0.5 shadow-lg md:flex-row-reverse md:gap-2">
      <Button
        disabled={props.disabled}
        variant="ghost"
        className="p-2.5 rounded-full"
        onClick={ctx.zoomIn}
        aria-label="Zoom in"
      >
        <CareIcon icon="l-search-plus" className="text-lg" />
      </Button>

      <span className="text-sm font-semibold text-secondary-800">
        {Math.round(ctx.scale * 100)}%
      </span>

      <Button
        disabled={props.disabled}
        variant="ghost"
        className="p-2.5 rounded-full"
        onClick={ctx.zoomOut}
        aria-label="Zoom out"
      >
        <CareIcon icon="l-search-minus" className="text-lg" />
      </Button>

      <div className="h-4 w-px bg-secondary-300 mx-1" />

      <Button
        disabled={props.disabled}
        variant="ghost"
        className="p-2.5 rounded-full"
        onClick={ctx.resetView}
        aria-label="Reset view"
      >
        <CareIcon icon="l-refresh" className="text-lg" />
      </Button>
    </div>
  );
};

export const usePanZoom = () => {
  const ctx = useContext(ZoomContext);
  if (ctx == null) {
    throw new Error("Hook must be used within ZoomProvider");
  }
  return ctx;
};
