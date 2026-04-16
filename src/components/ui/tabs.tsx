/**
 * @name tabs
 * @description A set of layered sections of content—known as tab panels—that are displayed one at a time.
 * @dependencies radix-ui
 * @type registry:ui
 */
import { cva, type VariantProps } from "class-variance-authority";
import { Tabs as TabsPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "@/lib/utils";

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-horizontal:flex-col [&:has([data-variant=browser])]:gap-0",
        className,
      )}
      {...props}
    />
  );
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-0.5 text-muted-foreground group-data-horizontal/tabs:h-12 md:group-data-horizontal/tabs:h-10 group-data-vertical/tabs:h-fit md:group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col",
  {
    variants: {
      variant: {
        default: "bg-muted ring ring-border",
        line: "rounded-none gap-1 bg-transparent justify-start",
        browser:
          "rounded-none p-0 border-b border-border gap-1 items-end bg-transparent w-full justify-start group-data-horizontal/tabs:h-auto md:group-data-horizontal/tabs:h-auto",
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
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex min-h-9 h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2.5 md:px-2 py-1 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 has-data-[icon=inline-end]:pr-2 md:has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-2 md:has-data-[icon=inline-start]:pl-1.5 dark:text-muted-foreground dark:hover:text-foreground group-data-[variant=default]/tabs-list:data-active:shadow-sm group-data-[variant=line]/tabs-list:data-active:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "group-data-[variant=line]/tabs-list:flex-none group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent dark:group-data-[variant=line]/tabs-list:data-active:border-transparent dark:group-data-[variant=line]/tabs-list:data-active:bg-transparent",
        "group-data-[variant=browser]/tabs-list:flex-none group-data-[variant=browser]/tabs-list:h-auto group-data-[variant=browser]/tabs-list:rounded-t-lg group-data-[variant=browser]/tabs-list:rounded-b-none group-data-[variant=browser]/tabs-list:-mb-px group-data-[variant=browser]/tabs-list:border group-data-[variant=browser]/tabs-list:border-border/60 group-data-[variant=browser]/tabs-list:bg-muted/50 group-data-[variant=browser]/tabs-list:shadow-[inset_0_-1px_4px_rgba(0,0,0,0.06)] dark:group-data-[variant=browser]/tabs-list:shadow-[inset_0_-3px_6px_rgba(0,0,0,0.2)] group-data-[variant=browser]/tabs-list:after:hidden group-data-[variant=browser]/tabs-list:data-active:bg-background group-data-[variant=browser]/tabs-list:data-active:border-border group-data-[variant=browser]/tabs-list:data-active:border-b-transparent group-data-[variant=browser]/tabs-list:data-active:text-foreground group-data-[variant=browser]/tabs-list:data-active:shadow-none",
        "data-active:bg-background data-active:text-primary-900 dark:group-data-[variant=default]/tabs-list:data-active:border-input dark:group-data-[variant=default]/tabs-list:data-active:bg-input/30 dark:group-data-[variant=default]/tabs-list:data-active:text-primary-400 dark:group-data-[variant=line]/tabs-list:data-active:text-primary-400",
        "after:absolute after:bg-primary after:opacity-0 after:transition-opacity group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:-bottom-1 group-data-horizontal/tabs:after:h-1 group-data-horizontal/tabs:after:rounded-t group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:-right-1 group-data-vertical/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        "flex-1 text-sm outline-none group-has-[[data-variant=browser]]/tabs:bg-background group-has-[[data-variant=browser]]/tabs:border-t-transparent group-has-[[data-variant=browser]]/tabs:rounded-tr-none",
        className,
      )}
      {...props}
    />
  );
}

export { Tabs, TabsContent, TabsList, tabsListVariants, TabsTrigger };
