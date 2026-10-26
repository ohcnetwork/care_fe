import { useState } from "react";

import { NavTabs } from "@/components/ui/nav-tabs";
import { ScopedQueryParamsProvider } from "@/hooks/useScopedQueryParams";
import {
  useClinicalHistoryTabs,
  type ClinicalHistoryAccess,
  type ClinicalHistoryTabKey,
} from "@/pages/Patient/History/clinicalHistoryTabs";

const HISTORY_WIDGET_SECTIONS: Record<string, ClinicalHistoryTabKey> = {
  history_responses: "responses",
  history_diagnostic_reports: "diagnostic_reports",
  history_symptoms: "symptoms",
  history_diagnoses: "diagnoses",
  history_allergies: "allergies",
  history_medications: "medications",
};

export function ClinicalHistoryWidget({
  type,
  patientId,
  facilityId,
  access,
  tabs: visibleTabs,
  defaultTab,
}: {
  type: string;
  patientId: string;
  facilityId?: string;
  /** Separate grants for response history and clinical history. */
  access: ClinicalHistoryAccess;
  /** Subset of history tabs to offer; a single tab renders without the tab bar. */
  tabs?: readonly ClinicalHistoryTabKey[];
  defaultTab?: ClinicalHistoryTabKey;
}) {
  const tabs = useClinicalHistoryTabs({
    patientId,
    facilityId,
    embedded: true,
    access,
  });
  const requested = visibleTabs && new Set<string>(visibleTabs);
  const entries = Object.entries(tabs).filter(
    ([key, definition]) =>
      key !== "immunizations" &&
      definition.visible &&
      (!requested || requested.has(key)),
  );
  const initialTab =
    defaultTab && entries.some(([key]) => key === defaultTab)
      ? defaultTab
      : (entries[0]?.[0] ?? "responses");
  const [tab, setTab] = useState<string>(initialTab);
  const section = HISTORY_WIDGET_SECTIONS[type];
  if (section) return tabs[section].visible ? tabs[section].component : null;
  if (!entries.length) return null;
  if (entries.length === 1) return entries[0][1].component;

  return (
    <NavTabs
      tabs={Object.fromEntries(
        entries.map(([key, definition]) => [
          key,
          {
            ...definition,
            component: (
              <ScopedQueryParamsProvider key={key}>
                {definition.component}
              </ScopedQueryParamsProvider>
            ),
          },
        ]),
      )}
      currentTab={entries.some(([key]) => key === tab) ? tab : initialTab}
      onTabChange={setTab}
      setPageTitle={false}
      showMoreAfterIndex={3}
    />
  );
}
