import type { Dialog } from "@base-ui/react/dialog";
import * as React from "react";

/** Compatibility for existing CARE overlay consumers while Base UI owns behavior. */
export interface OverlayContentEvents {
  onOpenAutoFocus?: (event: Event) => void;
  onCloseAutoFocus?: (event: Event) => void;
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  onPointerDownOutside?: (event: CustomEvent<{ originalEvent: Event }>) => void;
  onFocusOutside?: (event: CustomEvent<{ originalEvent: Event }>) => void;
  onInteractOutside?: (event: CustomEvent<{ originalEvent: Event }>) => void;
}

interface OverlayChangeDetails {
  reason: string;
  event: Event;
  cancel: () => void;
}

export const OverlayEventsContext = React.createContext<
  React.RefObject<OverlayContentEvents> | undefined
>(undefined);

export function useOverlayRoot<Details extends OverlayChangeDetails>(
  onOpenChange?: (open: boolean, details: Details) => void,
) {
  const handlersRef = React.useRef<OverlayContentEvents>({});
  const handleOpenChange = React.useCallback(
    (open: boolean, details: Details) => {
      if (!open) {
        // CARE confirmation actions preventDefault while asynchronous work runs.
        if (
          details.reason === "close-press" &&
          details.event.defaultPrevented
        ) {
          details.cancel();
          return;
        }
        const handlers = handlersRef.current;
        if (details.reason === "escape-key") {
          handlers.onEscapeKeyDown?.(details.event as KeyboardEvent);
          if (details.event.defaultPrevented) {
            details.cancel();
            return;
          }
        }
        if (
          details.reason === "outside-press" ||
          details.reason === "focus-out"
        ) {
          const event = new CustomEvent("interactOutside", {
            cancelable: true,
            detail: { originalEvent: details.event },
          });
          if (details.reason === "outside-press") {
            handlers.onPointerDownOutside?.(event);
          } else {
            handlers.onFocusOutside?.(event);
          }
          handlers.onInteractOutside?.(event);
          if (event.defaultPrevented) {
            details.cancel();
            return;
          }
        }
      }
      onOpenChange?.(open, details);
    },
    [onOpenChange],
  );
  return { handlersRef, handleOpenChange };
}

type FocusTarget = Dialog.Popup.Props["initialFocus"];

function withAutoFocusEvent(
  handler: ((event: Event) => void) | undefined,
  target: FocusTarget,
): FocusTarget {
  if (!handler) return target;
  return (interactionType) => {
    const event = new Event("autoFocus", { cancelable: true });
    handler(event);
    if (event.defaultPrevented) return false;
    if (typeof target === "function") return target(interactionType);
    if (typeof target === "object") return target.current;
    return target ?? true;
  };
}

export function useOverlayContent({
  onOpenAutoFocus,
  onCloseAutoFocus,
  onEscapeKeyDown,
  onPointerDownOutside,
  onFocusOutside,
  onInteractOutside,
  initialFocus,
  finalFocus,
}: OverlayContentEvents &
  Pick<Dialog.Popup.Props, "initialFocus" | "finalFocus">) {
  const handlersRef = React.useContext(OverlayEventsContext);
  React.useLayoutEffect(() => {
    if (!handlersRef) return;
    const handlers = {
      onEscapeKeyDown,
      onPointerDownOutside,
      onFocusOutside,
      onInteractOutside,
    };
    handlersRef.current = handlers;
    return () => {
      if (handlersRef.current === handlers) handlersRef.current = {};
    };
  }, [
    handlersRef,
    onEscapeKeyDown,
    onPointerDownOutside,
    onFocusOutside,
    onInteractOutside,
  ]);
  return {
    initialFocus: withAutoFocusEvent(onOpenAutoFocus, initialFocus),
    finalFocus: withAutoFocusEvent(onCloseAutoFocus, finalFocus),
  };
}

export type RenderProp =
  | React.ReactElement
  | ((props: unknown, state: unknown) => React.ReactElement)
  | undefined;

export function resolveAsChild(
  asChild: boolean | undefined,
  children: React.ReactNode,
  render: RenderProp,
) {
  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{
      children?: React.ReactNode;
      [key: string]: unknown;
    }>;
    const { children: childChildren, ...props } = child.props;
    return {
      render: React.createElement(child.type as React.ElementType, props),
      children: childChildren,
      nativeButton:
        typeof child.type === "string" ? child.type === "button" : undefined,
    };
  }
  return { render, children, nativeButton: undefined };
}
