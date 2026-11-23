import * as React from "react";

import { Button } from "@/components/ui/button";
import type { BaseUIEvent } from "@base-ui/react/types";

// A canceled selection keeps the menu open without suppressing checkbox/radio updates.
const canceledSelections = new WeakSet<object>();

export function menuSelectionHandler(
  onSelect: ((event: Event) => void) | undefined,
  onClick:
    | ((event: BaseUIEvent<React.MouseEvent<HTMLDivElement>>) => void)
    | undefined,
) {
  return (event: BaseUIEvent<React.MouseEvent<HTMLDivElement>>) => {
    // Base UI also invokes onClick with an already-prevented Enter/Space event.
    // Only consumer cancellation should suppress the corresponding selection.
    let clickPrevented = event.type === "click" && event.defaultPrevented;
    if (onClick) {
      const preventDefault = event.preventDefault;
      event.preventDefault = () => {
        clickPrevented = true;
        preventDefault.call(event);
      };
      try {
        onClick(event);
      } finally {
        event.preventDefault = preventDefault;
      }
    }
    if (clickPrevented || event.baseUIHandlerPrevented) {
      event.preventBaseUIHandler();
      return;
    }
    const selection = new Event("careui.menu.select", { cancelable: true });
    onSelect?.(selection);
    if (selection.defaultPrevented) {
      // MenuPopup forwards the synthetic click through its floating tree, while
      // other Base UI change events carry the underlying native event.
      canceledSelections.add(event);
      canceledSelections.add(event.nativeEvent);
    }
  };
}

export function isMenuSelectionCanceled(details: {
  reason: string;
  event: Event;
  cancel: () => void;
}) {
  if (
    details.reason === "item-press" &&
    canceledSelections.has(details.event)
  ) {
    details.cancel();
    return true;
  }
  return false;
}

export const MenuLabelContext = React.createContext(false);

export function menuFinalFocus(onCloseAutoFocus: (event: Event) => void) {
  return () => {
    const event = new Event("careui.menu.close-auto-focus", {
      cancelable: true,
    });
    onCloseAutoFocus(event);
    return !event.defaultPrevented;
  };
}

export function resolveMenuChild<Render>(
  asChild: boolean | undefined,
  children: React.ReactNode,
  render: Render,
) {
  if (
    asChild &&
    React.isValidElement<{ children?: React.ReactNode }>(children)
  ) {
    const { children: content, ...props } = children.props;
    return {
      render: React.createElement(children.type, props),
      children: content,
    };
  }
  return { render, children };
}

export function menuTriggerNativeButton(render: unknown): boolean | undefined {
  if (!React.isValidElement<{ href?: string }>(render)) return undefined;
  if (render.props.href !== undefined) return false;
  if (render.type === Button) return true;
  return typeof render.type === "string" ? render.type === "button" : undefined;
}
