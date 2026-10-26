/**
 * @name frame
 * @description Displays related content in a structured frame with header, content, and footer.
 * @dependencies class-variance-authority
 * @type registry:ui
 */
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Frame uses CSS variables to coordinate panel padding and spacing
 * between the parent <Frame> and its <FramePanel>, <FrameHeader>, and
 * <FrameFooter> children. This lets header/footer sit either inside a
 * panel or directly under <Frame> while sharing the same paddings.
 *
 *   --frame-radius             border radius of frame and panels
 *   --frame-panel-p            padding for FramePanel
 *   --frame-panel-header-px/py padding for FrameHeader
 *   --frame-panel-footer-px/py padding for FrameFooter
 */
const frameVariants = cva(
  [
    "relative flex flex-col rounded-(--frame-radius)",
    "[--frame-radius:var(--radius-xl)]",
  ],
  {
    variants: {
      variant: {
        default: "border bg-muted/50 bg-clip-padding",
        ghost: "bg-muted/50 bg-clip-padding",
      },
      spacing: {
        sm: "gap-0.5 p-0.5 [--frame-panel-p:--spacing(3)] [--frame-panel-header-px:--spacing(3)] [--frame-panel-header-py:--spacing(2)] [--frame-panel-footer-px:--spacing(3)] [--frame-panel-footer-py:--spacing(2)]",
        default:
          "gap-0.75 p-0.75 [--frame-panel-p:--spacing(4)] [--frame-panel-header-px:--spacing(4)] [--frame-panel-header-py:--spacing(3)] [--frame-panel-footer-px:--spacing(4)] [--frame-panel-footer-py:--spacing(3)]",
        lg: "gap-1.5 p-1.5 [--frame-panel-p:--spacing(5)] [--frame-panel-header-px:--spacing(5)] [--frame-panel-header-py:--spacing(4)] [--frame-panel-footer-px:--spacing(5)] [--frame-panel-footer-py:--spacing(4)]",
      },
      stacked: {
        true: [
          "gap-0",
          "*:has-[+[data-slot=frame-panel]]:rounded-b-none",
          "*:has-[+[data-slot=frame-panel]]:before:hidden",
          "*:[[data-slot=frame-panel]+[data-slot=frame-panel]]:rounded-t-none",
          // Hide the panel's own top border but render the divider via box-shadow
          // so it stays visible even when dense pulls panels with negative margins.
          "*:[[data-slot=frame-panel]+[data-slot=frame-panel]]:border-t-0",
          "*:[[data-slot=frame-panel]+[data-slot=frame-panel]]:shadow-[0_-1px_0_0_var(--border)]",
          "[&:not(:has([data-slot=frame-panel-header]))_[data-slot=frame-panel]:is(:first-child)]:border-t-0",
        ],
        false: "",
      },
      dense: {
        true: "p-0 gap-0 [&_[data-slot=frame-panel]]:-mx-px [&_[data-slot=frame-panel]:last-child]:-mb-px",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      spacing: "default",
      stacked: false,
      dense: false,
    },
  },
);

function Frame({
  className,
  variant,
  spacing,
  stacked,
  dense,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof frameVariants>) {
  return (
    <div
      data-slot="frame"
      data-variant={variant ?? "default"}
      data-spacing={spacing ?? "default"}
      data-stacked={stacked ? "" : undefined}
      data-dense={dense ? "" : undefined}
      className={cn(
        frameVariants({ variant, spacing, stacked, dense }),
        className,
      )}
      {...props}
    />
  );
}

function FramePanel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="frame-panel"
      className={cn(
        "bg-background relative grow rounded-(--frame-radius) border bg-clip-padding shadow-xs",
        "before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--frame-radius)-1px)] before:shadow-black/5",
        "dark:bg-clip-border dark:before:shadow-white/5",
        "p-(--frame-panel-p)",
        className,
      )}
      {...props}
    />
  );
}

function FrameHeader({ className, ...props }: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="frame-panel-header"
      className={cn(
        "flex flex-col gap-1 px-(--frame-panel-header-px) py-(--frame-panel-header-py)",
        className,
      )}
      {...props}
    />
  );
}

function FrameTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="frame-panel-title"
      className={cn("text-sm leading-normal font-semibold", className)}
      {...props}
    />
  );
}

function FrameDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="frame-panel-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function FrameFooter({ className, ...props }: React.ComponentProps<"footer">) {
  return (
    <footer
      data-slot="frame-panel-footer"
      className={cn(
        "flex flex-col gap-1 px-(--frame-panel-footer-px) py-(--frame-panel-footer-py)",
        className,
      )}
      {...props}
    />
  );
}

export {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
  frameVariants,
};
