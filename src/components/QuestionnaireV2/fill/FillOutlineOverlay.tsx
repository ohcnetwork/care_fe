import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

/**
 * The fill page's outline navigation chrome (≥lg): a slim always-visible
 * rail of per-question tick marks hugging the canvas' left edge, and the
 * full outline panel that floats OVER the canvas on hover/focus/click —
 * per the reference, the outline no longer reserves a fixed column, so
 * the form gets the whole width.
 *
 * This module owns the overlay shell and the shared nav state (active
 * question + scroll command). The rows and ticks themselves are portaled
 * in per form by `FillFormSection` — they must render inside each form's
 * provider to read that form's store — so this component only provides
 * the host elements.
 */

interface FillOutlineNavValue {
  /** The question whose block currently tops the canvas viewport (any
   *  depth — consumers map it to the row/tick they actually render). */
  activeQuestionId: string | null;
  /** `focus` moves keyboard focus to the question's input (or its block)
   *  as well — keyboard activation of an outline row must land the user
   *  AT the question, not leave them parked inside the overlay. */
  scrollToQuestion: (questionId: string, options?: { focus?: boolean }) => void;
}

const FillOutlineNavContext = createContext<FillOutlineNavValue>({
  activeQuestionId: null,
  scrollToQuestion: () => {},
});

export function useFillOutlineNav(): FillOutlineNavValue {
  return useContext(FillOutlineNavContext);
}

/**
 * Scroll-spy over the canvas' `[data-question-id]` anchors: the active
 * question is the last block whose top sits above the tracking line
 * (96px into the scroll viewport), so it flips exactly when a block
 * scrolls under the reader's eye. Recomputes on scroll/resize and on DOM
 * mutations (enable_when showing/hiding blocks, forms added or removed).
 */
function useActiveQuestionId(container: HTMLElement | null): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!container) return;
    let frame = 0;
    const compute = () => {
      frame = 0;
      const blocks =
        container.querySelectorAll<HTMLElement>("[data-question-id]");
      if (blocks.length === 0) {
        setActiveId(null);
        return;
      }
      const viewportTop = container.getBoundingClientRect().top;
      // Document order puts a group before its children, so "last block
      // above the line" naturally descends into sub-questions as they
      // pass it.
      let current: HTMLElement | undefined;
      for (const block of blocks) {
        if (block.getBoundingClientRect().top - viewportTop <= 96) {
          current = block;
        }
      }
      setActiveId((current ?? blocks[0]).dataset.questionId ?? null);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(compute);
    };

    compute();
    container.addEventListener("scroll", schedule, { passive: true });
    const resizeObserver = new ResizeObserver(schedule);
    resizeObserver.observe(container);
    const mutationObserver = new MutationObserver(schedule);
    mutationObserver.observe(container, { childList: true, subtree: true });
    return () => {
      container.removeEventListener("scroll", schedule);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [container]);

  return activeId;
}

export function FillOutlineNavProvider({
  scrollContainer,
  children,
}: {
  /** The canvas' scrolling element — anchors are queried inside it. */
  scrollContainer: HTMLElement | null;
  children: React.ReactNode;
}) {
  const spyActiveId = useActiveQuestionId(scrollContainer);
  // A row click PINS its question as active: near the scroll floor the
  // chosen block can never top the viewport, so pure scroll-spy would
  // highlight an earlier question than the one the clinician just picked.
  // The pin yields the moment they scroll themselves.
  const [pinnedId, setPinnedId] = useState<string | null>(null);

  useEffect(() => {
    if (!scrollContainer || pinnedId === null) return;
    const release = () => setPinnedId(null);
    scrollContainer.addEventListener("wheel", release, { passive: true });
    scrollContainer.addEventListener("touchstart", release, { passive: true });
    return () => {
      scrollContainer.removeEventListener("wheel", release);
      scrollContainer.removeEventListener("touchstart", release);
    };
  }, [scrollContainer, pinnedId]);

  const scrollToQuestion = useCallback(
    (questionId: string, options?: { focus?: boolean }) => {
      setPinnedId(questionId);
      const root: ParentNode = scrollContainer ?? document;
      const block = root.querySelector<HTMLElement>(
        `[data-question-id="${CSS.escape(questionId)}"]`,
      );
      if (!block) return;
      block.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start",
      });
      if (!options?.focus) return;
      // Same landing rule as the submit path's scroll-to-error: the
      // question's own input when it has one, the block itself otherwise.
      const input = document.getElementById(`question-input-${questionId}`);
      if (input) {
        input.focus({ preventScroll: true });
        return;
      }
      block.setAttribute("tabindex", "-1");
      block.focus({ preventScroll: true });
    },
    [scrollContainer],
  );

  const activeQuestionId = pinnedId ?? spyActiveId;
  const value = useMemo(
    () => ({ activeQuestionId, scrollToQuestion }),
    [activeQuestionId, scrollToQuestion],
  );
  return (
    <FillOutlineNavContext.Provider value={value}>
      {children}
    </FillOutlineNavContext.Provider>
  );
}

const PANEL_ID = "fill-outline-panel";

/**
 * The overlay shell. Interaction model: hovering or focusing the rail
 * opens the panel; leaving both (or Escape, or focus moving elsewhere)
 * closes it; the rail is also a plain toggle button for touch and
 * keyboard. The rail stays on top of the open panel — its ticks double
 * as the panel's minimap, exactly as in the reference.
 */
