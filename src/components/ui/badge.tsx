/**
 * @name badge
 * @description A badge component for displaying status labels, tags, and notification indicators with dot, icon, and close button variants across semantic and named Tailwind color scales.
 * @dependencies class-variance-authority lucide-react @base-ui/react
 * @type registry:ui
 */
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center gap-1 rounded-sm border font-medium w-fit whitespace-nowrap shrink-0 overflow-hidden [&>svg]:size-3 [&>svg]:pointer-events-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        secondary:
          "border-stronger-border/40 bg-muted-background text-accent-foreground dark:border-strong-border",
        outline: "border-border bg-transparent text-foreground",
        danger:
          "border-red-700 bg-red-600 text-white dark:border-red-500 dark:bg-red-500",

        primary:
          "border-primary/50 bg-primary-100 text-primary-900 dark:border-primary-400/35 dark:bg-primary-400/15 dark:text-primary-300 [a&]:hover:bg-primary/20 dark:[a&]:hover:bg-primary-400/25",
        success:
          "border-green-600/45 bg-green-100 text-green-900 dark:border-green-500/35 dark:bg-green-500/15 dark:text-green-300 [a&]:hover:bg-green-500/20 dark:[a&]:hover:bg-green-500/25",
        warning:
          "border-orange-500/45 bg-orange-100 text-orange-900 dark:border-orange-400/35 dark:bg-orange-400/15 dark:text-orange-300 [a&]:hover:bg-orange-500/20 dark:[a&]:hover:bg-orange-400/25",
        info: "border-indigo-500/45 bg-indigo-100 text-indigo-900 dark:border-indigo-400/35 dark:bg-indigo-400/15 dark:text-indigo-300 [a&]:hover:bg-indigo-500/20 dark:[a&]:hover:bg-indigo-400/25",
        destructive:
          "border-red-500/45 bg-red-100 text-red-900 dark:border-red-400/35 dark:bg-red-400/15 dark:text-red-300 [a&]:hover:bg-red-500/20 dark:[a&]:hover:bg-red-400/25",
        neutral:
          "border-stronger-border/40 bg-muted-background text-accent-foreground dark:border-strong-border dark:bg-muted-background dark:text-accent-foreground [a&]:hover:bg-muted-background/20 dark:[a&]:hover:bg-muted-background/25",
        red: "border-red-500/40 bg-red-100 text-red-800 dark:border-red-400/35 dark:bg-red-400/15 dark:text-red-300 [a&]:hover:bg-red-500/20 dark:[a&]:hover:bg-red-400/25",
        orange:
          "border-orange-500/40 bg-orange-100 text-orange-900 dark:border-orange-400/35 dark:bg-orange-400/15 dark:text-orange-300 [a&]:hover:bg-orange-500/20 dark:[a&]:hover:bg-orange-400/25",
        amber:
          "border-amber-500/40 bg-amber-100 text-amber-900 dark:border-amber-400/35 dark:bg-amber-400/15 dark:text-amber-300 [a&]:hover:bg-amber-500/20 dark:[a&]:hover:bg-amber-400/25",
        yellow:
          "border-yellow-500/40 bg-yellow-100 text-yellow-900 dark:border-yellow-400/35 dark:bg-yellow-400/15 dark:text-yellow-300 [a&]:hover:bg-yellow-500/20 dark:[a&]:hover:bg-yellow-400/25",
        lime: "border-lime-500/40 bg-lime-100 text-lime-900 dark:border-lime-400/35 dark:bg-lime-400/15 dark:text-lime-300 [a&]:hover:bg-lime-500/20 dark:[a&]:hover:bg-lime-400/25",
        green:
          "border-green-500/40 bg-green-100 text-green-900 dark:border-green-400/35 dark:bg-green-400/15 dark:text-green-300 [a&]:hover:bg-green-500/20 dark:[a&]:hover:bg-green-400/25",
        teal: "border-teal-500/40 bg-teal-100 text-teal-900 dark:border-teal-400/35 dark:bg-teal-400/15 dark:text-teal-300 [a&]:hover:bg-teal-500/20 dark:[a&]:hover:bg-teal-400/25",
        cyan: "border-cyan-500/40 bg-cyan-100 text-cyan-900 dark:border-cyan-400/35 dark:bg-cyan-400/15 dark:text-cyan-300 [a&]:hover:bg-cyan-500/20 dark:[a&]:hover:bg-cyan-400/25",
        sky: "border-sky-500/40 bg-sky-100 text-sky-900 dark:border-sky-400/35 dark:bg-sky-400/15 dark:text-sky-300 [a&]:hover:bg-sky-500/20 dark:[a&]:hover:bg-sky-400/25",
        blue: "border-blue-500/40 bg-blue-100 text-blue-900 dark:border-blue-400/35 dark:bg-blue-400/15 dark:text-blue-300 [a&]:hover:bg-blue-500/20 dark:[a&]:hover:bg-blue-400/25",
        indigo:
          "border-indigo-500/40 bg-indigo-100 text-indigo-900 dark:border-indigo-400/35 dark:bg-indigo-400/15 dark:text-indigo-300 [a&]:hover:bg-indigo-500/20 dark:[a&]:hover:bg-indigo-400/25",
        violet:
          "border-violet-500/40 bg-violet-100 text-violet-900 dark:border-violet-400/35 dark:bg-violet-400/15 dark:text-violet-300 [a&]:hover:bg-violet-500/20 dark:[a&]:hover:bg-violet-400/25",
        purple:
          "border-purple-500/40 bg-purple-100 text-purple-900 dark:border-purple-400/35 dark:bg-purple-400/15 dark:text-purple-300 [a&]:hover:bg-purple-500/20 dark:[a&]:hover:bg-purple-400/25",
        fuchsia:
          "border-fuchsia-500/40 bg-fuchsia-100 text-fuchsia-900 dark:border-fuchsia-400/35 dark:bg-fuchsia-400/15 dark:text-fuchsia-300 [a&]:hover:bg-fuchsia-500/20 dark:[a&]:hover:bg-fuchsia-400/25",
        pink: "border-pink-500/40 bg-pink-100 text-pink-900 dark:border-pink-400/35 dark:bg-pink-400/15 dark:text-pink-300 [a&]:hover:bg-pink-500/20 dark:[a&]:hover:bg-pink-400/25",
        rose: "border-rose-500/40 bg-rose-100 text-rose-900 dark:border-rose-400/35 dark:bg-rose-400/15 dark:text-rose-300 [a&]:hover:bg-rose-500/20 dark:[a&]:hover:bg-rose-400/25",
      },
      solid: {
        true: "",
        false: "",
      },
      counter: {
        true: "tabular-nums rounded-sm gap-0",
        false: "",
      },
      size: {
        // Intrinsic heights let wrapped text grow and keep caller h-* overrides.
        xs: "text-[10px] leading-3 px-1.5 py-px [&>svg]:size-2.5 has-data-[icon=inline-start]:ps-1 has-data-[icon=inline-end]:pe-1",
        sm: "text-xs leading-4 px-2 py-px [&>svg]:size-3 has-data-[icon=inline-start]:ps-1.5 has-data-[icon=inline-end]:pe-1.5",
        md: "text-xs leading-4 px-2 py-0.75 [&>svg]:size-3 has-data-[icon=inline-start]:ps-2 has-data-[icon=inline-end]:pe-2",
        lg: "text-sm leading-5 px-3 py-0.75 [&>svg]:size-3.5 has-data-[icon=inline-start]:ps-2.5 has-data-[icon=inline-end]:pe-2.5",
      },
    },
    compoundVariants: [
      {
        variant: "primary",
        solid: true,
        className:
          "bg-primary-400 border-primary-600 text-primary-950 dark:bg-primary-400 dark:border-primary-500 dark:text-primary-950 [a&]:hover:bg-primary-500",
      },
      {
        variant: "success",
        solid: true,
        className:
          "bg-green-400 border-green-600 text-green-950 dark:bg-green-400 dark:border-green-500 dark:text-green-950 [a&]:hover:bg-green-500",
      },
      {
        variant: "warning",
        solid: true,
        className:
          "bg-orange-300 border-orange-500 text-orange-950 dark:bg-orange-300 dark:border-orange-500 dark:text-orange-950 [a&]:hover:bg-orange-400",
      },
      {
        variant: "info",
        solid: true,
        className:
          "bg-indigo-300 border-indigo-500 text-indigo-950 dark:bg-indigo-300 dark:border-indigo-500 dark:text-indigo-950 [a&]:hover:bg-indigo-400",
      },
      {
        variant: "destructive",
        solid: true,
        className:
          "bg-red-600 border-red-500 text-white dark:bg-red-500 dark:border-red-500 dark:text-white [a&]:hover:bg-red-500",
      },
      { counter: true, size: "xs", className: "min-w-4 px-1" },
      { counter: true, size: "sm", className: "min-w-5 px-1" },
      { counter: true, size: "md", className: "min-w-6 px-1.5" },
      { counter: true, size: "lg", className: "min-w-7 px-2" },
    ],
    defaultVariants: {
      variant: "primary",
      solid: false,
      counter: false,
      size: "md",
    },
  },
);

