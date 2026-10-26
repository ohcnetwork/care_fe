/**
 * @name alert-dialog
 * @description A modal dialog that interrupts the user with important content and expects a response.
 * @dependencies @base-ui/react button
 * @type registry:ui
 */
"use client";

import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog";
import * as React from "react";

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

function AlertDialog({
  onOpenChange,
  ...props
}: AlertDialogPrimitive.Root.Props) {
  const { handlersRef, handleOpenChange } = useOverlayRoot(onOpenChange);
  return (
    <OverlayEventsContext.Provider value={handlersRef}>
      <AlertDialogPrimitive.Root
        data-slot="alert-dialog"
        onOpenChange={handleOpenChange}
        {...props}
      />
    </OverlayEventsContext.Provider>
  );
}

function AlertDialogTrigger({
  asChild,
  render,
  children,
  ...props
}: Omit<AlertDialogPrimitive.Trigger.Props, "render"> & {
  asChild?: boolean;
  render?: RenderProp;
}) {
  const resolved = resolveAsChild(asChild, children, render);
  return (
    <AlertDialogPrimitive.Trigger
      data-slot="alert-dialog-trigger"
      render={resolved.render}
      nativeButton={resolved.nativeButton}
      {...props}
    >
      {resolved.children}
    </AlertDialogPrimitive.Trigger>
  );
}

function AlertDialogPortal({ ...props }: AlertDialogPrimitive.Portal.Props) {
  return (
    <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
  );
}

function AlertDialogOverlay({
  className,
  ...props
}: AlertDialogPrimitive.Backdrop.Props) {
  return (
    <AlertDialogPrimitive.Backdrop
      data-slot="alert-dialog-overlay"
      className={cn(
        "data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 fixed inset-0 isolate z-50 bg-black/50 duration-100 supports-backdrop-filter:backdrop-blur-xs",
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogContent({
  className,
  size = "default",
  initialFocus,
  finalFocus,
  onOpenAutoFocus,
  onCloseAutoFocus,
  onEscapeKeyDown,
  onInteractOutside,
  onPointerDownOutside,
  onFocusOutside,
  ...props
}: AlertDialogPrimitive.Popup.Props &
  OverlayContentEvents & {
    size?: "default" | "sm";
  }) {
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
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Popup
        data-slot="alert-dialog-content"
        data-size={size}
        {...focusProps}
        className={cn(
          "data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 bg-background ring-foreground/10 group/alert-dialog-content fixed top-1/2 left-1/2 z-50 grid w-full -translate-x-1/2 -translate-y-1/2 gap-6 rounded-xl p-6 ring-1 duration-100 outline-none data-[size=default]:max-w-xs data-[size=sm]:max-w-xs data-[size=default]:sm:max-w-lg",
          className,
        )}
        {...props}
      />
    </AlertDialogPortal>
  );
}

function AlertDialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn(
        "grid grid-rows-[auto_1fr] place-items-center gap-1.5 text-center has-data-[slot=alert-dialog-media]:grid-rows-[auto_auto_1fr] has-data-[slot=alert-dialog-media]:gap-x-6 sm:group-data-[size=default]/alert-dialog-content:place-items-start sm:group-data-[size=default]/alert-dialog-content:text-left sm:group-data-[size=default]/alert-dialog-content:has-data-[slot=alert-dialog-media]:grid-rows-[auto_1fr]",
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 group-data-[size=sm]/alert-dialog-content:grid group-data-[size=sm]/alert-dialog-content:grid-cols-2 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogMedia({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-media"
      className={cn(
        "bg-muted mb-2 inline-flex size-16 items-center justify-center rounded-md sm:group-data-[size=default]/alert-dialog-content:row-span-2 *:[svg:not([class*='size-'])]:size-8",
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogTitle({
  className,
  ...props
}: AlertDialogPrimitive.Title.Props) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn(
        "text-lg font-medium sm:group-data-[size=default]/alert-dialog-content:group-has-data-[slot=alert-dialog-media]/alert-dialog-content:col-start-2",
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogDescription({
  className,
  asChild,
  render,
  children,
  ...props
}: Omit<AlertDialogPrimitive.Description.Props, "render"> & {
  asChild?: boolean;
  render?: RenderProp;
}) {
  const resolved = resolveAsChild(asChild, children, render);
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      render={resolved.render}
      className={cn(
        "text-muted-foreground *:[a]:hover:text-foreground text-sm text-balance md:text-pretty *:[a]:underline *:[a]:underline-offset-3",
        className,
      )}
      {...props}
    >
      {resolved.children}
    </AlertDialogPrimitive.Description>
  );
}

function AlertDialogAction({
  className,
  variant = "default",
  size = "default",
  asChild,
  render,
  children,
  ...props
}: Omit<AlertDialogPrimitive.Close.Props, "render"> &
  Pick<React.ComponentProps<typeof Button>, "variant" | "size"> & {
    asChild?: boolean;
    render?: RenderProp;
  }) {
  const resolved = resolveAsChild(asChild, children, render);
  return (
    <AlertDialogPrimitive.Close
      data-slot="alert-dialog-action"
      className={cn(className)}
      render={resolved.render ?? <Button variant={variant} size={size} />}
      nativeButton={resolved.nativeButton}
      {...props}
    >
      {resolved.children}
    </AlertDialogPrimitive.Close>
  );
}

function AlertDialogCancel({
  className,
  variant = "outline",
  size = "default",
  asChild,
  render,
  children,
  ...props
}: Omit<AlertDialogPrimitive.Close.Props, "render"> &
  Pick<React.ComponentProps<typeof Button>, "variant" | "size"> & {
    asChild?: boolean;
    render?: RenderProp;
  }) {
  const resolved = resolveAsChild(asChild, children, render);
  return (
    <AlertDialogPrimitive.Close
      data-slot="alert-dialog-cancel"
      className={cn(className)}
      render={resolved.render ?? <Button variant={variant} size={size} />}
      nativeButton={resolved.nativeButton}
      {...props}
    >
      {resolved.children}
    </AlertDialogPrimitive.Close>
  );
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
};
