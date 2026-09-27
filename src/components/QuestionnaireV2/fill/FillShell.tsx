import { Minus, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import { useDisableSmoothScroll } from "@/components/QuestionnaireV2/shared/useDisableSmoothScroll";

/** The fullscreen frame (the fill routes opt out of the app sidebar):
 *  fixed viewport shell from md up, z-40 under portals at z-50. Every state of the
 *  fill page — picker, skeleton, loaded session — renders inside it, so
 *  the layout never jumps shells and the close affordance always exists. */
export function FillShell({
  children,
  onClose,
  onMinimize,
  exitDisabled = false,
  minimizeDisabled = false,
  tabs,
}: {
  children: React.ReactNode;
  onClose: () => void;
  onMinimize?: () => void;
  exitDisabled?: boolean;
  minimizeDisabled?: boolean;
  /** Content of the header strip's left side (tab list or plain title). */
  tabs?: React.ReactNode;
}) {
  const { t } = useTranslation();
  useDisableSmoothScroll();

  const minimizeOnEscape = useCallback(
    (event: KeyboardEvent | ReactKeyboardEvent<HTMLDivElement>) => {
      const nativeEvent = "nativeEvent" in event ? event.nativeEvent : event;
      if (
        event.key !== "Escape" ||
        event.defaultPrevented ||
        event.repeat ||
        nativeEvent.isComposing ||
        event.shiftKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        !onMinimize ||
        exitDisabled ||
        minimizeDisabled
      )
        return;

      // Escape belongs to the open picker/dialog first. Checking visible
      // content also covers the closing animation after Radix dismisses it.
      const overlayOpen = Array.from(
        document.querySelectorAll<HTMLElement>(
          '[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"], [data-slot="popover-content"]',
        ),
      ).some((element) => element.getClientRects().length > 0);
      if (
        overlayOpen ||
        (event.target instanceof HTMLElement &&
          event.target.closest(
            'select, [role="combobox"][aria-expanded="true"]',
          ))
      )
        return;

      event.preventDefault();
      event.stopPropagation();
      onMinimize();
    },
    [onMinimize, exitDisabled, minimizeDisabled],
  );

  useEffect(() => {
    // Before a field receives focus, Escape targets the document instead
    // of the shell. Capture only that case ahead of the global shortcut;
    // focused controls keep their own bubbling Escape handlers first.
    const minimizeFromBackground = (event: KeyboardEvent) => {
      if (
        event.target === document.body ||
        event.target === document.documentElement
      ) {
        minimizeOnEscape(event);
      }
    };
    document.addEventListener("keydown", minimizeFromBackground, true);
    return () =>
      document.removeEventListener("keydown", minimizeFromBackground, true);
  }, [minimizeOnEscape]);

  return (
    // -m-4 cancels AppRouter's page-wrapper p-4 below md, where this shell
    <div
      className="-m-4 flex min-h-dvh flex-col bg-gray-100 md:m-0 md:fixed md:inset-0 md:z-40 md:overflow-hidden"
      onKeyDown={minimizeOnEscape}
    >
      {/* min-w-0 + overflow on the strip: a long questionnaire title (or
          the two tabs) scrolls within its own row on narrow screens
          instead of pushing the close button off-viewport. */}
      <div className="sticky top-0 z-10 flex shrink-0 items-end justify-between gap-2 bg-gray-200 px-4 pt-3 md:px-6">
        <div className="min-w-0 flex-1 overflow-x-auto">{tabs ?? <div />}</div>
        <div
          className="mb-2 flex shrink-0 items-center gap-2"
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.ctrlKey &&
              !event.metaKey &&
              !event.altKey
            ) {
              // Preserve native activation despite the global Enter shortcut.
              event.stopPropagation();
            }
          }}
        >
          {onMinimize && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="w-auto shrink-0 gap-1.5 border-gray-300 px-2.5 shadow-xs"
              aria-label={t("minimize")}
              aria-keyshortcuts="Escape"
              title={t("fill_minimize_keep_draft")}
              disabled={exitDisabled || minimizeDisabled}
              onClick={onMinimize}
            >
              <Minus className="size-4" aria-hidden />
              <kbd
                aria-hidden
                className="hidden rounded border border-gray-200 bg-gray-50 px-1 text-[10px] font-medium text-gray-500 sm:inline-flex"
              >
                {t("esc")}
              </kbd>
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0 border-gray-300 shadow-xs hover:border-red-300 hover:bg-red-50 hover:text-red-700"
            aria-label={t("close")}
            title={onMinimize ? t("fill_close_discard_draft") : t("close")}
            disabled={exitDisabled}
            onClick={onClose}
          >
            <X className="size-4" aria-hidden />
          </Button>
        </div>
      </div>
      {children}
    </div>
  );
}
