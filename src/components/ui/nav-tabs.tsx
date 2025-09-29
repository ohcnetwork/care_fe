import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import PageTitle from "@/components/Common/PageHeadTitle";
import { FilterTabs } from "@/components/ui/filter-tabs"; // <-- Add this import

import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import { entriesOf, keysOf } from "@/Utils/utils";

interface NavTabDefinition {
  label: string;
  component: React.ReactNode;
  icon?: React.ReactNode; // Optional: support icons in tabs
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
  showMoreAfterIndex,
}: Props<TabKey>) => {
  const { t } = useTranslation();

  const allTabKeys = keysOf(tabs);
  const { visibleTabs, showMoreTabs } = getTabsToShowAndShowMore(
    allTabKeys,
    currentTab,
    showMoreAfterIndex,
  );

  // Prepare options for FilterTabs, supporting icons if present
  const filterTabOptions = visibleTabs.map((key) => ({
    value: key,
    label: tabs[key].label,
    icon: tabs[key].icon,
  }));

  return (
    <>
      <div className="w-full">
        <FilterTabs
          value={currentTab ?? allTabKeys[0]}
          onValueChange={(tab) => onTabChange(tab as TabKey)}
          options={filterTabOptions}
          variant="underline"
          className="w-full"
          showAllOption={false}
          maxVisibleTabs={showMoreAfterIndex ?? visibleTabs.length}
        />
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
                  {tabs[option].icon && (
                    <span className="mr-2">{tabs[option].icon}</span>
                  )}
                  {t(tabs[option].label)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      {entriesOf(tabs).map(([key, tab]) => (
        <div
          key={key}
          hidden={key !== (currentTab ?? allTabKeys[0])}
          className={tabContentClassName}
        >
          {setPageTitle && <PageTitle title={tab.label} />}
          {tab.component}
        </div>
      ))}
    </>
  );
};
