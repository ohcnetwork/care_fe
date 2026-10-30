/**
 * @name sheet
 * @description Extends the Dialog component to display content that complements the main content of the screen.
 * @dependencies @base-ui/react class-variance-authority lucide-react
 * @type registry:ui
 */
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog";
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

function isBlockedReason(reason: string) {
  return reason === "outside-press" || reason === "focus-out";
}

const SheetContext = React.createContext<{
  shaking: boolean;
  onShakeEnd: () => void;
  side: "top" | "right" | "bottom" | "left";
  containerClassName: string;
  scrolled: boolean;
  setScrolled: (v: boolean) => void;
} | null>(null);

const SheetRootContext = React.createContext<{
  modal: SheetPrimitive.Root.Props["modal"];
  dismissibleRef: React.RefObject<boolean>;
  triggerShakeRef: React.RefObject<(() => void) | null>;
}>({
  modal: true,
  dismissibleRef: { current: true },
  triggerShakeRef: { current: null },
});

function Sheet({
  modal = true,
  onOpenChange,
  ...props
}: SheetPrimitive.Root.Props) {
  const dismissibleRef = React.useRef(true);
  const triggerShakeRef = React.useRef<(() => void) | null>(null);
  const { handlersRef, handleOpenChange: handleCompatibleOpenChange } =
    useOverlayRoot(onOpenChange);

  const handleOpenChange = React.useCallback(
    (open: boolean, eventDetails: SheetPrimitive.Root.ChangeEventDetails) => {
      if (
        !open &&
        !dismissibleRef.current &&
        isBlockedReason(eventDetails.reason)
      ) {
        eventDetails.cancel();
        if (modal && eventDetails.reason === "outside-press") {
          triggerShakeRef.current?.();
        }
        return;
      }
      handleCompatibleOpenChange(open, eventDetails);
    },
    [modal, handleCompatibleOpenChange],
  );

  return (
    <OverlayEventsContext.Provider value={handlersRef}>
      <SheetRootContext.Provider
        value={React.useMemo(
          () => ({ dismissibleRef, triggerShakeRef, modal }),
          [modal],
        )}
      >
        <SheetPrimitive.Root
          data-slot="sheet"
          modal={modal}
          onOpenChange={handleOpenChange}
          {...props}
        />
      </SheetRootContext.Provider>
    </OverlayEventsContext.Provider>
  );
}

function SheetTrigger({
  asChild,
  render,
  children,
  ...props
}: Omit<SheetPrimitive.Trigger.Props, "render"> & {
  asChild?: boolean;
  render?: RenderProp;
}) {
  const resolved = resolveAsChild(asChild, children, render);
  return (
    <SheetPrimitive.Trigger
      data-slot="sheet-trigger"
      render={resolved.render}
      nativeButton={resolved.nativeButton}
      {...props}
    >
      {resolved.children}
    </SheetPrimitive.Trigger>
  );
}

function SheetClose({
  asChild,
  render,
  children,
  ...props
}: Omit<SheetPrimitive.Close.Props, "render"> & {
  asChild?: boolean;
  render?: RenderProp;
}) {
  const resolved = resolveAsChild(asChild, children, render);
  return (
    <SheetPrimitive.Close
      data-slot="sheet-close"
      render={resolved.render}
      nativeButton={resolved.nativeButton}
      {...props}
    >
      {resolved.children}
    </SheetPrimitive.Close>
  );
}

function SheetPortal({ ...props }: SheetPrimitive.Portal.Props) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetOverlay({ className, ...props }: SheetPrimitive.Backdrop.Props) {
  const { modal } = React.useContext(SheetRootContext);
  if (modal !== true) return null;
  return (
    <SheetPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(
        "data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 fixed inset-0 z-50 bg-black/10 duration-100 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs",
        className,
      )}
      {...props}
    />
  );
}

const sheetSizeClasses = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
  full: "max-w-none",
  screen: "w-screen h-screen",
} as const;

const sheetSideClasses = {
  top: "inset-x-0 top-0 h-auto border-b",
  bottom: "inset-x-0 bottom-0 h-auto border-t",
  left: "inset-y-0 left-0 h-dvh w-full border-r",
  right: "inset-y-0 right-0 h-dvh w-full border-l",
} as const;

