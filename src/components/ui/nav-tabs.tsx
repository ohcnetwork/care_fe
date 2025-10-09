import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import PageTitle from "@/components/Common/PageHeadTitle";

import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import { entriesOf, keysOf } from "@/Utils/utils";

interface NavTabDefinition {
  label: string;
  component: React.ReactNode;
  shortcutId?: string;
}

interface Props<TabKey extends string> {
  tabs: Record<TabKey, NavTabDefinition>;
  currentTab?: TabKey;
  onTabChange: (tab: TabKey) => void;
  setPageTitle?: boolean;
  tabTriggerClassName?: string;
  showMoreAfterIndex?: number;
  tabContentClassName?: string;
  enableIndexShortcut?: boolean;
}

const getTabsToShowAndShowMore = <TabKey extends string>(
  allTabKeys: TabKey[],
  selectedTab?: TabKey,
  showMoreAfterIndex?: number,
) => {
  selectedTab ??= allTabKeys[0];

  if (showMoreAfterIndex == null || allTabKeys.length <= showMoreAfterIndex) {
    return { visibleTabs: allTabKeys, showMoreTabs: [] };
  }

  const visibleTabs = allTabKeys.slice(0, showMoreAfterIndex);
  const showMoreTabs = allTabKeys.slice(showMoreAfterIndex);

  if (visibleTabs.includes(selectedTab)) {
    return { visibleTabs, showMoreTabs };
  }

  return {
    visibleTabs: [...visibleTabs.slice(0, -1), selectedTab],
    showMoreTabs: [
      visibleTabs[visibleTabs.length - 1],
      ...showMoreTabs.filter((tab) => tab !== selectedTab),
    ],
  };
};

export const NavTabs = <TabKey extends string>({
  tabs,
  currentTab,
  onTabChange,
  tabContentClassName,
  setPageTitle = true,
  tabTriggerClassName,
  showMoreAfterIndex,
  enableIndexShortcut = false,
  ...props
}: Props<TabKey> & React.ComponentProps<typeof Tabs>) => {
  const { t } = useTranslation();

  const allTabKeys = keysOf(tabs);
  const { visibleTabs, showMoreTabs } = getTabsToShowAndShowMore(
    allTabKeys,
    currentTab,
    showMoreAfterIndex,
  );

  return (
    <Tabs
      {...props}
      value={currentTab ?? allTabKeys[0]}
      onValueChange={(tab) => onTabChange(tab as TabKey)}
    >
      <TabsList className="w-full justify-evenly sm:justify-start border-b rounded-none bg-transparent p-0 h-auto overflow-x-auto">
        {visibleTabs.map((option, index) => (
          <TabsTrigger
            key={option}
            value={option}
            className={cn(
              "border-b-3 px-1.5 sm:px-2.5 py-2 text-gray-600 font-semibold hover:text-gray-900 data-[state=active]:border-b-primary-700 data-[state=active]:text-primary-800 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none",
              tabTriggerClassName,
            )}
            onClick={() => onTabChange(option)}
          >
            {tabs[option].label}
            {tabs[option].shortcutId && (
              <ShortcutBadge actionId={tabs[option].shortcutId}></ShortcutBadge>
            )}
            {enableIndexShortcut && (
              <ShortcutBadge
                actionId={`tab-index-${index + 1}`}
              ></ShortcutBadge>
            )}
          </TabsTrigger>
        ))}
        {showMoreTabs.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="text-gray-500 font-semibold hover:text-gray-900 hover:bg-transparent pb-2.5 px-2.5 rounded-none"
              >
                {t("count_more", { count: showMoreTabs.length })}
                <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {showMoreTabs.map((option) => (
                <DropdownMenuItem
                  key={option}
                  onClick={() => onTabChange(option)}
                  className="text-gray-950 font-medium text-sm"
                >
                  {tabs[option].label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </TabsList>
      {entriesOf(tabs).map(([key, tab]) => (
        <TabsContent key={key} value={key} className={tabContentClassName}>
          {setPageTitle && <PageTitle title={tab.label} />}
          {tab.component}
        </TabsContent>
      ))}
    </Tabs>
  );
};
