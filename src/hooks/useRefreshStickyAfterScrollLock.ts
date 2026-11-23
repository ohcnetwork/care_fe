import { useEffect } from "react";

/**
 * Overlays (sheet, drawer, dialog) lock page scroll by setting
 * `overflow: hidden` on <body>. After the lock is released, iOS Safari can leave
 * `position: sticky` elements such as the app header at a stale offset until the
 * next scroll. Nudging the scroll position by a pixel and back, within the same
 * frame, makes Safari recompute them.
 */
export function useRefreshStickyAfterScrollLock() {
  useEffect(() => {
    // Only iOS WebKit (iPadOS included) has the stale sticky offset — the same
    // check the drawer overlay uses.
    if (!CSS.supports("-webkit-touch-callout", "none")) return;
    const { body } = document;
    const isLocked = () => body.style.overflow === "hidden";
    let wasLocked = isLocked();

    const observer = new MutationObserver(() => {
      const locked = isLocked();
      if (wasLocked && !locked) {
        requestAnimationFrame(() => {
          const { scrollY } = window;
          // At the bottom of the page scrollY + 1 is clamped, so nudge toward the start instead.
          const nudge = scrollY > 0 ? scrollY - 1 : scrollY + 1;
          window.scrollTo({ top: nudge, behavior: "instant" });
          window.scrollTo({ top: scrollY, behavior: "instant" });
        });
      }
      wasLocked = locked;
    });

    observer.observe(body, { attributes: true, attributeFilter: ["style"] });
    return () => observer.disconnect();
  }, []);
}
