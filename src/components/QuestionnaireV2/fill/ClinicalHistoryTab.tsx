import { useState } from "react";

import { NavTabs } from "@/components/ui/nav-tabs";

import useBreakpoints from "@/hooks/useBreakpoints";

import type { ClinicalHistoryTabKey } from "@/pages/Patient/History/clinicalHistoryTabs";
import { useClinicalHistoryTabs } from "@/pages/Patient/History/clinicalHistoryTabs";

/**
 * Tab 2 of the fill page: the patient's clinical history, embedded. Same
 * tab map as the standalone ClinicalHistoryPage (one shared source),
 * driven by local state instead of the URL so switching sections never
 * navigates away from the half-filled questionnaire.
 */
export function ClinicalHistoryTab({
  patientId,
  facilityId,
}: {
  patientId: string;
  facilityId?: string;
}) {
  const [tab, setTab] = useState<ClinicalHistoryTabKey>("responses");
  const tabs = useClinicalHistoryTabs({ patientId, facilityId });
  const showMoreAfterIndex = useBreakpoints({
    default: 1,
    xs: 2,
    sm: 6,
    xl: 9,
    "2xl": 12,
  });

  return (
    <NavTabs
      className="w-full"
      tabContentClassName="mt-6"
      tabs={tabs}
      currentTab={tab}
      onTabChange={setTab}
      setPageTitle={false}
      showMoreAfterIndex={showMoreAfterIndex}
    />
  );
}
