/**
 * @name popover
 * @description Displays rich content in a portal, triggered by a button.
 * @dependencies @base-ui/react
 * @type registry:ui
 */
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { useRender } from "@base-ui/react/use-render";
import * as React from "react";

import {
  OverlayEventsContext,
  resolveAsChild,
  useOverlayContent,
  useOverlayRoot,
  type OverlayContentEvents,
  type RenderProp,
} from "@/components/ui/overlay-compat";
import { cn } from "@/lib/utils";

const PopoverAnchorContext = React.createContext<{
  anchor: HTMLElement | null;
  setAnchor: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
} | null>(null);

function Popover({ onOpenChange, ...props }: PopoverPrimitive.Root.Props) {
  const { handlersRef, handleOpenChange } = useOverlayRoot(onOpenChange);
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
  const context = React.useMemo(() => ({ anchor, setAnchor }), [anchor]);
  return (
    <OverlayEventsContext.Provider value={handlersRef}>
      <PopoverAnchorContext.Provider value={context}>
        <PopoverPrimitive.Root
          data-slot="popover"
          onOpenChange={handleOpenChange}
          {...props}
        />
      </PopoverAnchorContext.Provider>
    </OverlayEventsContext.Provider>
  );
}

function PopoverAnchor({
  asChild,
  children,
  render,
  ref,
  ...props
}: Omit<React.ComponentProps<"div">, "ref"> & {
  asChild?: boolean;
  render?: RenderProp;
  ref?: React.Ref<HTMLElement>;
}) {
  const context = React.useContext(PopoverAnchorContext);
  const resolved = resolveAsChild(asChild, children, render);
  return useRender({
    defaultTagName: "div",
    render: resolved.render,
    ref: [...(ref ? [ref] : []), ...(context ? [context.setAnchor] : [])],
    props: {
      ...props,
      "data-slot": "popover-anchor",
      children: resolved.children,
    },
  });
}

function PopoverTrigger({
  asChild,
  render,
  children,
  ...props
}: Omit<PopoverPrimitive.Trigger.Props, "render"> & {
  asChild?: boolean;
  render?: RenderProp;
}) {
  const resolved = resolveAsChild(asChild, children, render);
  return (
    <PopoverPrimitive.Trigger
      data-slot="popover-trigger"
      render={resolved.render}
      nativeButton={resolved.nativeButton}
      {...props}
    >
      {resolved.children}
    </PopoverPrimitive.Trigger>
  );
}

function PopoverContent({
  className,
  align = "center",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  collisionPadding,
  initialFocus,
  finalFocus,
  onOpenAutoFocus,
  onCloseAutoFocus,
  onEscapeKeyDown,
  onInteractOutside,
  onPointerDownOutside,
  onFocusOutside,
  ref,
  ...props
}: PopoverPrimitive.Popup.Props &
  OverlayContentEvents &
  Pick<
    PopoverPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset" | "collisionPadding"
  > & {
    ref?: React.Ref<HTMLDivElement>;
  }) {
  const context = React.useContext(PopoverAnchorContext);
  const focusProps = useOverlayContent({
    onOpenAutoFocus,
    onCloseAutoFocus,
    onEscapeKeyDown,
    onInteractOutside,
    onPointerDownOutside,
    onFocusOutside,
    initialFocus,
    finalFocus,
  });
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        anchor={context?.anchor ?? undefined}
        collisionPadding={collisionPadding}
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <PopoverPrimitive.Popup
          ref={ref}
          data-slot="popover-content"
          {...focusProps}
          className={cn(
            "bg-popover text-popover-foreground ring-foreground/10 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 dark:bg-soft-background z-50 flex w-72 origin-(--transform-origin) flex-col gap-4 rounded-md p-4 text-sm shadow-xl ring-1 outline-hidden duration-100",
            className,
          )}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}

function PopoverHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="popover-header"
      className={cn("flex flex-col gap-1 text-sm", className)}
      {...props}
    />
  );
}

function PopoverTitle({ className, ...props }: PopoverPrimitive.Title.Props) {
  return (
    <PopoverPrimitive.Title
      data-slot="popover-title"
      className={cn("font-medium", className)}
      {...props}
    />
  );
}

function PopoverDescription({
  className,
  ...props
}: PopoverPrimitive.Description.Props) {
  return (
    <PopoverPrimitive.Description
      data-slot="popover-description"
      className={cn("text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
};
