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
  const { canWriteSelectedEncounter } = useEncounter();
  // Location, department, and care-team updates are encounter management, so
  // the actions tab follows encounter write access rather than clinical access.
  const visibleTabs = SUMMARY_PANEL_TABS.filter(
    (tab) =>
      tabs.includes(tab) && (tab !== "actions" || canWriteSelectedEncounter),
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
          <TabsList className={cn("w-full", !embedded && "sm:w-72")}>
            {visibleTabs.map((tab) => (
              <TabsTrigger key={tab} value={tab}>
                {t(tab)}
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
