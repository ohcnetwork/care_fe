import { type LucideIcon } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import PageTitle from "@/components/Common/PageHeadTitle";

import useBreakpoints from "@/hooks/useBreakpoints";
import EncounterHistorySelector from "@/pages/Encounters/EncounterHistorySelector";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";

export interface EncounterTab {
  label: string;
  icon: LucideIcon;
  component: React.ReactNode;
  hideTitle?: boolean;
  shortcutId?: string;
  visible?: boolean;
}

interface Props {
  tabs: Record<string, EncounterTab>;
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export default function EncounterNavigation({
  tabs,
  currentTab,
  onTabChange,
}: Props) {
  const { t } = useTranslation();
  const orientation = useBreakpoints<"horizontal" | "vertical">({
    default: "horizontal",
    lg: "vertical",
  });
  const visibleTabs = Object.entries(tabs).filter(
    ([, tab]) => tab.visible !== false,
  );

  useEffect(() => {
    if (tabs[currentTab]?.visible === false && visibleTabs.length) {
      onTabChange(visibleTabs[0][0]);
    }
  }, [currentTab, tabs, visibleTabs, onTabChange]);

  return (
    <Tabs
      value={currentTab}
      onValueChange={onTabChange}
      orientation={orientation}
      className="min-w-0 gap-4 lg:flex-row"
    >
      <div className="min-w-0 shrink-0 space-y-4 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:w-61 lg:self-start lg:overflow-y-auto">
        <EncounterHistorySelector />
        <TabsList
          aria-label={t("encounter_navigation")}
          className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-none bg-transparent p-0 lg:flex-col lg:items-stretch lg:overflow-x-hidden"
        >
          {visibleTabs.map(([key, { label, icon: Icon, shortcutId }]) => (
            <TabsTrigger
              key={key}
              value={key}
              onClick={() => onTabChange(key)}
              className="group h-auto min-h-11 shrink-0 justify-start gap-3 rounded-[10px] border border-transparent px-3 py-2.5 text-[15px] font-medium text-gray-700 hover:bg-gray-200/40 hover:text-gray-950 data-[state=active]:border-gray-200 data-[state=active]:bg-gray-200/70 data-[state=active]:font-semibold data-[state=active]:text-gray-950 data-[state=active]:shadow-none lg:w-full"
            >
              <Icon
                aria-hidden="true"
                className="size-4 text-gray-500 group-data-[state=active]:text-gray-950"
                strokeWidth={1.75}
              />
              {label}
              {shortcutId && (
                <ShortcutBadge
                  actionId={shortcutId}
                  className="ml-auto"
                  alwaysShow={false}
                />
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {visibleTabs.map(([key, tab]) => (
        <TabsContent key={key} value={key} className="@container min-w-0">
          <PageTitle title={tab.label} />
          {!tab.hideTitle && (
            <h1 className="mb-4 text-xl font-bold tracking-tight text-gray-950 sm:text-2xl">
              {tab.label}
            </h1>
          )}
          {tab.component}
        </TabsContent>
      ))}
    </Tabs>
  );
}
