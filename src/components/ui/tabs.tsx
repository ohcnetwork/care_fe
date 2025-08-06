import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as React from "react";

import { cn } from "@/lib/utils";

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "bg-gray-100 text-gray-500 inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px] dark:bg-gray-800 dark:text-gray-400",
        className,
      )}
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
        "data-[state=active]:bg-white dark:data-[state=active]:text-gray-950 focus-visible:border-gray-950 focus-visible:ring-gray-950/50 focus-visible:outline-ring dark:data-[state=active]:border-gray-200 dark:data-[state=active]:bg-gray-200/30 text-gray-950 dark:text-gray-500 inline-flex h-[calc(100%-1px)] items-center justify-center gap-1.5 rounded-md border border-gray-200 border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 dark:data-[state=active]:bg-gray-950 dark:dark:data-[state=active]:text-gray-50 dark:focus-visible:border-gray-300 dark:focus-visible:ring-gray-300/50 dark:dark:data-[state=active]:border-gray-800 dark:dark:data-[state=active]:bg-gray-800/30 dark:text-gray-50 dark:dark:text-gray-400 dark:border-gray-800",
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
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger };
