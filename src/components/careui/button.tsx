// CareUI registry source: ohcnetwork/careui (d5cff874). Semantic color utilities
// are namespaced cui-* to coexist with CARE 3.1's existing theme.
/**
 * @name button
 * @description Displays a button or a component that looks like a button.
 * @dependencies @base-ui/react class-variance-authority
 * @type registry:ui
 */
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 px-3 whitespace-nowrap rounded-md not-in-data-[slot=button-group]:rounded-squircle-lg border border-transparent bg-clip-padding text-sm font-semibold tracking-wide outline-0 select-none shrink-0 transition touch-action-manipulation [-webkit-tap-highlight-color:transparent] group/button [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 aria-invalid:outline-2 aria-invalid:outline-offset-2 aria-invalid:outline-cui-destructive ",
  {
    variants: {
      variant: {
        default:
          "text-shadow-xs text-shadow-cui-primary-950/75 dark:text-shadow-cui-primary-200/50 border-cui-primary-950/90 dark:border-cui-primary-900 bg-cui-primary text-cui-primary-foreground shadow-md shadow-cui-primary/50 dark:shadow-cui-background hover:bg-cui-primary/90 not-disabled:inset-shadow-2xs not-disabled:inset-shadow-cui-primary-200/30 dark:not-disabled:inset-shadow-2xs dark:not-disabled:inset-shadow-cui-primary-200/80 [:active,[data-pressed]]:bg-cui-primary/80 [:active,[data-pressed]]:inset-shadow-sm [:active,[data-pressed]]:inset-shadow-cui-primary-800 dark:[:active,[data-pressed]]:inset-shadow-sm dark:[:active,[data-pressed]]:inset-shadow-cui-primary-800 [:disabled,:active,[data-pressed]]:shadow-none",
        secondary:
          "border border-cui-primary-700 bg-cui-background text-cui-primary-900 dark:text-cui-primary-500 shadow-md hover:border-cui-primary-600 hover:bg-cui-primary-700/10 aria-expanded:bg-cui-secondary aria-expanded:text-cui-secondary-foreground [:active,[data-pressed]]:bg-cui-primary-700/5 [:active,[data-pressed]]:inset-shadow-sm [:active,[data-pressed]]:inset-shadow-neutral-500/35 dark:[:active,[data-pressed]]:inset-shadow-neutral-950 [:disabled,:active,[data-pressed]]:shadow-none",
        tertiary:
          "underline underline-offset-4 bg-cui-muted-background/70 hover:bg-cui-muted hover:text-cui-foreground hover:border-cui-border aria-expanded:bg-cui-muted aria-expanded:text-cui-foreground [:active,[data-pressed]]:bg-cui-muted/90 [:active,[data-pressed]]:inset-shadow-sm [:active,[data-pressed]]:inset-shadow-neutral-400/40 dark:hover:bg-cui-muted dark:[:active,[data-pressed]]:inset-shadow-neutral-950/80",
        outline:
          "border-cui-border border-cui-stronger-border bg-cui-background shadow-md hover:bg-cui-muted hover:text-cui-foreground aria-expanded:bg-cui-muted aria-expanded:text-cui-foreground [:active,[data-pressed]]:bg-cui-muted/80 [:active,[data-pressed]]:inset-shadow-sm [:active,[data-pressed]]:inset-shadow-neutral-400/50 dark:[:active,[data-pressed]]:inset-shadow-neutral-950/80 [:disabled,:active,[data-pressed]]:shadow-none dark:border-cui-input dark:bg-cui-input/30 dark:hover:bg-cui-input/50",
        ghost:
          "underline underline-offset-4 hover:bg-cui-strong-background/75 hover:text-cui-foreground aria-expanded:bg-cui-muted aria-expanded:text-cui-foreground [:active,[data-pressed]]:bg-cui-muted/90 dark:hover:bg-cui-muted",
        link: "text-blue-700 underline underline-offset-4 transition-[color,text-underline-offset] hover:underline-offset-2 hover:text-blue-800 [:active,[data-pressed]]:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 dark:[:active,[data-pressed]]:text-blue-200",
        destructive:
          "border border-cui-destructive/70 bg-red-100/75 text-red-700 shadow-md hover:bg-cui-destructive/20 focus-visible:outline-cui-destructive [:active,[data-pressed]]:bg-cui-destructive/25 [:active,[data-pressed]]:inset-shadow-sm [:active,[data-pressed]]:inset-shadow-red-400/40 [:disabled,:active,[data-pressed]]:shadow-none dark:bg-cui-destructive/5 dark:hover:border-cui-destructive/75 dark:text-red-400 dark:hover:bg-cui-destructive/4 dark:[:active,[data-pressed]]:bg-cui-destructive/5 dark:[:active,[data-pressed]]:inset-shadow-neutral-950",
        "destructive-solid":
          "text-shadow-xs text-shadow-red-950/75 dark:text-shadow-red-900 border border-red-700 bg-cui-destructive text-white shadow-md hover:bg-cui-destructive/80 focus-visible:outline-cui-destructive [:active,[data-pressed]]:bg-cui-destructive/70 [:active,[data-pressed]]:inset-shadow-sm [:active,[data-pressed]]:inset-shadow-cui-destructive/90 [:disabled,:active,[data-pressed]]:shadow-none dark:bg-red-500/90 dark:[:active,[data-pressed]]:inset-shadow-red-950/90 dark:hover:bg-red-500/80 dark:[:active,[data-pressed]]:bg-red-500/70",
      },
      size: {
        default:
          "h-12 md:h-10 px-4.5 md:px-3.5 [&_svg:not([class*='size-'])]:size-5 [&_svg]:stroke-[1.75] has-data-[icon=inline-start]:pl-3 has-data-[icon=inline-end]:pr-3 in-data-[slot=button-group]:rounded-[min(var(--radius-md),10px)]",
        xs: "h-8 md:h-8 gap-1 px-2.5 rounded-[min(var(--radius-md),8px)] text-xs [&_svg:not([class*='size-'])]:size-3.5 has-data-[icon=inline-start]:pl-2 has-data-[icon=inline-end]:pr-2 in-data-[slot=button-group]:rounded-md",
        sm: "h-9 md:h-9 gap-1.5 px-3 rounded-[min(var(--radius-md),10px)] [&_svg:not([class*='size-'])]:size-4 has-data-[icon=inline-start]:pl-2.5 has-data-[icon=inline-end]:pr-2.5 in-data-[slot=button-group]:rounded-md",
        lg: "h-11 md:h-11 gap-1.5 px-4 text-base [&_svg:not([class*='size-'])]:size-5 [&_svg]:stroke-[1.75] has-data-[icon=inline-start]:pl-3 has-data-[icon=inline-end]:pr-3 in-data-[slot=button-group]:rounded-[min(var(--radius-md),10px)]",
        xl: "h-12 md:h-12 gap-2 px-4.5 text-base [&_svg:not([class*='size-'])]:size-5 has-data-[icon=inline-start]:pl-4 has-data-[icon=inline-end]:pr-4 in-data-[slot=button-group]:rounded-[min(var(--radius-md),12px)]",
        icon: "size-12 md:size-10 [&_svg:not([class*='size-'])]:size-5 [&_svg]:stroke-[1.75]",
        "icon-xs":
          "size-8 md:size-8 rounded-[min(var(--radius-md),8px)] [&_svg:not([class*='size-'])]:size-3.5 [&_svg]:stroke-2 in-data-[slot=button-group]:rounded-md",
        "icon-sm":
          "size-9 md:size-9 rounded-[min(var(--radius-md),10px)] [&_svg:not([class*='size-'])]:size-4 [&_svg]:stroke-2 in-data-[slot=button-group]:rounded-md",
        "icon-lg":
          "size-11 md:size-11 [&_svg:not([class*='size-'])]:size-5 [&_svg]:stroke-[1.75] in-data-[slot=button-group]:rounded-[min(var(--radius-md),10px)]",
        "icon-xl":
          "size-12 md:size-12 [&_svg:not([class*='size-'])]:size-6 in-data-[slot=button-group]:rounded-[min(var(--radius-md),12px)]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type RenderProp =
  | React.ReactElement
  | ((props: unknown, state: unknown) => React.ReactElement)
  | undefined;

function resolveAsChild(
  asChild: boolean | undefined,
  children: React.ReactNode,
  render: RenderProp,
): {
  render: RenderProp;
  children: React.ReactNode;
  /** True when the resolved child is a plain non-button DOM tag (e.g. `<a>`). */
  isNonButtonTag: boolean;
} {
  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{
      children?: React.ReactNode;
      [key: string]: unknown;
    }>;
    const { children: extractedChildren, ...restProps } = child.props;
    return {
      render: React.createElement(child.type as React.ElementType, restProps),
      children: extractedChildren,
      isNonButtonTag: typeof child.type === "string" && child.type !== "button",
    };
  }
  return { render, children, isNonButtonTag: false };
}

function Button({
  className,
  variant = "default",
  size = "default",
  asChild,
  render,
  nativeButton,
  children,
  ...props
}: Omit<ButtonPrimitive.Props, "render"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    render?: RenderProp;
  }) {
  const resolved = resolveAsChild(asChild, children, render);

  return (
    <ButtonPrimitive
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      render={resolved.render}
      nativeButton={nativeButton ?? !resolved.isNonButtonTag}
      {...props}
    >
      {resolved.children}
    </ButtonPrimitive>
  );
}

export { Button, buttonVariants };