export type BadgeVariant = NonNullable<
  VariantProps<typeof badgeVariants>["variant"]
>;
export type BadgeSize = NonNullable<VariantProps<typeof badgeVariants>["size"]>;

const semanticVariants: ReadonlySet<BadgeVariant> = new Set([
  "primary",
  "success",
  "warning",
  "info",
  "destructive",
]);

// Icon size inside the close button
const closeIconSizeMap: Record<BadgeSize, string> = {
  xs: "size-2.5",
  sm: "size-3",
  md: "size-3",
  lg: "size-3.5",
};

function Badge({
  className,
  variant = "primary",
  size = "md",
  render,
  asChild = false,
  dot = false,
  solid = false,
  counter = false,
  onClose,
  children,
  ...props
}: useRender.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    asChild?: boolean;
    dot?: boolean;
    /** Solid filled background — only applies to the 5 semantic variants */
    solid?: boolean;
    /** Counter pill — square at single digit, grows for multi-digit, tabular-nums */
    counter?: boolean;
    /** Renders a close (×) button; not compatible with a custom `render` element */
    onClose?: React.MouseEventHandler<HTMLButtonElement>;
  }) {
  const { t } = useTranslation();
  const child =
    asChild && React.isValidElement<{ children?: React.ReactNode }>(children)
      ? children
      : undefined;
  const useSolidPalette = Boolean(
    solid && variant && semanticVariants.has(variant),
  );

  return useRender({
    defaultTagName: "span",
    render: child ?? render,
    state: {
      slot: "badge",
      variant,
      solid: solid || undefined,
    },
    props: mergeProps<"span">(
      {
        className: cn(
          badgeVariants({ variant, size, solid: useSolidPalette, counter }),
          onClose && "pe-0",
          className,
        ),
        children: (
          <>
            {dot && (
              <span
                data-slot="badge-dot"
                className="size-1.5 shrink-0 rounded-full bg-current"
                aria-hidden="true"
              />
            )}
            {child ? child.props.children : children}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label={t("remove")}
                className="inline-flex aspect-square shrink-0 cursor-pointer items-center justify-center self-stretch rounded-r-sm opacity-60 outline-none hover:bg-current/20 hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-indigo-500/80 focus-visible:ring-inset"
              >
                <X
                  className={cn(
                    closeIconSizeMap[size as BadgeSize] ?? "size-3",
                  )}
                />
              </button>
            )}
          </>
        ),
      },
      props,
    ),
  });
}

export { Badge, badgeVariants };
