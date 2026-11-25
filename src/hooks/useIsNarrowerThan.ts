import { useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

/**
 * Whether an element's content box is narrower than `width`, kept current
 * with a ResizeObserver. Use it when a layout depends on the space an element
 * gets rather than on the viewport, for example beside a sidebar that opens
 * and closes.
 *
 * It re-renders only when the answer changes, not on every resize. Updates
 * are flushed in the observer's callback, which runs after layout and before
 * paint, so the first answer lands without a flash of the other layout.
 */
export function useIsNarrowerThan<T extends HTMLElement>(width: number) {
  const ref = useRef<T>(null);
  const [narrower, setNarrower] = useState(false);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      flushSync(() => setNarrower(entry.contentRect.width < width));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [width]);

  return [ref, narrower] as const;
}
