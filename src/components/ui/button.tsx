/**
 * @name button
 * @description Displays a button or a component that looks like a button.
 *   Base styling from careui design system, plus care_fe custom variants.
 * @dependencies radix-ui class-variance-authority
 * @type registry:ui
 */
import * as React from "react";

import { type VariantProps, cva } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 px-3 whitespace-nowrap rounded-md not-in-data-[slot=button-group]:rounded-squircle-lg border border-transparent bg-clip-padding text-sm font-semibold tracking-wide outline-0 select-none shrink-0 transition touch-action-manipulation [-webkit-tap-highlight-color:transparent] group/button [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 aria-invalid:outline-2 aria-invalid:outline-offset-2 aria-invalid:outline-destructive ",
  {
    variants: {
      variant: {
        default:
          "text-shadow-xs text-shadow-primary-950 dark:text-shadow-primary-200/50 border-primary-950/90 dark:border-primary-900 bg-primary text-primary-foreground shadow-md shadow-primary/50 dark:shadow-background hover:bg-primary/90 not-disabled:inset-shadow-2xs not-disabled:inset-shadow-primary-200/30 dark:not-disabled:inset-shadow-2xs dark:not-disabled:inset-shadow-primary-200/80 [:active,[data-pressed]]:bg-primary/80 [:active,[data-pressed]]:inset-shadow-sm [:active,[data-pressed]]:inset-shadow-primary-800 dark:[:active,[data-pressed]]:inset-shadow-sm dark:[:active,[data-pressed]]:inset-shadow-primary-800 [:disabled,:active,[data-pressed]]:shadow-none",
        secondary:
          "border border-primary-700 bg-background text-primary-900 dark:text-primary-500 shadow-md hover:border-primary-600 hover:bg-primary-700/10 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground [:active,[data-pressed]]:bg-primary-700/5 [:active,[data-pressed]]:inset-shadow-sm [:active,[data-pressed]]:inset-shadow-neutral-500/35 dark:[:active,[data-pressed]]:inset-shadow-neutral-950 [:disabled,:active,[data-pressed]]:shadow-none",
        tertiary:
          "underline underline-offset-4 bg-muted-background/70 hover:bg-muted hover:text-foreground hover:border-border aria-expanded:bg-muted aria-expanded:text-foreground [:active,[data-pressed]]:bg-muted/90 [:active,[data-pressed]]:inset-shadow-sm [:active,[data-pressed]]:inset-shadow-neutral-400/40 dark:hover:bg-muted dark:[:active,[data-pressed]]:inset-shadow-neutral-950/80",
        outline:
          "border-border border-stronger-border bg-background shadow-md hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground [:active,[data-pressed]]:bg-muted/80 [:active,[data-pressed]]:inset-shadow-sm [:active,[data-pressed]]:inset-shadow-neutral-400/50 dark:[:active,[data-pressed]]:inset-shadow-neutral-950/80 [:disabled,:active,[data-pressed]]:shadow-none dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        ghost:
          "underline underline-offset-4 hover:bg-strong-background/75 hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground [:active,[data-pressed]]:bg-muted/90 dark:hover:bg-muted",
        link: "text-blue-700 underline underline-offset-4 transition-[color,text-underline-offset] hover:underline-offset-2 hover:text-blue-800 [:active,[data-pressed]]:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 dark:[:active,[data-pressed]]:text-blue-200",
        destructive:
          "border border-destructive/70 bg-red-100/75 text-red-700 shadow-md hover:bg-destructive/20 focus-visible:outline-destructive [:active,[data-pressed]]:bg-destructive/25 [:active,[data-pressed]]:inset-shadow-sm [:active,[data-pressed]]:inset-shadow-red-400/40 [:disabled,:active,[data-pressed]]:shadow-none dark:bg-destructive/5 dark:hover:border-destructive/75 dark:text-red-400 dark:hover:bg-destructive/4 dark:[:active,[data-pressed]]:bg-destructive/5 dark:[:active,[data-pressed]]:inset-shadow-neutral-950",
        "destructive-solid":
          "text-shadow-xs text-shadow-red-950 dark:text-shadow-red-900 border border-red-700 bg-destructive text-red-100 shadow-md hover:bg-destructive/80 focus-visible:outline-destructive [:active,[data-pressed]]:bg-destructive/70 [:active,[data-pressed]]:inset-shadow-sm [:active,[data-pressed]]:inset-shadow-destructive/90 [:disabled,:active,[data-pressed]]:shadow-none dark:bg-red-500/90 dark:[:active,[data-pressed]]:inset-shadow-red-950/90 dark:hover:bg-red-500/80 dark:[:active,[data-pressed]]:bg-red-500/70",
        // care_fe-specific legacy variants preserved for domain use cases
        primary_gradient:
          "text-white border border-primary-900 rounded-lg font-medium relative overflow-hidden bg-linear-to-b from-primary-700 to-primary-800 hover:from-primary-800 hover:to-primary-900 shadow-lg",
        outline_primary:
          "border border-primary-700 text-primary-700 bg-background shadow-xs hover:bg-primary-700 hover:text-white",
        white:
          "bg-background border border-secondary-400 text-foreground shadow-xs hover:bg-muted-background hover:text-foreground",
        warning:
          "bg-warning-100 text-warning-900 border border-warning-300 shadow-xs hover:bg-warning-100/80",
        alert:
          "bg-alert-100 text-alert-900 border border-alert-300 shadow-xs hover:bg-alert-100/80",
      },
      size: {
        default:
          "h-12 md:h-10 px-4.5 md:px-3.5 [&_svg:not([class*='size-'])]:size-5 has-data-[icon=inline-start]:pl-3 has-data-[icon=inline-end]:pr-3 in-data-[slot=button-group]:rounded-[min(var(--radius-md),10px)]",
        xs: "h-8 md:h-8 gap-1 px-2.5 rounded-[min(var(--radius-md),8px)] text-xs [&_svg:not([class*='size-'])]:size-3.5 has-data-[icon=inline-start]:pl-2 has-data-[icon=inline-end]:pr-2 in-data-[slot=button-group]:rounded-md",
        sm: "h-9 md:h-9 gap-1 px-3 rounded-[min(var(--radius-md),10px)] [&_svg:not([class*='size-'])]:size-4 has-data-[icon=inline-start]:pl-2.5 has-data-[icon=inline-end]:pr-2.5 in-data-[slot=button-group]:rounded-md",
        lg: "h-11 md:h-11 gap-1.5 px-4 [&_svg:not([class*='size-'])]:size-5 has-data-[icon=inline-start]:pl-3.5 has-data-[icon=inline-end]:pr-3.5",
        xl: "h-12 md:h-12 gap-2 px-4.5 text-base [&_svg:not([class*='size-'])]:size-6 has-data-[icon=inline-start]:pl-4 has-data-[icon=inline-end]:pr-4",
        icon: "size-12 md:size-10 [&_svg:not([class*='size-'])]:size-5",
        "icon-xs":
          "size-8 md:size-8 rounded-[min(var(--radius-md),8px)] [&_svg:not([class*='size-'])]:size-3.5 in-data-[slot=button-group]:rounded-md",
        "icon-sm":
          "size-9 md:size-9 rounded-[min(var(--radius-md),10px)] [&_svg:not([class*='size-'])]:size-4 in-data-[slot=button-group]:rounded-md",
        "icon-lg": "size-11 md:size-11 [&_svg:not([class*='size-'])]:size-5",
        "icon-xl": "size-12 md:size-12 [&_svg:not([class*='size-'])]:size-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonVariant =
  | "default"
  | "secondary"
  | "tertiary"
  | "outline"
  | "ghost"
  | "link"
  | "destructive"
  | "destructive-solid"
  | "primary_gradient"
  | "outline_primary"
  | "white"
  | "warning"
  | "alert";

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
