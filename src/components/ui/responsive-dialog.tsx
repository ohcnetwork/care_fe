import * as React from "react";

import { cn } from "@/lib/utils";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import useBreakpoints from "@/hooks/useBreakpoints";

type Side = "top" | "right" | "bottom" | "left";
type Align = "start" | "center" | "end";

interface BaseProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Width at which the desktop container takes over. */
  breakpoint?: "sm" | "md" | "lg";
  /**
   * Gives the container its accessible name, so it is required even where a
   * site shows no heading — pass `hideHeader` for those.
   */
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Hides the header visually while keeping it for assistive technology. */
  hideHeader?: boolean;
  children: React.ReactNode;
  /** Applied to the container's content on mobile. */
  mobileClassName?: string;
  /** Applied to the container's content on desktop. */
  desktopClassName?: string;
  /**
   * When set, `children` are wrapped in a `div` carrying these classes on the
   * matching breakpoint — for the scroll and padding wrappers a site needs on
   * one container but not the other.
   */
  mobileBodyClassName?: string;
  desktopBodyClassName?: string;
  headerClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
}

/** Container rendered below `breakpoint`. */
type MobileProps =
  | { mobile?: "sheet"; repositionInputs?: never }
  | {
      mobile: "drawer";
      /** vaul's keyboard-avoidance behaviour. */
      repositionInputs?: boolean;
    };

/** Container rendered at or above `breakpoint`. */
type DesktopProps =
  | {
      desktop?: "dialog";
      /** Element that opens the container, rendered `asChild`. */
      trigger?: React.ReactNode;
      footer?: React.ReactNode;
      modal?: boolean;
      align?: never;
      side?: never;
      sideOffset?: never;
    }
  | {
      desktop: "popover";
      /** The popover anchors itself to the trigger, so it cannot be omitted. */
      trigger: React.ReactNode;
      /** Popover has no footer slot. */
      footer?: never;
      modal?: boolean;
      /** Placement relative to the trigger. */
      align?: Align;
      side?: Side;
      sideOffset?: number;
    }
  | {
      desktop: "sheet";
      /** Element that opens the container, rendered `asChild`. */
      trigger?: React.ReactNode;
      footer?: React.ReactNode;
      modal?: never;
      align?: never;
      side?: never;
      sideOffset?: never;
    };

type ResponsiveDialogProps = BaseProps & MobileProps & DesktopProps;

/**
 * Renders one container on mobile and another on desktop behind a single API,
 * so a site does not write its dialog twice and let the two copies drift.
 *
 * ```tsx
 * <ResponsiveDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   mobile="drawer"
 *   desktop="popover"
 *   trigger={<Button>Pick one</Button>}
 *   title={t("pick_one")}
 *   hideHeader
 *   desktopClassName="p-0 w-[var(--radix-popover-trigger-width)]"
 * >
 *   {content}
 * </ResponsiveDialog>
 * ```
 */
export function ResponsiveDialog({
  open,
  onOpenChange,
  mobile = "sheet",
  desktop = "dialog",
  breakpoint = "lg",
  trigger,
  title,
  description,
  hideHeader,
  children,
  footer,
  mobileClassName,
  desktopClassName,
  mobileBodyClassName,
  desktopBodyClassName,
  headerClassName,
  titleClassName,
  descriptionClassName,
  align,
  side,
  sideOffset,
  modal,
  repositionInputs,
}: ResponsiveDialogProps) {
  const isMobile = useBreakpoints({ default: true, [breakpoint]: false });
  const popoverTitleId = React.useId();

  const container = isMobile ? mobile : desktop;
  const contentClassName = isMobile ? mobileClassName : desktopClassName;
  const bodyClassName = isMobile ? mobileBodyClassName : desktopBodyClassName;
  const body = bodyClassName ? (
    <div className={bodyClassName}>{children}</div>
  ) : (
    children
  );
  const headerClasses = cn(hideHeader && "sr-only", headerClassName);

  if (container === "drawer") {
    return (
      <Drawer
        open={open}
        onOpenChange={onOpenChange}
        repositionInputs={repositionInputs}
      >
        {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
        <DrawerContent className={contentClassName}>
          <DrawerHeader className={headerClasses}>
            <DrawerTitle className={titleClassName}>{title}</DrawerTitle>
            {description && (
              <DrawerDescription className={descriptionClassName}>
                {description}
              </DrawerDescription>
            )}
          </DrawerHeader>
          {body}
          {footer && <DrawerFooter>{footer}</DrawerFooter>}
        </DrawerContent>
      </Drawer>
    );
  }

  if (container === "sheet") {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className={contentClassName}
        >
          <SheetHeader className={headerClasses}>
            <SheetTitle className={titleClassName}>{title}</SheetTitle>
            {description && (
              <SheetDescription className={descriptionClassName}>
                {description}
              </SheetDescription>
            )}
          </SheetHeader>
          {body}
          {footer && <SheetFooter>{footer}</SheetFooter>}
        </SheetContent>
      </Sheet>
    );
  }

  if (container === "popover") {
    return (
      <Popover open={open} onOpenChange={onOpenChange} modal={modal}>
        {trigger && <PopoverTrigger asChild>{trigger}</PopoverTrigger>}
        <PopoverContent
          align={align}
          side={side}
          sideOffset={sideOffset}
          aria-labelledby={popoverTitleId}
          className={contentClassName}
        >
          <div className={cn("flex flex-col gap-0.5", headerClasses)}>
            <p
              id={popoverTitleId}
              className={cn("font-semibold text-gray-950", titleClassName)}
            >
              {title}
            </p>
            {description && (
              <p className={cn("text-sm text-gray-500", descriptionClassName)}>
                {description}
              </p>
            )}
          </div>
          {body}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={modal}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className={contentClassName}>
        <DialogHeader className={headerClasses}>
          <DialogTitle className={titleClassName}>{title}</DialogTitle>
          {description && (
            <DialogDescription className={descriptionClassName}>
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        {body}
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}
