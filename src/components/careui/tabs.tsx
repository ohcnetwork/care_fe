// CareUI registry source: ohcnetwork/careui (d5cff874). Semantic color utilities
// are namespaced cui-* to coexist with CARE 3.1's existing theme.
/**
 * @name tabs
 * @description A set of layered sections of content—known as tab panels—that are displayed one at a time.
 * @dependencies @base-ui/react class-variance-authority
 * @type registry:ui
 */
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-[orientation=horizontal]:flex-col [&:has([data-variant=browser])]:gap-0",
        className,
      )}
      {...props}
    />
  );
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-0.5 text-cui-muted-foreground group-data-[orientation=horizontal]/tabs:h-12 md:group-data-[orientation=horizontal]/tabs:h-10 group-data-[orientation=vertical]/tabs:h-fit md:group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col",
  {
    variants: {
      variant: {
        default: "bg-cui-muted ring ring-cui-border",
        line: "rounded-none gap-1 bg-transparent justify-start",
        browser:
          "rounded-none p-0 border-b border-cui-border gap-1 items-end bg-transparent w-full justify-start group-data-[orientation=horizontal]/tabs:h-auto md:group-data-[orientation=horizontal]/tabs:h-auto",
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
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "text-cui-foreground/60 hover:text-cui-foreground focus-visible:border-cui-ring focus-visible:ring-cui-ring/50 focus-visible:outline-cui-ring dark:text-cui-muted-foreground dark:hover:text-cui-foreground relative inline-flex h-[calc(100%-1px)] min-h-9 flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2.5 py-1 text-sm font-medium whitespace-nowrap transition-all group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 aria-disabled:pointer-events-none aria-disabled:opacity-50 group-data-[variant=default]/tabs-list:data-active:shadow-sm group-data-[variant=line]/tabs-list:data-active:shadow-none md:px-2 md:has-data-[icon=inline-end]:pr-1.5 md:has-data-[icon=inline-start]:pl-1.5 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "group-data-[variant=line]/tabs-list:flex-none group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent dark:group-data-[variant=line]/tabs-list:data-active:border-transparent dark:group-data-[variant=line]/tabs-list:data-active:bg-transparent",
        "group-data-[variant=browser]/tabs-list:border-cui-border/60 group-data-[variant=browser]/tabs-list:bg-cui-muted/50 group-data-[variant=browser]/tabs-list:data-active:bg-cui-background group-data-[variant=browser]/tabs-list:data-active:border-cui-border group-data-[variant=browser]/tabs-list:data-active:text-cui-foreground group-data-[variant=browser]/tabs-list:-mb-px group-data-[variant=browser]/tabs-list:h-auto group-data-[variant=browser]/tabs-list:flex-none group-data-[variant=browser]/tabs-list:rounded-t-lg group-data-[variant=browser]/tabs-list:rounded-b-none group-data-[variant=browser]/tabs-list:border group-data-[variant=browser]/tabs-list:shadow-[inset_0_-1px_4px_rgba(0,0,0,0.06)] group-data-[variant=browser]/tabs-list:after:hidden group-data-[variant=browser]/tabs-list:data-active:border-b-transparent group-data-[variant=browser]/tabs-list:data-active:shadow-none dark:group-data-[variant=browser]/tabs-list:shadow-[inset_0_-3px_6px_rgba(0,0,0,0.2)]",
        "data-active:bg-cui-background data-active:text-cui-primary-900 dark:group-data-[variant=default]/tabs-list:data-active:border-cui-input dark:group-data-[variant=default]/tabs-list:data-active:bg-cui-input/30 dark:group-data-[variant=default]/tabs-list:data-active:text-cui-primary-400 dark:group-data-[variant=line]/tabs-list:data-active:text-cui-primary-400",
        "after:bg-cui-primary after:absolute after:opacity-0 after:transition-opacity group-data-[orientation=horizontal]/tabs:after:inset-x-0 group-data-[orientation=horizontal]/tabs:after:-bottom-1 group-data-[orientation=horizontal]/tabs:after:h-1 group-data-[orientation=horizontal]/tabs:after:rounded-t group-data-[orientation=vertical]/tabs:after:inset-y-0 group-data-[orientation=vertical]/tabs:after:-right-1 group-data-[orientation=vertical]/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn(
        "group-has-[[data-variant=browser]]/tabs:bg-cui-background flex-1 text-sm outline-none group-has-[[data-variant=browser]]/tabs:rounded-tr-none group-has-[[data-variant=browser]]/tabs:border-t-transparent",
        className,
      )}
      {...props}
    />
  );
}

export { Tabs, TabsContent, TabsList, tabsListVariants, TabsTrigger };
