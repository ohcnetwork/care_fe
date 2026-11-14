/**
 * @name tooltip
 * @description A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.
 * @dependencies @base-ui/react
 * @type registry:ui
 */
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import * as React from "react";

import {
  type RenderProp,
  resolveAsChild,
} from "@/components/ui/overlay-compat";
import { cn } from "@/lib/utils";

const TooltipDelayContext = React.createContext<{
  delay: number;
  disableHoverableContent?: boolean;
}>({ delay: 0 });

function TooltipProvider({
  delay,
  delayDuration = 0,
  skipDelayDuration,
  disableHoverableContent,
  children,
  ...props
}: TooltipPrimitive.Provider.Props & {
  delayDuration?: number;
  skipDelayDuration?: number;
  disableHoverableContent?: boolean;
}) {
  const context = React.useMemo(
    () => ({ delay: delay ?? delayDuration, disableHoverableContent }),
    [delay, delayDuration, disableHoverableContent],
  );
  return (
    <TooltipDelayContext.Provider value={context}>
      <TooltipPrimitive.Provider
        data-slot="tooltip-provider"
        delay={context.delay}
        timeout={skipDelayDuration}
        {...props}
      >
        {children}
      </TooltipPrimitive.Provider>
    </TooltipDelayContext.Provider>
  );
}

function Tooltip({
  delayDuration,
  disableHoverableContent,
  disableHoverablePopup,
  ...props
}: TooltipPrimitive.Root.Props & {
  delayDuration?: number;
  disableHoverableContent?: boolean;
}) {
  const inherited = React.useContext(TooltipDelayContext);
  const context = React.useMemo(
    () => ({
      delay: delayDuration ?? inherited.delay,
      disableHoverableContent:
        disableHoverableContent ?? inherited.disableHoverableContent,
    }),
    [delayDuration, disableHoverableContent, inherited],
  );
  return (
    <TooltipDelayContext.Provider value={context}>
      <TooltipPrimitive.Root
        data-slot="tooltip"
        disableHoverablePopup={
          disableHoverablePopup ?? context.disableHoverableContent
        }
        {...props}
      />
    </TooltipDelayContext.Provider>
  );
}

function TooltipTrigger({
  asChild,
  render,
  children,
  ...props
}: Omit<TooltipPrimitive.Trigger.Props, "render"> & {
  asChild?: boolean;
  render?: RenderProp;
}) {
  const { delay } = React.useContext(TooltipDelayContext);
  const resolved = resolveAsChild(asChild, children, render);
  return (
    <TooltipPrimitive.Trigger
      data-slot="tooltip-trigger"
      delay={delay}
      render={resolved.render}
      {...props}
    >
      {resolved.children}
    </TooltipPrimitive.Trigger>
  );
}

function TooltipContent({
  className,
  side = "top",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  children,
  ...props
}: TooltipPrimitive.Popup.Props &
  Pick<
    TooltipPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  >) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          className={cn(
            "bg-foreground text-background data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 z-50 inline-flex w-fit max-w-xs origin-(--transform-origin) items-center gap-1.5 rounded-md px-3 py-1.5 text-xs has-data-[slot=kbd]:pr-1.5 **:data-[slot=kbd]:relative **:data-[slot=kbd]:isolate **:data-[slot=kbd]:z-50 **:data-[slot=kbd]:rounded-sm",
            className,
          )}
          {...props}
        >
          {children}
          <TooltipPrimitive.Arrow className="bg-foreground fill-foreground z-50 size-2.5 translate-y-[calc(-50%-2px)] rotate-45 rounded-[2px] data-[side=bottom]:top-1 data-[side=inline-end]:top-1/2! data-[side=inline-end]:-left-1 data-[side=inline-end]:-translate-y-1/2 data-[side=inline-start]:top-1/2! data-[side=inline-start]:-right-1 data-[side=inline-start]:-translate-y-1/2 data-[side=left]:top-1/2! data-[side=left]:-right-1 data-[side=left]:-translate-y-1/2 data-[side=right]:top-1/2! data-[side=right]:-left-1 data-[side=right]:-translate-y-1/2 data-[side=top]:-bottom-2.5" />
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  );
}

function TooltipComponent({
  children,
  content,
  className,
  ...props
}: Omit<React.ComponentProps<typeof TooltipContent>, "content"> & {
  content: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <Tooltip open={open} onOpenChange={setOpen} delayDuration={0}>
      <TooltipTrigger
        asChild
        closeOnClick={false}
        onClick={() => setOpen((value) => !value)}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent
        className={cn("whitespace-pre-line", className)}
        {...props}
      >
        {content}
      </TooltipContent>
    </Tooltip>
  );
}

export {
  Tooltip,
  TooltipComponent,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
};
