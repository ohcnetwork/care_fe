/**
 * @name drawer
 * @description A drawer component for React, built on top of Base UI.
 * @dependencies @base-ui/react lucide-react button
 * @type registry:ui
 */
import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer";
import { XIcon } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  OverlayEventsContext,
  resolveAsChild,
  useOverlayContent,
  useOverlayRoot,
  type OverlayContentEvents,
  type RenderProp,
} from "@/components/ui/overlay-compat";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Direction compat shim (vaul "bottom"/"top" → Base UI "down"/"up")
// ---------------------------------------------------------------------------
function mapDirection(dir: string): "up" | "down" | "left" | "right" {
  const map: Record<string, "up" | "down" | "left" | "right"> = {
    bottom: "down",
    top: "up",
    left: "left",
    right: "right",
  };
  return (map[dir] ?? dir) as "up" | "down" | "left" | "right";
}

// ---------------------------------------------------------------------------
// asChild → render shim (vaul/Radix pattern → Base UI render prop)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// DrawerContext — upstream shape + local size addition
// ---------------------------------------------------------------------------
type DrawerContextProps = {
  hasSnapPoints: boolean;
  modal: DrawerPrimitive.Root.Props["modal"];
  showSwipeHandle: boolean;
  swipeDirection: NonNullable<DrawerPrimitive.Root.Props["swipeDirection"]>;
  repositionInputs: boolean;
};

const DrawerContext = React.createContext<DrawerContextProps | null>(null);

function useDrawer() {
  const context = React.useContext(DrawerContext);
  if (!context) throw new Error("useDrawer must be used within a Drawer.");
  return context;
}

// ---------------------------------------------------------------------------
// Size — used by DrawerContent to constrain the inner content wrapper
// ---------------------------------------------------------------------------
const drawerContainerClasses = {
  md: "mx-auto w-full max-w-lg",
  lg: "mx-auto w-full max-w-2xl",
  full: "",
} as const;

type DrawerSize = keyof typeof drawerContainerClasses;

const DrawerContentSizeContext = React.createContext<DrawerSize>("full");

function useDrawerContentSize() {
  return React.useContext(DrawerContentSizeContext);
}

// ---------------------------------------------------------------------------
// Drawer (Root)
// ---------------------------------------------------------------------------
function Drawer({
  modal = true,
  showSwipeHandle = true,
  snapPoints,
  swipeDirection = "down",
  direction, // backwards compat with vaul
  repositionInputs = true,
  onOpenChange,
  ...props
}: DrawerPrimitive.Root.Props & {
  showSwipeHandle?: boolean;
  /** Existing CARE direction values map to Base UI swipeDirection. */
  direction?: string;
  repositionInputs?: boolean;
}) {
  const { handlersRef, handleOpenChange } = useOverlayRoot(onOpenChange);
  const resolvedDirection = direction
    ? mapDirection(direction)
    : swipeDirection;
  const hasSnapPoints = snapPoints != null && snapPoints.length > 0;
  const contextValue = React.useMemo(
    () => ({
      hasSnapPoints,
      modal,
      showSwipeHandle,
      swipeDirection: resolvedDirection,
      repositionInputs,
    }),
    [
      hasSnapPoints,
      modal,
      showSwipeHandle,
      resolvedDirection,
      repositionInputs,
    ],
  );

  return (
    <OverlayEventsContext.Provider value={handlersRef}>
      <DrawerContext.Provider value={contextValue}>
        <DrawerPrimitive.Root
          data-slot="drawer"
          modal={modal}
          snapPoints={snapPoints}
          swipeDirection={resolvedDirection}
          onOpenChange={handleOpenChange}
          {...props}
        />
      </DrawerContext.Provider>
    </OverlayEventsContext.Provider>
  );
}

// Kept for backwards compat — Base UI handles nesting automatically.
const DrawerNestedRoot = Drawer;

