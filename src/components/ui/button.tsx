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

// Breakpoints change defaults so caller height and padding classes still win.
const responsiveButtonSize =
  "h-(--button-height) px-(--button-padding-x) [--button-height:--spacing(12)] [--button-padding-x:--spacing(4.5)] md:[--button-height:--spacing(10)] md:[--button-padding-x:--spacing(3.5)]";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 px-3 whitespace-nowrap rounded-md not-in-data-[slot=button-group]:rounded-squircle-lg border border-transparent bg-clip-padding text-sm font-semibold tracking-wide outline-0 select-none shrink-0 transition touch-action-manipulation [-webkit-tap-highlight-color:transparent] group/button [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-invalid:outline-2 aria-invalid:outline-offset-2 aria-invalid:outline-destructive ",
  {
    variants: {
      variant: {
        // CARE names retained for existing callers; all use CareUI styling.
        primary:
          "text-shadow-xs text-shadow-primary-950/75 dark:text-shadow-primary-200/50 border-primary-950/90 dark:border-primary-900 bg-primary text-primary-foreground shadow-md shadow-primary/50 dark:shadow-background hover:bg-primary/90 not-disabled:inset-shadow-2xs not-disabled:inset-shadow-primary-200/30 dark:not-disabled:inset-shadow-2xs dark:not-disabled:inset-shadow-primary-200/80 [:active,[data-pressed]]:bg-primary/80 [:active,[data-pressed]]:inset-shadow-sm [:active,[data-pressed]]:inset-shadow-primary-800 dark:[:active,[data-pressed]]:inset-shadow-sm dark:[:active,[data-pressed]]:inset-shadow-primary-800 [:disabled,:active,[data-pressed]]:shadow-none",
        primary_gradient:
          "text-shadow-xs text-shadow-primary-950/75 dark:text-shadow-primary-200/50 border-primary-950/90 dark:border-primary-900 bg-primary text-primary-foreground shadow-md shadow-primary/50 dark:shadow-background hover:bg-primary/90 not-disabled:inset-shadow-2xs not-disabled:inset-shadow-primary-200/30 dark:not-disabled:inset-shadow-2xs dark:not-disabled:inset-shadow-primary-200/80 [:active,[data-pressed]]:bg-primary/80 [:active,[data-pressed]]:inset-shadow-sm [:active,[data-pressed]]:inset-shadow-primary-800 dark:[:active,[data-pressed]]:inset-shadow-sm dark:[:active,[data-pressed]]:inset-shadow-primary-800 [:disabled,:active,[data-pressed]]:shadow-none",
        outline_primary:
          "border border-primary-700 bg-background text-primary-900 dark:text-primary-500 shadow-md hover:border-primary-600 hover:bg-primary-700/10 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground [:active,[data-pressed]]:bg-primary-700/5 [:active,[data-pressed]]:inset-shadow-sm [:active,[data-pressed]]:inset-shadow-neutral-500/35 dark:[:active,[data-pressed]]:inset-shadow-neutral-950 [:disabled,:active,[data-pressed]]:shadow-none",
        white:
          "border-border border-stronger-border bg-background shadow-md hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground [:active,[data-pressed]]:bg-muted/80 [:active,[data-pressed]]:inset-shadow-sm [:active,[data-pressed]]:inset-shadow-neutral-400/50 dark:[:active,[data-pressed]]:inset-shadow-neutral-950/80 [:disabled,:active,[data-pressed]]:shadow-none dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        warning:
          "border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-200 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100",
        alert:
          "border-violet-300 bg-violet-100 text-violet-900 hover:bg-violet-200 dark:border-violet-700 dark:bg-violet-950 dark:text-violet-100",

        default:
          "text-shadow-xs text-shadow-primary-950/75 dark:text-shadow-primary-200/50 border-primary-950/90 dark:border-primary-900 bg-primary text-primary-foreground shadow-md shadow-primary/50 dark:shadow-background hover:bg-primary/90 not-disabled:inset-shadow-2xs not-disabled:inset-shadow-primary-200/30 dark:not-disabled:inset-shadow-2xs dark:not-disabled:inset-shadow-primary-200/80 [:active,[data-pressed]]:bg-primary/80 [:active,[data-pressed]]:inset-shadow-sm [:active,[data-pressed]]:inset-shadow-primary-800 dark:[:active,[data-pressed]]:inset-shadow-sm dark:[:active,[data-pressed]]:inset-shadow-primary-800 [:disabled,:active,[data-pressed]]:shadow-none",
        secondary:
          "border border-primary-700 bg-background text-primary-900 dark:text-primary-500 shadow-md hover:border-primary-600 hover:bg-primary-700/10 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground [:active,[data-pressed]]:bg-primary-700/5 [:active,[data-pressed]]:inset-shadow-sm [:active,[data-pressed]]:inset-shadow-neutral-500/35 dark:[:active,[data-pressed]]:inset-shadow-neutral-950 [:disabled,:active,[data-pressed]]:shadow-none",
        tertiary:
          "bg-muted-background/70 hover:bg-muted hover:text-foreground hover:border-border aria-expanded:bg-muted aria-expanded:text-foreground [:active,[data-pressed]]:bg-muted/90 [:active,[data-pressed]]:inset-shadow-sm [:active,[data-pressed]]:inset-shadow-neutral-400/40 dark:hover:bg-muted dark:[:active,[data-pressed]]:inset-shadow-neutral-950/80",
        outline:
          "border-border border-stronger-border bg-background shadow-md hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground [:active,[data-pressed]]:bg-muted/80 [:active,[data-pressed]]:inset-shadow-sm [:active,[data-pressed]]:inset-shadow-neutral-400/50 dark:[:active,[data-pressed]]:inset-shadow-neutral-950/80 [:disabled,:active,[data-pressed]]:shadow-none dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        ghost:
          "hover:bg-muted-background hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground [:active,[data-pressed]]:bg-muted dark:hover:bg-muted [:active,[data-pressed]]:bg-muted/90 [:active,[data-pressed]]:inset-shadow-sm [:active,[data-pressed]]:inset-shadow-neutral-400/40 dark:hover:bg-muted dark:[:active,[data-pressed]]:inset-shadow-neutral-950/80",
        link: "text-blue-700 underline underline-offset-4 transition-[color,text-underline-offset] hover:underline-offset-2 hover:text-blue-800 [:active,[data-pressed]]:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 dark:[:active,[data-pressed]]:text-blue-200",
        destructive:
          "border border-destructive/70 bg-red-100/75 text-red-700 shadow-md hover:bg-destructive/20 focus-visible:outline-destructive [:active,[data-pressed]]:bg-destructive/25 [:active,[data-pressed]]:inset-shadow-sm [:active,[data-pressed]]:inset-shadow-red-400/40 [:disabled,:active,[data-pressed]]:shadow-none dark:bg-destructive/5 dark:hover:border-destructive/75 dark:text-red-400 dark:hover:bg-destructive/4 dark:[:active,[data-pressed]]:bg-destructive/5 dark:[:active,[data-pressed]]:inset-shadow-neutral-950",
        "destructive-solid":
          "text-shadow-xs text-shadow-red-950/75 dark:text-shadow-red-900 border border-red-700 bg-destructive text-white shadow-md hover:bg-destructive/80 focus-visible:outline-destructive [:active,[data-pressed]]:bg-destructive/70 [:active,[data-pressed]]:inset-shadow-sm [:active,[data-pressed]]:inset-shadow-destructive/90 [:disabled,:active,[data-pressed]]:shadow-none dark:bg-red-500/90 dark:[:active,[data-pressed]]:inset-shadow-red-950/90 dark:hover:bg-red-500/80 dark:[:active,[data-pressed]]:bg-red-500/70",
      },
      size: {
        md: responsiveButtonSize,
        default: [
          responsiveButtonSize,
          "[&_svg:not([class*='size-'])]:size-5 [&_svg]:stroke-[1.75] has-data-[icon=inline-start]:pl-3 has-data-[icon=inline-end]:pr-3 in-data-[slot=button-group]:rounded-[min(var(--radius-md),10px)]",
        ],
        xs: "h-8 gap-1 px-2.5 rounded-[min(var(--radius-md),8px)] text-xs [&_svg:not([class*='size-'])]:size-3.5 has-data-[icon=inline-start]:pl-2 has-data-[icon=inline-end]:pr-2 in-data-[slot=button-group]:rounded-md",
        sm: "h-9 gap-1.5 px-3 rounded-[min(var(--radius-md),10px)] [&_svg:not([class*='size-'])]:size-4 has-data-[icon=inline-start]:pl-2.5 has-data-[icon=inline-end]:pr-2.5 in-data-[slot=button-group]:rounded-md",
        lg: "h-11 gap-1.5 px-4 text-base [&_svg:not([class*='size-'])]:size-5 [&_svg]:stroke-[1.75] has-data-[icon=inline-start]:pl-3 has-data-[icon=inline-end]:pr-3 in-data-[slot=button-group]:rounded-[min(var(--radius-md),10px)]",
        xl: "h-12 gap-2 px-4.5 text-base [&_svg:not([class*='size-'])]:size-5 has-data-[icon=inline-start]:pl-4 has-data-[icon=inline-end]:pr-4 in-data-[slot=button-group]:rounded-[min(var(--radius-md),12px)]",
        icon: "h-(--button-size) w-(--button-size) [--button-size:--spacing(12)] md:[--button-size:--spacing(10)] [&_svg:not([class*='size-'])]:size-5 [&_svg]:stroke-[1.75]",
        "icon-xs":
          "size-8 rounded-[min(var(--radius-md),8px)] [&_svg:not([class*='size-'])]:size-3.5 [&_svg]:stroke-2 in-data-[slot=button-group]:rounded-md",
        "icon-sm":
          "size-9 rounded-[min(var(--radius-md),10px)] [&_svg:not([class*='size-'])]:size-4 [&_svg]:stroke-2 in-data-[slot=button-group]:rounded-md",
        "icon-lg":
          "size-11 [&_svg:not([class*='size-'])]:size-5 [&_svg]:stroke-[1.75] in-data-[slot=button-group]:rounded-[min(var(--radius-md),10px)]",
        "icon-xl":
          "size-12 [&_svg:not([class*='size-'])]:size-6 in-data-[slot=button-group]:rounded-[min(var(--radius-md),12px)]",
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
  /** Whether the render target needs non-native button handling. */
  isNonButtonTag: boolean;
  isLink: boolean;
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
      isNonButtonTag: child.type !== "button",
      isLink: child.type !== "button" && child.props.href != null,
    };
  }

  const renderElement = React.isValidElement<{ href?: unknown }>(render)
    ? render
    : undefined;
  const isLink =
    renderElement?.type !== "button" && renderElement?.props.href != null;

  return {
    render,
    children,
    isNonButtonTag:
      !!renderElement &&
      (typeof renderElement.type === "string"
        ? renderElement.type !== "button"
        : isLink),
    isLink,
  };
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
      {...(resolved.isLink ? { role: "link" } : {})}
      {...props}
    >
      {resolved.children}
    </ButtonPrimitive>
  );
}

export type ButtonVariant = NonNullable<
  VariantProps<typeof buttonVariants>["variant"]
>;
export type ButtonSize = NonNullable<
  VariantProps<typeof buttonVariants>["size"]
>;

export { Button, buttonVariants };
