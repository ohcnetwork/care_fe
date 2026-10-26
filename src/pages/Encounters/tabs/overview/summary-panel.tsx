import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import { SummaryPanelActionsTab } from "@/pages/Encounters/tabs/overview/summary-panel-actions.tab";
import { SummaryPanelReportsTab } from "@/pages/Encounters/tabs/overview/summary-panel-reports-tab";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import { SummaryPanelDetailTab } from "./summary-panel-details-tab";

export type SummaryPanelTab = "details" | "actions" | "reports";

const SUMMARY_PANEL_TABS: SummaryPanelTab[] = ["details", "actions", "reports"];

export const SummaryPanel = ({
  embedded = false,
  tabs = SUMMARY_PANEL_TABS,
  defaultTab,
}: {
  embedded?: boolean;
  /** Workspace layouts can show a subset; a single tab hides the tab bar. */
  tabs?: SummaryPanelTab[];
  defaultTab?: SummaryPanelTab;
} = {}) => {
  const { t } = useTranslation();
  const { canWriteClinicalData } = useEncounter();
  const visibleTabs = SUMMARY_PANEL_TABS.filter(
    (tab) => tabs.includes(tab) && (tab !== "actions" || canWriteClinicalData),
  );
  const fallbackTab = visibleTabs[0] ?? "details";
  const [selectedTab, setActiveTab] = useState<SummaryPanelTab>(
    defaultTab && visibleTabs.includes(defaultTab) ? defaultTab : fallbackTab,
  );
  // Losing write access removes the actions tab; fall back without an effect.
  const activeTab = visibleTabs.includes(selectedTab)
    ? selectedTab
    : fallbackTab;

  return (
    <div className="@container">
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as SummaryPanelTab)}
        className="gap-2"
      >
        {visibleTabs.length > 1 && (
          <TabsList
            className={cn(
              "h-10 w-full justify-between rounded-xl border border-gray-200 bg-white p-1",
              !embedded && "sm:w-72",
            )}
          >
            {visibleTabs.map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="w-full rounded-lg data-[state=active]:border-gray-200 data-[state=active]:bg-gray-100 data-[state=active]:shadow-none"
              >
                <span className="text-black">{t(tab)}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        )}

        {visibleTabs.includes("details") && (
          <TabsContent value="details">
            <SummaryPanelDetailTab />
          </TabsContent>
        )}

        {visibleTabs.includes("actions") && (
          <TabsContent value="actions">
            <SummaryPanelActionsTab embedded={embedded} />
          </TabsContent>
        )}

        {visibleTabs.includes("reports") && (
          <TabsContent value="reports">
            <SummaryPanelReportsTab activeTab={activeTab} embedded={embedded} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};
