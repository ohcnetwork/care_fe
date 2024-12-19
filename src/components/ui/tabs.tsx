import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as React from "react";

import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-9 items-center justify-center rounded-lg bg-gray-100 p-1 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-gray-950 data-[state=active]:shadow dark:ring-offset-gray-950 dark:focus-visible:ring-gray-300 dark:data-[state=active]:bg-gray-950 dark:data-[state=active]:text-gray-50",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 dark:ring-offset-gray-950 dark:focus-visible:ring-gray-300",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

interface SectionTabsProps {
  activeTab: string;
  onChange: (newTab: string) => void;
  tabs: { label: string; value: string }[];
}

const SectionTabs = (props: SectionTabsProps) => (
  <Tabs value={props.activeTab} onValueChange={props.onChange} className="mt-3">
    <TabsList className="mb-4 bg-transparent p-0 border-b border-b-gray-200 w-full justify-start gap-4 ">
      {props.tabs.map(({ label, value }) => (
        <TabsTrigger
          key={value}
          className="bg-transparent px-1 py-1 data-[state=active]:bg-transparent translate-y-0.5 border-b-2 text-base font-semibold text-gray-500 border-b-transparent transition-all rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-primary-500 data-[state=active]:text-primary-500"
          value={value}
        >
          {label}
        </TabsTrigger>
      ))}
    </TabsList>
  </Tabs>
);

const TabbedSections = (props: {
  tabs: { label: string; value: string; section: React.ReactNode }[];
}) => {
  const [activeTab, setActiveTab] = React.useState(props.tabs[0].value);

  return (
    <>
      <SectionTabs
        tabs={props.tabs}
        activeTab={activeTab}
        onChange={(t) => setActiveTab(t)}
      />
      <div>{props.tabs.find(({ value }) => activeTab === value)?.section}</div>
    </>
  );
};

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  SectionTabs,
  TabbedSections,
};
