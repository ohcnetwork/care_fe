/**
 * @name dialog
 * @description A window overlaid on either the primary window or another dialog window.
 * @dependencies @base-ui/react
 * @type registry:ui
 */
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
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
import { XIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

const DialogModalContext =
  React.createContext<DialogPrimitive.Root.Props["modal"]>(true);

function Dialog({
  onOpenChange,
  modal = true,
  ...props
}: DialogPrimitive.Root.Props) {
  const { handlersRef, handleOpenChange } = useOverlayRoot(onOpenChange);
  return (
    <OverlayEventsContext.Provider value={handlersRef}>
      <DialogModalContext.Provider value={modal}>
        <DialogPrimitive.Root
          data-slot="dialog"
          onOpenChange={handleOpenChange}
          modal={modal}
          {...props}
        />
      </DialogModalContext.Provider>
    </OverlayEventsContext.Provider>
  );
}

function DialogTrigger({
  asChild,
  render,
  children,
  ...props
}: Omit<DialogPrimitive.Trigger.Props, "render"> & {
  asChild?: boolean;
  render?: RenderProp;
}) {
  const resolved = resolveAsChild(asChild, children, render);
  return (
    <DialogPrimitive.Trigger
      data-slot="dialog-trigger"
      render={resolved.render}
      nativeButton={resolved.nativeButton}
      {...props}
    >
      {resolved.children}
    </DialogPrimitive.Trigger>
  );
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({
  asChild,
  render,
  children,
  ...props
}: Omit<DialogPrimitive.Close.Props, "render"> & {
  asChild?: boolean;
  render?: RenderProp;
}) {
  const resolved = resolveAsChild(asChild, children, render);
  return (
    <DialogPrimitive.Close
      data-slot="dialog-close"
      render={resolved.render}
      nativeButton={resolved.nativeButton}
      {...props}
    >
      {resolved.children}
    </DialogPrimitive.Close>
  );
}

function DialogOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  const modal = React.useContext(DialogModalContext);
  if (modal !== true) return null;
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        "data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 fixed inset-0 isolate z-50 bg-black/50 duration-100 supports-backdrop-filter:backdrop-blur-xs",
        className,
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  innerClassName,
  children,
  initialFocus,
  finalFocus,
  showCloseButton = true,
  onOpenAutoFocus,
  onCloseAutoFocus,
  onEscapeKeyDown,
  onInteractOutside,
  onPointerDownOutside,
  onFocusOutside,
  ...props
}: DialogPrimitive.Popup.Props &
  OverlayContentEvents & {
    innerClassName?: string;
    showCloseButton?: boolean;
  }) {
  const { t } = useTranslation();
  const contentRef = React.useRef<HTMLDivElement>(null);
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
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        ref={contentRef}
        data-slot="dialog-content"
        className={cn(
          "bg-background ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl p-6 text-sm shadow-xl ring-1 duration-100 outline-none sm:max-w-lg",
          className,
        )}
        {...focusProps}
        {...props}
      >
        {/* Existing dialogs place their grid/flex and scroll layout on the popup. */}
        {innerClassName ? (
          <div className={innerClassName}>{children}</div>
        ) : (
          children
        )}
        {showCloseButton && (
          <DialogClose
            render={
              <Button
                variant="ghost"
                size="icon"
                className="absolute z-20 top-2 right-2"
              >
                <XIcon />
                <span className="sr-only">{t("close")}</span>
              </Button>
            }
          />
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  );
}

function DialogHeader({
  className,
  children,
  showCloseButton = false,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        "flex flex-col items-start justify-between gap-1.5 border-b pr-10 pb-4",
        className,
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogClose
          render={
            <Button
              variant="ghost"
              size="icon"
              className="-mt-1 -mr-1 shrink-0"
            >
              <XIcon />
              <span className="sr-only">{t("close")}</span>
            </Button>
          }
        />
      )}
    </div>
  );
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-4 border-t pt-4 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogClose render={<Button variant="outline">{t("close")}</Button>} />
      )}
    </div>
  );
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-base leading-none font-semibold", className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-soft-foreground *:[a]:hover:text-foreground text-sm *:[a]:underline *:[a]:underline-offset-3",
        className,
      )}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