// ---------------------------------------------------------------------------
// DrawerTrigger
// ---------------------------------------------------------------------------
function DrawerTrigger({
  asChild,
  render,
  children,
  ...props
}: Omit<DrawerPrimitive.Trigger.Props, "render"> & {
  asChild?: boolean;
  render?: RenderProp;
}) {
  const resolved = resolveAsChild(asChild, children, render);
  return (
    <DrawerPrimitive.Trigger
      data-slot="drawer-trigger"
      render={resolved.render}
      nativeButton={resolved.nativeButton}
      {...props}
    >
      {resolved.children}
    </DrawerPrimitive.Trigger>
  );
}

// ---------------------------------------------------------------------------
// DrawerPortal
// ---------------------------------------------------------------------------
function DrawerPortal({ ...props }: DrawerPrimitive.Portal.Props) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />;
}

// ---------------------------------------------------------------------------
// DrawerClose
// ---------------------------------------------------------------------------
function DrawerClose({
  asChild,
  render,
  children,
  ...props
}: Omit<DrawerPrimitive.Close.Props, "render"> & {
  asChild?: boolean;
  render?: RenderProp;
}) {
  const resolved = resolveAsChild(asChild, children, render);
  return (
    <DrawerPrimitive.Close
      data-slot="drawer-close"
      render={resolved.render}
      nativeButton={resolved.nativeButton}
      {...props}
    >
      {resolved.children}
    </DrawerPrimitive.Close>
  );
}

