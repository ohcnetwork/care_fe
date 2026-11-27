import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const indicatorVariants = cva("inline-block shrink-0 rounded-full", {
  variants: {
    variant: {
      filled: "border-0",
      outlined: "border-1",
    },
    tone: {
      // Semantic
      primary: "bg-primary border-primary dark:bg-primary-600",
      success:
        "bg-green-600 border-green-500 dark:bg-green-600 dark:border-green-400",
      warning:
        "bg-orange-500 border-orange-500 dark:bg-orange-500 dark:border-orange-400",
      info: "bg-indigo-500 border-indigo-500 dark:bg-indigo-500 dark:border-indigo-400",
      destructive:
        "bg-red-500 border-red-500 dark:bg-red-300 dark:border-red-400",
      neutral: "bg-muted-foreground/50 border-muted-foreground/50",
      // Named Tailwind colors
      red: "bg-red-500 border-red-500 dark:bg-red-400 dark:border-red-400",
      orange:
        "bg-orange-500 border-orange-500 dark:bg-orange-400 dark:border-orange-400",
      amber:
        "bg-amber-500 border-amber-500 dark:bg-amber-400 dark:border-amber-400",
      yellow:
        "bg-yellow-500 border-yellow-500 dark:bg-yellow-400 dark:border-yellow-400",
      lime: "bg-lime-500 border-lime-500 dark:bg-lime-400 dark:border-lime-400",
      green:
        "bg-green-500 border-green-500 dark:bg-green-400 dark:border-green-400",
      teal: "bg-teal-500 border-teal-500 dark:bg-teal-600 dark:border-teal-400",
      cyan: "bg-cyan-500 border-cyan-500 dark:bg-cyan-600 dark:border-cyan-400",
      sky: "bg-sky-500 border-sky-500 dark:bg-sky-600 dark:border-sky-400",
      blue: "bg-blue-500 border-blue-500 dark:bg-blue-600 dark:border-blue-400",
      indigo:
        "bg-indigo-500 border-indigo-500 dark:bg-indigo-600 dark:border-indigo-400",
      violet:
        "bg-violet-500 border-violet-500 dark:bg-violet-600 dark:border-violet-400",
      purple:
        "bg-purple-500 border-purple-500 dark:bg-purple-600 dark:border-purple-400",
      fuchsia:
        "bg-fuchsia-500 border-fuchsia-500 dark:bg-fuchsia-600 dark:border-fuchsia-400",
      pink: "bg-pink-500 border-pink-500 dark:bg-pink-600 dark:border-pink-400",
      rose: "bg-rose-500 border-rose-500 dark:bg-rose-600 dark:border-rose-400",
    },
    size: {
      xs: "size-1.5",
      sm: "size-2",
      md: "size-2.5",
      lg: "size-3",
      xl: "size-4",
    },
  },
  compoundVariants: [
    // Outlined variant uses a lighter tinted background
    {
      variant: "outlined",
      tone: "primary",
      className: "bg-primary/20 dark:bg-primary/25",
    },
    {
      variant: "outlined",
      tone: "success",
      className: "bg-green-200 dark:bg-green-400/20",
    },
    {
      variant: "outlined",
      tone: "warning",
      className: "bg-orange-200 dark:bg-orange-400/20",
    },
    {
      variant: "outlined",
      tone: "info",
      className: "bg-indigo-200 dark:bg-indigo-400/20",
    },
    {
      variant: "outlined",
      tone: "destructive",
      className: "bg-red-200 dark:bg-red-400/20",
    },
    {
      variant: "outlined",
      tone: "neutral",
      className: "bg-muted-foreground/10 dark:bg-muted-foreground/15",
    },
    {
      variant: "outlined",
      tone: "red",
      className: "bg-red-200 dark:bg-red-400/20",
    },
    {
      variant: "outlined",
      tone: "orange",
      className: "bg-orange-200 dark:bg-orange-400/20",
    },
    {
      variant: "outlined",
      tone: "amber",
      className: "bg-amber-200 dark:bg-amber-400/20",
    },
    {
      variant: "outlined",
      tone: "yellow",
      className: "bg-yellow-200 dark:bg-yellow-400/20",
    },
    {
      variant: "outlined",
      tone: "lime",
      className: "bg-lime-200 dark:bg-lime-400/20",
    },
    {
      variant: "outlined",
      tone: "green",
      className: "bg-green-200 dark:bg-green-400/20",
    },
    {
      variant: "outlined",
      tone: "teal",
      className: "bg-teal-200 dark:bg-teal-400/20",
    },
    {
      variant: "outlined",
      tone: "cyan",
      className: "bg-cyan-200 dark:bg-cyan-400/20",
    },
    {
      variant: "outlined",
      tone: "sky",
      className: "bg-sky-200 dark:bg-sky-400/20",
    },
    {
      variant: "outlined",
      tone: "blue",
      className: "bg-blue-200 dark:bg-blue-400/20",
    },
    {
      variant: "outlined",
      tone: "indigo",
      className: "bg-indigo-200 dark:bg-indigo-400/20",
    },
    {
      variant: "outlined",
      tone: "violet",
      className: "bg-violet-200 dark:bg-violet-400/20",
    },
    {
      variant: "outlined",
      tone: "purple",
      className: "bg-purple-200 dark:bg-purple-400/20",
    },
    {
      variant: "outlined",
      tone: "fuchsia",
      className: "bg-fuchsia-200 dark:bg-fuchsia-400/20",
    },
    {
      variant: "outlined",
      tone: "pink",
      className: "bg-pink-200 dark:bg-pink-400/20",
    },
    {
      variant: "outlined",
      tone: "rose",
      className: "bg-rose-200 dark:bg-rose-400/20",
    },
  ],
  defaultVariants: {
    variant: "outlined",
    tone: "primary",
    size: "md",
  },
});

type IndicatorVariant = NonNullable<
  VariantProps<typeof indicatorVariants>["variant"]
>;
type IndicatorTone = NonNullable<
  VariantProps<typeof indicatorVariants>["tone"]
>;
type IndicatorSize = NonNullable<
  VariantProps<typeof indicatorVariants>["size"]
>;

function Indicator({
  className,
  variant,
  tone,
  size,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof indicatorVariants>) {
  return (
    <span
      data-slot="indicator"
      data-variant={variant}
      data-tone={tone}
      aria-hidden="true"
      className={cn(indicatorVariants({ variant, tone, size }), className)}
      {...props}
    />
  );
}

export {
  Indicator,
  indicatorVariants,
  type IndicatorSize,
  type IndicatorTone,
  type IndicatorVariant,
};