type SheetSize = keyof typeof sheetSizeClasses;

function SheetContent({
  className,
  children,
  side = "right",
  size = "sm",
  dismissible = true,
  overlay = true,
  containerClassName,
  initialFocus,
  finalFocus,
  showCloseButton = true,
  onOpenAutoFocus,
  onCloseAutoFocus,
  onEscapeKeyDown,
  onInteractOutside,
  onPointerDownOutside,
  onFocusOutside,
  ref,
  ...props
}: SheetPrimitive.Popup.Props &
  OverlayContentEvents & {
    side?: "top" | "right" | "bottom" | "left";
    size?: SheetSize;
    dismissible?: boolean;
    overlay?: boolean;
    containerClassName?: string;
    showCloseButton?: boolean;
    ref?: React.Ref<HTMLDivElement>;
  }) {
  const { t } = useTranslation();
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
  const { dismissibleRef, triggerShakeRef } =
    React.useContext(SheetRootContext);
  const [shaking, setShaking] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const popupRef = React.useRef<HTMLDivElement | null>(null);

  const onShakeEnd = React.useCallback(() => setShaking(false), []);
  const triggerShake = React.useCallback(() => {
    setShaking(false);
    requestAnimationFrame(() => setShaking(true));
  }, []);

  // Always-latest refs: Root's onOpenChange fires later, asynchronously, in
  // response to user interaction — by then this effect has already run.
  React.useEffect(() => {
    dismissibleRef.current = dismissible;
    triggerShakeRef.current = triggerShake;
  }, [dismissibleRef, dismissible, triggerShakeRef, triggerShake]);

  const viewportRef = React.useCallback(
    (el: HTMLDivElement | null) => {
      const vv = window.visualViewport;
      if (!el || !vv) return;
      let rafId: number;
      const update = () => {
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          // A nested drawer/dialog covers the sheet and handles the keyboard
          // itself; resizing the sheet underneath only makes it reflow behind.
          if (el.hasAttribute("data-nested-dialog-open")) return;
          if (side === "left" || side === "right") {
            el.style.height = `${vv.height}px`;
            el.style.top = `${vv.offsetTop}px`;
          } else if (side === "bottom") {
            const keyboardHeight =
              window.innerHeight - vv.offsetTop - vv.height;
            el.style.bottom = `${keyboardHeight}px`;
          } else if (side === "top") {
            el.style.maxHeight = `${vv.height}px`;
          }
        });
      };
      vv.addEventListener("resize", update);
      vv.addEventListener("scroll", update);
      update();
      return () => {
        vv.removeEventListener("resize", update);
        vv.removeEventListener("scroll", update);
        cancelAnimationFrame(rafId);
      };
    },
    [side],
  );

  const setContentRef = React.useCallback(
    (el: HTMLDivElement | null) => {
      popupRef.current = el;
      const cleanup = viewportRef(el);
      const cleanupRef = typeof ref === "function" ? ref(el) : undefined;
      if (ref && typeof ref !== "function") ref.current = el;
      return () => {
        cleanup?.();
        if (typeof cleanupRef === "function") cleanupRef();
        else if (typeof ref === "function") ref(null);
        else if (ref) ref.current = null;
      };
    },
    [viewportRef, ref],
  );

  const resolvedContainerClassName =
    containerClassName ??
    (side === "top" || side === "bottom"
      ? "mx-auto w-full max-w-2xl px-4 md:px-6"
      : "px-4 md:px-6");

  const contextValue = React.useMemo(
    () => ({
      shaking,
      onShakeEnd,
      side,
      containerClassName: resolvedContainerClassName,
      scrolled,
      setScrolled,
    }),
    [shaking, onShakeEnd, side, resolvedContainerClassName, scrolled],
  );

  return (
    <SheetPortal>
      {overlay && <SheetOverlay />}
      <SheetPrimitive.Popup
        ref={setContentRef}
        data-slot="sheet-content"
        data-side={side}
        className={cn(
          "bg-background data-open:animate-in data-closed:animate-out data-[side=right]:data-closed:slide-out-to-right-10 data-[side=right]:data-open:slide-in-from-right-10 data-[side=left]:data-closed:slide-out-to-left-10 data-[side=left]:data-open:slide-in-from-left-10 data-[side=top]:data-closed:slide-out-to-top-10 data-[side=top]:data-open:slide-in-from-top-10 data-closed:fade-out-0 data-open:fade-in-0 data-[side=bottom]:data-closed:slide-out-to-bottom-10 data-[side=bottom]:data-open:slide-in-from-bottom-10 fixed z-50 flex flex-col overflow-y-auto bg-clip-padding text-sm shadow-lg transition duration-200 ease-in-out",
          sheetSideClasses[side],
          (side === "left" || side === "right") && sheetSizeClasses[size],
          "gap-4",
          className,
        )}
        {...focusProps}
        data-shaking={shaking || undefined}
        onAnimationEnd={onShakeEnd}
        {...props}
      >
        {/*
         * SheetContext.Provider lives INSIDE SheetPrimitive.Popup (not
         * between SheetPortal and SheetPrimitive.Popup). This mirrored a
         * hard Radix Presence requirement (cloneElement(child, { ref })
         * on its direct child; a Context Provider there silently dropped
         * the ref, breaking exit-animation detection). Base UI's Popup
         * uses data-starting-style/data-ending-style + CSS transitions
         * instead of that ref-based mechanism, so this specific failure
         * mode no longer applies — kept in the same position anyway since
         * it costs nothing and there's no reason to relitigate it.
         */}
        <SheetContext.Provider value={contextValue}>
          {showCloseButton && (
            <SheetClose
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
          {children}
        </SheetContext.Provider>
      </SheetPrimitive.Popup>
    </SheetPortal>
  );
}

function SheetHeader({
  className,
  children,
  showCloseButton = false,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean;
}) {
  const { t } = useTranslation();
  const ctx = React.useContext(SheetContext);
  return (
    <div
      data-slot="sheet-header"
      className={cn(
        "bg-background relative flex shrink-0 flex-col gap-1.5 border-b pr-10 pb-4 transition-all duration-200 p-4 md:p-6",
        showCloseButton && "pr-12",
        className,
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <SheetClose
          render={
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "absolute top-0 right-0 shrink-0",
                ctx?.shaking &&
                  "bg-destructive/20 animate-sheet-shake will-change-transform",
              )}
              onAnimationEnd={ctx?.onShakeEnd}
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

function SheetBody({ className, ...props }: React.ComponentProps<"div">) {
  const ctx = React.useContext(SheetContext);
  return (
    <div
      data-slot="sheet-body"
      className={cn(
        "min-h-0 flex-1 overflow-y-auto overscroll-contain py-4",
        className,
      )}
      onScroll={(e) =>
        ctx?.setScrolled((e.currentTarget as HTMLElement).scrollTop > 0)
      }
    >
      <div className={cn(ctx?.containerClassName)} {...props} />
    </div>
  );
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn(
        "bg-soft-background mt-auto flex shrink-0 flex-col-reverse gap-4 border-t p-4 md:p-6 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

function SheetTitle({ className, ...props }: SheetPrimitive.Title.Props) {
  const ctx = React.useContext(SheetContext);
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn(
        "text-foreground font-semibold transition-[font-size] duration-200 ease-in-out",
        ctx?.scrolled ? "text-base" : "text-lg",
        className,
      )}
      {...props}
    />
  );
}

function SheetDescription({
  className,
  asChild,
  render,
  children,
  ...props
}: Omit<SheetPrimitive.Description.Props, "render"> & {
  asChild?: boolean;
  render?: RenderProp;
}) {
  const resolved = resolveAsChild(asChild, children, render);
  const ctx = React.useContext(SheetContext);
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      render={resolved.render}
      className={cn(
        "text-muted-foreground text-sm",
        ctx?.scrolled && "sr-only",
        className,
      )}
      {...props}
    >
      {resolved.children}
    </SheetPrimitive.Description>
  );
}

export {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
};