// ---------------------------------------------------------------------------
// DrawerOverlay (Backdrop) — upstream: animated opacity tied to swipe progress
// ---------------------------------------------------------------------------
function DrawerOverlay({
  className,
  ...props
}: DrawerPrimitive.Backdrop.Props) {
  return (
    <DrawerPrimitive.Backdrop
      data-slot="drawer-overlay"
      className={cn(
        "fixed inset-0 z-50 min-h-dvh bg-black/30 select-none",
        "opacity-[max(var(--drawer-overlay-min-opacity,0),calc(1-var(--drawer-swipe-progress)))]",
        "transition-opacity duration-450 ease-[cubic-bezier(0.32,0.72,0,1)]",
        "data-ending-style:pointer-events-none data-ending-style:opacity-0",
        "data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)]",
        "data-snap-points:[--drawer-overlay-min-opacity:0.5]",
        "data-starting-style:opacity-0 data-swiping:duration-0",
        "motion-reduce:transition-opacity motion-reduce:duration-150 motion-reduce:data-ending-style:duration-150 motion-reduce:data-starting-style:duration-150",
        "supports-backdrop-filter:backdrop-blur-sm",
        "supports-[-webkit-touch-callout:none]:absolute",
        className,
      )}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// DrawerSwipeHandle — from upstream
// ---------------------------------------------------------------------------
function DrawerSwipeHandle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-swipe-handle"
      aria-hidden="true"
      className={cn(
        "relative z-10 flex shrink-0 cursor-grab transition-opacity duration-200",
        "group-data-nested-drawer-open/drawer-popup:opacity-0 group-data-nested-drawer-swiping/drawer-popup:opacity-100",
        "group-data-[swipe-axis=x]/drawer-popup:h-full group-data-[swipe-axis=x]/drawer-popup:w-3 group-data-[swipe-axis=x]/drawer-popup:items-center",
        "group-data-[swipe-axis=y]/drawer-popup:h-3 group-data-[swipe-axis=y]/drawer-popup:w-full group-data-[swipe-axis=y]/drawer-popup:justify-center",
        "group-data-[swipe-direction=down]/drawer-popup:items-end",
        "group-data-[swipe-direction=left]/drawer-popup:order-last group-data-[swipe-direction=left]/drawer-popup:justify-start",
        "group-data-[swipe-direction=right]/drawer-popup:justify-end",
        "group-data-[swipe-direction=up]/drawer-popup:order-last group-data-[swipe-direction=up]/drawer-popup:items-start",
        "after:bg-strong-background after:block after:shrink-0 after:rounded-full",
        "group-data-[swipe-axis=x]/drawer-popup:after:h-25 group-data-[swipe-axis=x]/drawer-popup:after:w-1.5",
        "group-data-[swipe-axis=y]/drawer-popup:after:h-1.5 group-data-[swipe-axis=y]/drawer-popup:after:w-25",
        "active:cursor-grabbing",
        className,
      )}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// DrawerContent — upstream Viewport + Popup + Content structure
// Local additions: size prop, showSwipeHandle from context
// ---------------------------------------------------------------------------
function DrawerContent({
  className,
  children,
  size = "full",
  initialFocus,
  finalFocus,
  onOpenAutoFocus,
  onCloseAutoFocus,
  onEscapeKeyDown,
  onInteractOutside,
  onPointerDownOutside,
  onFocusOutside,
  ...props
}: DrawerPrimitive.Popup.Props &
  OverlayContentEvents & {
    size?: DrawerSize;
  }) {
  const {
    hasSnapPoints,
    modal,
    showSwipeHandle,
    swipeDirection,
    repositionInputs,
  } = useDrawer();
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
  const KeyboardProvider = repositionInputs
    ? DrawerPrimitive.VirtualKeyboardProvider
    : React.Fragment;
  const swipeAxis =
    swipeDirection === "down" || swipeDirection === "up" ? "y" : "x";

  return (
    <DrawerPortal>
      {modal === true && (
        <DrawerOverlay data-snap-points={hasSnapPoints ? "" : undefined} />
      )}
      <KeyboardProvider>
        <DrawerPrimitive.Viewport
          data-slot="drawer-viewport"
          data-modal={modal}
          className="pointer-events-none fixed inset-0 z-50 select-none data-[modal=true]:pointer-events-auto"
        >
          <DrawerPrimitive.Popup
            data-slot="drawer-popup"
            {...focusProps}
            data-swipe-axis={swipeAxis}
            data-snap-points={hasSnapPoints ? "" : undefined}
            className={cn(
              // Base
              "group/drawer-popup pointer-events-auto fixed z-50 m-(--drawer-inset,0px) flex",
              "h-(--drawer-content-height) max-h-(--drawer-content-max-height,none) min-h-0 w-(--drawer-content-width,auto)",
              "transform-[translate3d(var(--translate-x,0px),var(--translate-y,0px),0)_scale(var(--stack-scale))]",
              "border-popover bg-popover flex-col border",
              "data-[swipe-direction=down]:rounded-t-[min(var(--radius-xl),24px)] data-[swipe-direction=down]:rounded-b-none",
              "data-[swipe-direction=up]:rounded-t-none data-[swipe-direction=up]:rounded-b-[min(var(--radius-xl),24px)]",
              "data-[swipe-direction=left]:rounded-l-none data-[swipe-direction=left]:rounded-r-[min(var(--radius-xl),24px)]",
              "data-[swipe-direction=right]:rounded-l-[min(var(--radius-xl),24px)] data-[swipe-direction=right]:rounded-r-none",
              "text-popover-foreground text-sm shadow-xl outline-none select-none",
              "transition-[transform,height,opacity,filter] duration-450 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform",
              "[--drawer-bleed-background:transparent] [--drawer-inset:0px]",
              "[--drawer-stacked-shadow:0_-20px_25px_-5px_rgb(0_0_0/0.1),0_-8px_10px_-6px_rgb(0_0_0/0.1)]",
              "[interpolate-size:allow-keywords]",
              "dark:border-border data-[swipe-direction=down]:data-nested-drawer-open:shadow-(--drawer-stacked-shadow)",
              // Nested
              "data-nested-drawer-open:overflow-hidden data-nested-drawer-open:brightness-95",
              // Bleed
              "after:pointer-events-none after:absolute after:bg-(--drawer-bleed-background,var(--color-popover))",
              "data-[swipe-axis=x]:after:inset-y-0 data-[swipe-axis=x]:after:w-(--bleed)",
              "data-[swipe-axis=y]:after:inset-x-0 data-[swipe-axis=y]:after:h-(--bleed)",
              "data-[swipe-direction=down]:after:top-full data-[swipe-direction=left]:after:right-full",
              "data-[swipe-direction=right]:after:left-full data-[swipe-direction=up]:after:bottom-full",
              // Sizing
              "[--drawer-content-height:var(--drawer-height,auto)]",
              "data-[swipe-axis=x]:[--drawer-content-width:75%] data-[swipe-axis=y]:[--drawer-content-max-height:calc(100dvh-6rem-var(--drawer-keyboard-inset,0px))]",
              "data-[swipe-axis=y]:data-snap-points:[--drawer-content-height:100dvh]",
              "data-[swipe-axis=x]:sm:[--drawer-content-width:24rem]",
              // Stack
              "[--bleed:3rem] [--peek:1rem]",
              "[--stack-height:var(--drawer-frontmost-height,var(--drawer-height,0px))]",
              "[--stack-peek-offset:max(0px,calc((var(--nested-drawers)-var(--stack-progress))*var(--peek)))]",
              "[--stack-progress:clamp(0,var(--drawer-swipe-progress),1)]",
              "[--stack-scale-base:max(0,calc(1-(var(--nested-drawers)*var(--stack-step))))]",
              "[--stack-scale:clamp(0,calc(var(--stack-scale-base)+(var(--stack-step)*var(--stack-progress))),1)]",
              "[--stack-shrink:calc(1-var(--stack-scale))] [--stack-step:0.05]",
              // Transitions
              "data-ending-style:transform-(--closed-transform) data-ending-style:opacity-[0.9999]",
              "data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)]",
              "data-nested-drawer-swiping:duration-0",
              "data-ending-style:data-nested-drawer-swiping:duration-[calc(var(--drawer-swipe-strength)*400ms)]",
              "data-starting-style:transform-(--closed-transform) data-swiping:duration-0",
              "data-ending-style:data-swiping:duration-[calc(var(--drawer-swipe-strength)*400ms)]",
              "motion-reduce:transition-opacity motion-reduce:duration-150",
              "motion-reduce:data-starting-style:transform-none motion-reduce:data-starting-style:opacity-0 motion-reduce:data-starting-style:duration-150",
              "motion-reduce:data-ending-style:transform-none motion-reduce:data-ending-style:opacity-0 motion-reduce:data-ending-style:duration-150",
              // Axis: y
              "data-[swipe-axis=y]:inset-x-0 data-[swipe-axis=y]:data-nested-drawer-open:h-(--stack-height)",
              // Axis: x
              "data-[swipe-axis=x]:inset-y-0 data-[swipe-axis=x]:flex-row",
              // Direction: down
              "data-[swipe-direction=down]:bottom-[var(--drawer-keyboard-inset,0px)] data-[swipe-direction=down]:origin-bottom",
              "data-[swipe-direction=down]:[--closed-transform:translate3d(0,calc(100%+var(--drawer-inset,0px)+2px),0)]",
              "data-[swipe-direction=down]:[--translate-y:calc(var(--drawer-snap-point-offset,0px)+var(--drawer-swipe-movement-y)-var(--stack-peek-offset)-(var(--stack-shrink)*var(--stack-height)))]",
              // Direction: up
              "data-[swipe-direction=up]:top-0 data-[swipe-direction=up]:origin-top",
              "data-[swipe-direction=up]:[--closed-transform:translate3d(0,calc(-100%-var(--drawer-inset,0px)-2px),0)]",
              "data-[swipe-direction=up]:[--translate-y:calc(var(--drawer-snap-point-offset,0px)+var(--drawer-swipe-movement-y)+var(--stack-peek-offset)+(var(--stack-shrink)*var(--stack-height)))]",
              // Direction: left
              "data-[swipe-direction=left]:left-0 data-[swipe-direction=left]:origin-left",
              "data-[swipe-direction=left]:[--closed-transform:translate3d(calc(-100%-var(--drawer-inset,0px)-2px),0,0)]",
              "data-[swipe-direction=left]:[--translate-x:calc(var(--drawer-swipe-movement-x)+var(--stack-peek-offset)+(var(--stack-shrink)*100%))]",
              // Direction: right
              "data-[swipe-direction=right]:right-0 data-[swipe-direction=right]:origin-right",
              "data-[swipe-direction=right]:[--closed-transform:translate3d(calc(100%+var(--drawer-inset,0px)+2px),0,0)]",
              "data-[swipe-direction=right]:[--translate-x:calc(var(--drawer-swipe-movement-x)-var(--stack-peek-offset)-(var(--stack-shrink)*100%))]",
              className,
            )}
            {...props}
          >
            {showSwipeHandle && <DrawerSwipeHandle />}
            <DrawerContentSizeContext.Provider value={size}>
              <DrawerPrimitive.Content
                data-slot="drawer-content"
                className={cn(
                  "flex min-h-0 flex-1 flex-col overflow-hidden overscroll-contain rounded-[inherit]",
                  "transition-opacity duration-300 ease-[cubic-bezier(0.45,1.005,0,1.005)] select-text",
                  "group-data-nested-drawer-open/drawer-popup:opacity-0 group-data-nested-drawer-swiping/drawer-popup:opacity-100",
                  "group-data-swiping/drawer-popup:select-none",
                )}
              >
                {children}
              </DrawerPrimitive.Content>
            </DrawerContentSizeContext.Provider>
          </DrawerPrimitive.Popup>
        </DrawerPrimitive.Viewport>
      </KeyboardProvider>
    </DrawerPortal>
  );
}

// ---------------------------------------------------------------------------
// DrawerHeader — upstream layout + local close button
// ---------------------------------------------------------------------------
function DrawerHeader({
  className,
  children,
  showCloseButton = false,
  ...props
}: React.ComponentProps<"div"> & { showCloseButton?: boolean }) {
  const { t } = useTranslation();
  const size = useDrawerContentSize();

  return (
    <div
      data-slot="drawer-header"
      className={cn(
        "relative flex shrink-0 flex-col gap-0.5 p-4 text-left md:gap-1.5",
        drawerContainerClasses[size],
        showCloseButton && "pr-14",
        className,
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DrawerClose asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-0 right-0"
          >
            <XIcon />
            <span className="sr-only">{t("close")}</span>
          </Button>
        </DrawerClose>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// DrawerBody — local addition, not in upstream
// ---------------------------------------------------------------------------
function DrawerBody({ className, ...props }: React.ComponentProps<"div">) {
  const size = useDrawerContentSize();

  return (
    <div
      data-slot="drawer-body"
      className={cn(
        "min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4",
        drawerContainerClasses[size],
        className,
      )}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// DrawerFooter
// ---------------------------------------------------------------------------
function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  const size = useDrawerContentSize();
  return (
    <div
      data-slot="drawer-footer"
      className={cn(
        "bg-soft-background mt-auto flex w-full shrink-0 flex-col gap-2 border-t p-4",
        drawerContainerClasses[size],
        className,
      )}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// DrawerTitle
// ---------------------------------------------------------------------------
function DrawerTitle({ className, ...props }: DrawerPrimitive.Title.Props) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn("text-base text-foreground font-semibold", className)}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// DrawerDescription
// ---------------------------------------------------------------------------
function DrawerDescription({
  className,
  ...props
}: DrawerPrimitive.Description.Props) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn("text-muted-foreground text-sm text-balance", className)}
      {...props}
    />
  );
}

export {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerNestedRoot,
  DrawerOverlay,
  DrawerPortal,
  DrawerSwipeHandle,
  DrawerTitle,
  DrawerTrigger,
};