export function FillOutlineOverlay({
  onPanelHost,
  onRailHost,
}: {
  onPanelHost: (element: HTMLElement | null) => void;
  onRailHost: (element: HTMLElement | null) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const rootRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  // What produced the CURRENT click: pointerdown always precedes a
  // pointer click and carries the type; a keyboard "click" (Enter/Space)
  // has no pointerdown, so the empty string means keyboard.
  const clickPointerTypeRef = useRef("");
  // Whether the panel was open when the CURRENT gesture began. A tap on
  // an unfocused button fires pointerdown → focus (which opens the
  // panel) → click; toggling on the click's view of `open` would flash
  // the panel open and shut in that one gesture.
  const openAtPointerDownRef = useRef(false);

  const openPanel = useCallback(() => {
    clearTimeout(closeTimer.current);
    setOpen(true);
  }, []);
  // Grace delay so the pointer can cross from rail to panel (and between
  // panel rows) without the overlay snapping shut.
  const scheduleClose = useCallback(() => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 200);
  }, []);
  useEffect(() => () => clearTimeout(closeTimer.current), []);

  // ALL shell-level dismissal handling rides NATIVE listeners on the root
  // element, never React props. Two reasons: (1) the outline rows and
  // ticks are PORTALED in by each form, and React synthetic events
  // propagate through the tree where a portal is DECLARED — the canvas
  // section — so a root onKeyDown/onBlurCapture would never see an Escape
  // pressed on a panel row; native events follow the DOM tree, which the
  // portal content IS inside. (2) React's synthesized pointerenter/leave
  // pair doesn't fire at all in some embedded browsers that deliver mouse
  // input without the full pointerover/out stream.
  // Hover is mouse-only: on touch, the tap's simulated enter would open
  // the panel an instant before click toggles it shut again.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const enter = (event: PointerEvent) => {
      if (event.pointerType === "mouse") openPanel();
    };
    const leave = (event: PointerEvent) => {
      if (event.pointerType === "mouse") scheduleClose();
    };
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    // Focus leaving the overlay entirely closes it (focusout bubbles;
    // blur does not).
    const focusout = (event: FocusEvent) => {
      if (!root.contains(event.relatedTarget as Node | null)) {
        setOpen(false);
      }
    };
    root.addEventListener("pointerenter", enter);
    root.addEventListener("pointerleave", leave);
    root.addEventListener("keydown", keydown);
    root.addEventListener("focusout", focusout);
    return () => {
      root.removeEventListener("pointerenter", enter);
      root.removeEventListener("pointerleave", leave);
      root.removeEventListener("keydown", keydown);
      root.removeEventListener("focusout", focusout);
    };
  }, [openPanel, scheduleClose]);

  return (
    <div
      ref={rootRef}
      className="absolute inset-y-0 left-0 z-30 hidden lg:block"
    >
      {/* The button comes FIRST in DOM so forward Tab from the rail
          enters the open panel's rows; z-10 keeps the ticks painted on
          top of the panel, per the reference. */}
      <button
        ref={toggleRef}
        type="button"
        aria-expanded={open}
        aria-controls={PANEL_ID}
        aria-label={t("questions_outline")}
        onPointerDown={(event) => {
          clickPointerTypeRef.current = event.pointerType;
          openAtPointerDownRef.current = open;
        }}
        onClick={() => {
          const viaPointer = clickPointerTypeRef.current !== "";
          const viaMouse = clickPointerTypeRef.current === "mouse";
          clickPointerTypeRef.current = "";
          // Mouse users open and close by hovering — reaching the rail
          // already opened the panel, so letting this click toggle would
          // snap it shut the instant they try to "open" it. The toggle
          // branch serves touch and keyboard, which have no hover.
          if (open && viaMouse) return;
          // For a pointer gesture, judge by the state at pointerdown: the
          // tap's own focus event may have just opened the panel, and
          // that same tap must not immediately close it.
          const wasOpen = viaPointer ? openAtPointerDownRef.current : open;
          if (wasOpen) setOpen(false);
          else openPanel();
        }}
        onFocus={(event) => {
          // Open only when focus ARRIVES from outside the overlay —
          // Escape restores focus here from a panel row, and reopening on
          // that would make the panel unclosable by keyboard.
          if (rootRef.current?.contains(event.relatedTarget as Node | null)) {
            return;
          }
          openPanel();
        }}
        className={cn(
          "absolute inset-y-0 left-0 z-10 w-6 rounded-r-lg transition-colors",
          "hover:bg-gray-200/50 focus-visible:bg-gray-200/50 focus-visible:outline-none",
        )}
      >
        {/* Tick marks are decorative — the button itself carries the
            accessible name; each form portals its segment in. h-full +
            flexible segments distribute the ticks over the rail like a
            minimap, so a long session compresses instead of clipping the
            active tick off-screen. */}
        <span
          ref={onRailHost}
          aria-hidden="true"
          className="flex h-full min-h-0 w-full flex-col gap-6 py-8"
        />
      </button>
      <aside
        id={PANEL_ID}
        aria-label={t("questions_outline")}
        inert={!open || undefined}
        className={cn(
          "absolute inset-y-0 left-0 w-80 overflow-y-auto border-r border-gray-300 bg-white/90 shadow-lg backdrop-blur-sm",
          "transition-[opacity,transform] duration-200 motion-reduce:transition-none",
          open
            ? "translate-x-0 opacity-100"
            : "pointer-events-none -translate-x-3 opacity-0",
        )}
      >
        <div ref={onPanelHost} className="flex flex-col gap-6 py-6 pl-7 pr-4" />
      </aside>
    </div>
  );
}
