import { useLayoutEffect } from "react";

/**
 * `html { scroll-smooth }` (global, for in-page anchor jumps) animates
 * EVERY scroll on the document — including the browser's own scroll-offset
 * corrections as its address bar hides/shows on mobile. Animating those
 * makes the page appear to bounce up and down instead of adjusting
 * instantly. Fullscreen shells that scroll the document on mobile (Fill,
 * Studio) opt out while mounted.
 */
export function useDisableSmoothScroll() {
  useLayoutEffect(() => {
    const root = document.documentElement;
    const previous = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    return () => {
      root.style.scrollBehavior = previous;
    };
  }, []);
}
