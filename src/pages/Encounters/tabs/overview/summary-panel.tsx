import { useEffect, useState } from "react";

import { FilterTabs } from "@/components/ui/filter-tabs";
import { SummaryPanelActionsTab } from "@/pages/Encounters/tabs/overview/summary-panel-actions.tab";
import { SummaryPanelReportsTab } from "@/pages/Encounters/tabs/overview/summary-panel-reports-tab";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import { SummaryPanelDetailTab } from "./summary-panel-details-tab";

export const SummaryPanel = () => {
  const { canWriteSelectedEncounter } = useEncounter();
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    if (!canWriteSelectedEncounter) {
      setActiveTab("details");
    }
  }, [canWriteSelectedEncounter]);

  const tabOptions = [
    { value: "details", label: "details" },
    ...(canWriteSelectedEncounter
      ? [{ value: "actions", label: "actions" }]
      : []),
    { value: "reports", label: "reports" },
  ];

  return (
    <div className="@container">
      <FilterTabs
        value={activeTab}
        onValueChange={setActiveTab}
        options={tabOptions}
        variant="background"
        className="@xs:bg-gray-100 @xs:border border-gray-200 p-1 xl:p-0 @xs:rounded-lg w-full sm:w-72"
        showAllOption={false}
        maxVisibleTabs={3}
      />

      <div className="mt-2">
        {activeTab === "details" && <SummaryPanelDetailTab />}
        {activeTab === "actions" && canWriteSelectedEncounter && (
          <SummaryPanelActionsTab />
        )}
        {activeTab === "reports" && <SummaryPanelReportsTab />}
      </div>
    </div>
  );
};
