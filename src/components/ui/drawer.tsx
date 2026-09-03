import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer";
import * as React from "react";

import { cn } from "@/lib/utils";

type DrawerDirection = "top" | "bottom" | "left" | "right";

interface DrawerProps extends React.ComponentProps<
  typeof DrawerPrimitive.Root
> {
  direction?: DrawerDirection;
  repositionInputs?: boolean;
}

function Drawer({
  direction,
  repositionInputs: _repositionInputs,
  ...props
}: DrawerProps) {
  const swipeDirection =
    direction === "bottom" ? "down" : direction === "top" ? "up" : direction;

  return (
    <DrawerPrimitive.Root
      data-slot="drawer"
      swipeDirection={swipeDirection}
      {...props}
    />
  );
}

interface DrawerTriggerProps extends React.ComponentProps<
  typeof DrawerPrimitive.Trigger
> {
  asChild?: boolean;
}

function DrawerTrigger({ asChild, children, ...props }: DrawerTriggerProps) {
  const render = asChild
    ? (React.Children.only(children) as React.ReactElement)
    : undefined;

  return (
    <DrawerPrimitive.Trigger
      data-slot="drawer-trigger"
      render={render}
      {...props}
    >
      {asChild ? undefined : children}
    </DrawerPrimitive.Trigger>
  );
}

function DrawerPortal({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />;
}

function DrawerClose({
  asChild,
  children,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Close> & { asChild?: boolean }) {
  const render = asChild
    ? (React.Children.only(children) as React.ReactElement)
    : undefined;

  return (
    <DrawerPrimitive.Close data-slot="drawer-close" render={render} {...props}>
      {asChild ? undefined : children}
    </DrawerPrimitive.Close>
  );
}

function DrawerOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Backdrop>) {
  return (
    <DrawerPrimitive.Backdrop
      data-slot="drawer-overlay"
      className={cn(
        "absolute inset-0 bg-black/50 data-ending-style:opacity-0 data-starting-style:opacity-0 transition-opacity duration-200",
        className,
      )}
      {...props}
    />
  );
}

interface DrawerContentProps extends React.ComponentProps<
  typeof DrawerPrimitive.Content
> {
  initialFocus?: React.ComponentProps<
    typeof DrawerPrimitive.Popup
  >["initialFocus"];
  finalFocus?: React.ComponentProps<typeof DrawerPrimitive.Popup>["finalFocus"];
  onOpenAutoFocus?: (event: Event) => void;
  onCloseAutoFocus?: (event: Event) => void;
}

function DrawerContent({
  className,
  children,
  initialFocus,
  finalFocus,
  onOpenAutoFocus,
  onCloseAutoFocus,
  ...props
}: DrawerContentProps) {
  return (
    <DrawerPrimitive.Portal data-slot="drawer-portal">
      <DrawerOverlay />
      <DrawerPrimitive.Viewport className="fixed inset-0 z-50">
        <DrawerPrimitive.Popup
          data-slot="drawer-popup"
          initialFocus={onOpenAutoFocus ? false : initialFocus}
          finalFocus={onCloseAutoFocus ? false : finalFocus}
          className={cn(
            "group/drawer-popup bg-white fixed flex h-auto flex-col transition-transform duration-200 ease-out dark:bg-gray-950",
            "data-[swipe-direction=up]:inset-x-0 data-[swipe-direction=up]:top-0 data-[swipe-direction=up]:mb-24 data-[swipe-direction=up]:max-h-[80vh] data-[swipe-direction=up]:rounded-b-lg data-[swipe-direction=up]:border-b data-[swipe-direction=up]:translate-y-(--drawer-swipe-movement-y)",
            "data-[swipe-direction=down]:inset-x-0 data-[swipe-direction=down]:bottom-0 data-[swipe-direction=down]:mt-24 data-[swipe-direction=down]:max-h-[80vh] data-[swipe-direction=down]:rounded-t-lg data-[swipe-direction=down]:border-t data-[swipe-direction=down]:translate-y-[calc(var(--drawer-snap-point-offset)+var(--drawer-swipe-movement-y))]",
            "data-[swipe-direction=right]:inset-y-0 data-[swipe-direction=right]:right-0 data-[swipe-direction=right]:w-3/4 data-[swipe-direction=right]:border-l data-[swipe-direction=right]:translate-x-(--drawer-swipe-movement-x) data-[swipe-direction=right]:sm:max-w-sm",
            "data-[swipe-direction=left]:inset-y-0 data-[swipe-direction=left]:left-0 data-[swipe-direction=left]:w-3/4 data-[swipe-direction=left]:border-r data-[swipe-direction=left]:translate-x-(--drawer-swipe-movement-x) data-[swipe-direction=left]:sm:max-w-sm",
          )}
        >
          <DrawerPrimitive.Content
            data-slot="drawer-content"
            className={cn("flex h-full flex-col", className)}
            {...props}
          >
            <div className="bg-gray-100 mx-auto mt-4 hidden h-2 w-[100px] shrink-0 rounded-full group-data-[swipe-axis=y]/drawer-popup:block dark:bg-gray-800" />
            {children}
          </DrawerPrimitive.Content>
        </DrawerPrimitive.Popup>
      </DrawerPrimitive.Viewport>
    </DrawerPrimitive.Portal>
  );
}

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-header"
      className={cn(
        "flex flex-col gap-0.5 p-4 group-data-[swipe-axis=y]/drawer-popup:text-center md:gap-1.5 md:text-left",
        className,
      )}
      {...props}
    />
  );
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  );
}

function DrawerTitle({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn("text-gray-950 font-semibold dark:text-gray-50", className)}
      {...props}
    />
  );
}

function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn("text-gray-500 text-sm dark:text-gray-400", className)}
      {...props}
    />
  );
}

export {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger,
};
