/**
 * @name hover-card
 * @description For sighted users to preview content available behind a link.
 * @dependencies @base-ui/react
 * @type registry:ui
 */
import { PreviewCard as PreviewCardPrimitive } from "@base-ui/react/preview-card";
import * as React from "react";

import {
  type RenderProp,
  resolveAsChild,
} from "@/components/ui/overlay-compat";
import { cn } from "@/lib/utils";

const HoverCardDelayContext = React.createContext<{
  delay?: number;
  closeDelay?: number;
}>({});

function HoverCard({
  openDelay,
  closeDelay,
  ...props
}: PreviewCardPrimitive.Root.Props & {
  openDelay?: number;
  closeDelay?: number;
}) {
  const context = React.useMemo(
    () => ({ delay: openDelay, closeDelay }),
    [openDelay, closeDelay],
  );
  return (
    <HoverCardDelayContext.Provider value={context}>
      <PreviewCardPrimitive.Root data-slot="hover-card" {...props} />
    </HoverCardDelayContext.Provider>
  );
}

function HoverCardTrigger({
  asChild,
  render,
  children,
  ...props
}: Omit<PreviewCardPrimitive.Trigger.Props, "render"> & {
  asChild?: boolean;
  render?: RenderProp;
}) {
  const delays = React.useContext(HoverCardDelayContext);
  const resolved = resolveAsChild(asChild, children, render);
  return (
    <PreviewCardPrimitive.Trigger
      data-slot="hover-card-trigger"
      {...delays}
      render={resolved.render}
      {...props}
    >
      {resolved.children}
    </PreviewCardPrimitive.Trigger>
  );
}

function HoverCardContent({
  className,
  side = "bottom",
  sideOffset = 4,
  align = "center",
  alignOffset = 4,
  ...props
}: PreviewCardPrimitive.Popup.Props &
  Pick<
    PreviewCardPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  >) {
  return (
    <PreviewCardPrimitive.Portal data-slot="hover-card-portal">
      <PreviewCardPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <PreviewCardPrimitive.Popup
          data-slot="hover-card-content"
          className={cn(
            "bg-popover text-popover-foreground ring-foreground/10 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 z-50 w-64 origin-(--transform-origin) rounded-lg p-4 text-sm shadow-md ring-1 outline-hidden duration-100",
            className,
          )}
          {...props}
        />
      </PreviewCardPrimitive.Positioner>
    </PreviewCardPrimitive.Portal>
  );
}

export { HoverCard, HoverCardContent, HoverCardTrigger };
