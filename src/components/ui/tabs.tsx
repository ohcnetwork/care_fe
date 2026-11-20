/**
 * @name tabs
 * @description A set of layered sections of content—known as tab panels—that are displayed one at a time.
 * @dependencies @base-ui/react class-variance-authority
 * @type registry:ui
 */
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const TabsActivationContext = React.createContext(true);

function Tabs({
  className,
  orientation = "horizontal",
  activationMode = "automatic",
  onValueChange,
  ...props
}: Omit<TabsPrimitive.Root.Props, "onValueChange"> & {
  activationMode?: "automatic" | "manual";
  onValueChange?: (value: string) => void;
}) {
  return (
    <TabsActivationContext.Provider value={activationMode === "automatic"}>
      <TabsPrimitive.Root
        onValueChange={(value) => {
          if (typeof value === "string") onValueChange?.(value);
        }}
        orientation={orientation}
        data-slot="tabs"
        data-orientation={orientation}
        className={cn(
          "group/tabs flex gap-2 data-horizontal:flex-col [&:has(>[data-slot=tabs-list][data-variant=browser])]:gap-0",
          className,
        )}
        {...props}
      />
    </TabsActivationContext.Provider>
  );
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-0.5 text-muted-foreground h-(--tabs-list-height) [--tabs-list-height:--spacing(12)] md:[--tabs-list-height:--spacing(10)] data-vertical:[--tabs-list-height:fit-content] data-vertical:flex-col",
  {
    variants: {
      variant: {
        default: "bg-muted ring ring-border",
        line: "rounded-none gap-1 bg-transparent justify-start",
        browser:
          "rounded-none p-0 border-b border-border gap-1 items-end bg-transparent w-full justify-start h-auto",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function TabsList({
  className,
  variant = "default",
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  const activateOnFocus = React.useContext(TabsActivationContext);
  return (
    <TabsPrimitive.List
      activateOnFocus={activateOnFocus}
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  asChild = false,
  children,
  render,
  nativeButton,
  ...props
}: TabsPrimitive.Tab.Props & { asChild?: boolean }) {
  const child =
    asChild && React.isValidElement<{ children?: React.ReactNode }>(children)
      ? children
      : undefined;
  return (
    <TabsPrimitive.Tab
      render={child ?? render}
      nativeButton={nativeButton ?? !child}
      children={child ? child.props.children : children}
      data-slot="tabs-trigger"
      className={cn(
        "text-foreground/60 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:text-muted-foreground dark:hover:text-foreground relative inline-flex h-(--tabs-trigger-height) [--tabs-trigger-height:calc(100%-1px)] min-h-9 flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent pl-(--tabs-trigger-pl) pr-(--tabs-trigger-pr) py-1 text-sm font-medium whitespace-nowrap transition-all data-vertical:w-full data-vertical:justify-start focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 has-data-[icon=inline-end]:[--tabs-trigger-pr:--spacing(2)] has-data-[icon=inline-start]:[--tabs-trigger-pl:--spacing(2)] aria-disabled:pointer-events-none aria-disabled:opacity-50 group-data-[variant=default]/tabs-list:data-active:shadow-sm group-data-[variant=line]/tabs-list:data-active:shadow-none [--tabs-trigger-pl:--spacing(2.5)] [--tabs-trigger-pr:--spacing(2.5)] md:[--tabs-trigger-pl:--spacing(2)] md:[--tabs-trigger-pr:--spacing(2)] md:has-data-[icon=inline-end]:[--tabs-trigger-pr:--spacing(1.5)] md:has-data-[icon=inline-start]:[--tabs-trigger-pl:--spacing(1.5)] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "group-data-[variant=line]/tabs-list:flex-none group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent dark:group-data-[variant=line]/tabs-list:data-active:border-transparent dark:group-data-[variant=line]/tabs-list:data-active:bg-transparent",
        "group-data-[variant=browser]/tabs-list:border-border/60 group-data-[variant=browser]/tabs-list:bg-muted/50 group-data-[variant=browser]/tabs-list:data-active:bg-background group-data-[variant=browser]/tabs-list:data-active:border-border group-data-[variant=browser]/tabs-list:data-active:text-foreground group-data-[variant=browser]/tabs-list:-mb-px group-data-[variant=browser]/tabs-list:[--tabs-trigger-height:auto] group-data-[variant=browser]/tabs-list:flex-none group-data-[variant=browser]/tabs-list:rounded-t-lg group-data-[variant=browser]/tabs-list:rounded-b-none group-data-[variant=browser]/tabs-list:border group-data-[variant=browser]/tabs-list:shadow-[inset_0_-1px_4px_rgba(0,0,0,0.06)] group-data-[variant=browser]/tabs-list:after:hidden group-data-[variant=browser]/tabs-list:data-active:border-b-transparent group-data-[variant=browser]/tabs-list:data-active:shadow-none dark:group-data-[variant=browser]/tabs-list:shadow-[inset_0_-3px_6px_rgba(0,0,0,0.2)]",
        "data-active:bg-background data-active:text-primary-900 dark:group-data-[variant=default]/tabs-list:data-active:border-input dark:group-data-[variant=default]/tabs-list:data-active:bg-input/30 dark:group-data-[variant=default]/tabs-list:data-active:text-primary-400 dark:group-data-[variant=line]/tabs-list:data-active:text-primary-400",
        "after:bg-primary after:absolute after:opacity-0 after:transition-opacity data-horizontal:after:inset-x-0 data-horizontal:after:-bottom-1 data-horizontal:after:h-1 data-horizontal:after:rounded-t data-vertical:after:inset-y-0 data-vertical:after:-right-1 data-vertical:after:w-0.5 group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  forceMount,
  keepMounted,
  ...props
}: TabsPrimitive.Panel.Props & { forceMount?: boolean }) {
  return (
    <TabsPrimitive.Panel
      keepMounted={keepMounted ?? forceMount}
      data-slot="tabs-content"
      className={cn(
        "flex-1 text-sm outline-none [[data-slot=tabs]:has(>[data-slot=tabs-list][data-variant=browser])>&]:bg-background [[data-slot=tabs]:has(>[data-slot=tabs-list][data-variant=browser])>&]:rounded-tr-none [[data-slot=tabs]:has(>[data-slot=tabs-list][data-variant=browser])>&]:border-t-transparent",
        className,
      )}
      {...props}
    />
  );
}

export { Tabs, TabsContent, TabsList, tabsListVariants, TabsTrigger };
