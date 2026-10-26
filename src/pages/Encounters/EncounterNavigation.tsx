import { type LucideIcon } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import PageTitle from "@/components/Common/PageHeadTitle";

import EncounterHistorySelector from "@/pages/Encounters/EncounterHistorySelector";
import { EncounterSectionPicker } from "@/pages/Encounters/EncounterSectionPicker";
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
      orientation="vertical"
      className="min-w-0 flex-col gap-3 lg:flex-row"
    >
      <div className="min-w-0 shrink-0 space-y-2 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:w-56 lg:self-start lg:overflow-y-auto">
        <EncounterHistorySelector />
        <EncounterSectionPicker
          visibleTabs={visibleTabs}
          currentTab={currentTab}
          onTabChange={onTabChange}
        />
        <TabsList
          aria-label={t("encounter_navigation")}
          className="hidden h-auto w-full flex-col items-stretch justify-start gap-1 rounded-none bg-transparent p-0 lg:flex"
        >
          {visibleTabs.map(([key, { label, icon: Icon, shortcutId }]) => (
            <TabsTrigger
              key={key}
              value={key}
              className="group relative h-auto min-h-9 w-full flex-none justify-start gap-2 overflow-hidden rounded-[10px] border border-transparent px-3 py-1.5 text-left text-[15px] font-medium whitespace-normal text-muted-foreground hover:bg-muted hover:text-foreground data-active:border-border data-active:bg-muted data-active:font-semibold data-active:text-foreground data-active:shadow-none data-active:hover:bg-muted lg:after:pointer-events-none lg:after:absolute lg:after:inset-y-2 lg:after:right-0 lg:after:w-1 lg:after:rounded-l-full lg:after:bg-muted-foreground lg:after:opacity-0 lg:data-active:after:opacity-100"
            >
              <Icon
                aria-hidden="true"
                className="size-4 text-muted-foreground group-data-active:text-foreground"
                strokeWidth={1.75}
              />
              <span className="min-w-0 flex-1 break-words">{label}</span>
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
            <h1 className="mb-3 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {tab.label}
            </h1>
          )}
          {tab.component}
        </TabsContent>
      ))}
    </Tabs>
  );
}
