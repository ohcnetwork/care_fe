import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";

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
import { useEffect } from "react";

interface NavTabDefinition {
  label: string;
  component: React.ReactNode;
  shortcutId?: string;
  labelSuffix?: React.ReactNode;
  visible?: boolean;
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
  alwaysShowShortcut?: boolean;
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
  alwaysShowShortcut = false,
  ...props
}: Props<TabKey> & React.ComponentProps<typeof Tabs>) => {
  const { t } = useTranslation();

  const allTabKeys = keysOf(tabs).filter((key) => tabs[key].visible !== false);
  const { visibleTabs, showMoreTabs } = getTabsToShowAndShowMore(
    allTabKeys,
    currentTab,
    showMoreAfterIndex,
  );

  useEffect(() => {
    // escape from currentTab if it's visible is false
    if (currentTab && tabs[currentTab].visible === false) {
      onTabChange(allTabKeys[0]);
    }
  }, [currentTab, allTabKeys, tabs, onTabChange]);

  return (
    <Tabs
      {...props}
      value={currentTab ?? allTabKeys[0]}
      onValueChange={(tab) => onTabChange(tab as TabKey)}
    >
      <div className="min-w-0 max-w-full overflow-x-auto pb-1">
        <TabsList variant="line" className="w-full justify-start">
          {visibleTabs.map((option, index) => (
            <TabsTrigger
              key={option}
              value={option}
              className={tabTriggerClassName}
              onClick={() => onTabChange(option)}
            >
              {tabs[option].label}
              {tabs[option].labelSuffix}
              {tabs[option].shortcutId && !enableIndexShortcut && (
                <ShortcutBadge
                  actionId={tabs[option].shortcutId}
                  alwaysShow={alwaysShowShortcut}
                ></ShortcutBadge>
              )}
              {enableIndexShortcut && (
                <ShortcutBadge
                  actionId={`tab-index-${index + 1}`}
                  alwaysShow={alwaysShowShortcut}
                ></ShortcutBadge>
              )}
            </TabsTrigger>
          ))}
          {showMoreTabs.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-full">
                  {t("count_more", { count: showMoreTabs.length })}
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {showMoreTabs.map((option) => (
                  <DropdownMenuItem
                    key={option}
                    onSelect={() => onTabChange(option)}
                  >
                    {tabs[option].label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </TabsList>
      </div>

      {entriesOf(tabs).map(
        ([key, tab]) =>
          tab.visible !== false && (
            <TabsContent key={key} value={key} className={tabContentClassName}>
              {setPageTitle && <PageTitle title={tab.label} />}
              {tab.component}
            </TabsContent>
          ),
      )}
    </Tabs>
  );
};
