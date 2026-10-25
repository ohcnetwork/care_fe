import { ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";

import { PLUGIN_Component } from "@/PluginEngine";

import { EmptyState } from "@/components/ui/empty-state";

import { ClinicalHistoryOverview } from "@/pages/Encounters/tabs/overview/clinical-history-overview";
import { SummaryPanel } from "@/pages/Encounters/tabs/overview/summary-panel";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import { EncounterWidget } from "@/pages/Encounters/widgets/EncounterWidget";
import EncounterOverviewDevices from "@/pages/Facility/settings/devices/components/EncounterOverviewDevices";

export const EncounterOverviewTab = () => {
  const { t } = useTranslation();
  const {
    selectedEncounter: encounter,
    patientId,
    selectedEncounterId: encounterId,
    canReadClinicalData,
  } = useEncounter();

  return (
    <div className="flex items-start gap-3 @max-md:w-full">
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex min-h-10 flex-wrap items-center justify-between gap-2">
          <h1 className="text-lg font-semibold tracking-tight text-gray-950">
            {t("ENCOUNTER_TAB__updates")}
          </h1>
          {canReadClinicalData && <ClinicalHistoryOverview />}
        </div>
        {canReadClinicalData ? (
          <div className="flex flex-col gap-3">
            <EncounterWidget type="quick_actions" />
            <EncounterWidget type="favorite_forms" />
            {encounter && (
              <PLUGIN_Component
                __name="EncounterOverviewTop"
                encounter={encounter}
                patientId={patientId}
                encounterId={encounterId}
              />
            )}

            <div className="xl:hidden">
              <SummaryPanel />
            </div>

            {
              <div className="flex flex-col gap-3 overflow-x-auto">
                {/* Show preview of devices associated with the encounter */}
                {encounter && (
                  <EncounterOverviewDevices encounter={encounter} />
                )}
                <EncounterWidget type="draft_forms" />
                {/* Clinical informations */}
                <EncounterWidget type="allergies" />
                <EncounterWidget type="symptoms" />
                <EncounterWidget type="diagnosis" />
                <EncounterWidget type="vitals" />
                <EncounterWidget type="questionnaire_responses" showEmpty />
              </div>
            }
          </div>
        ) : (
          <div className="flex-1 xl:pr-3 flex items-center justify-center">
            <EmptyState
              icon={<ShieldAlert className="text-gray-400 size-8" />}
              title={t("no_permission_to_view_clinical_data")}
              description={t("no_permission_to_view_clinical_data_description")}
              className="h-full w-full bg-transparent"
            />
          </div>
        )}
      </div>

      <aside className="hidden w-72 shrink-0 xl:block">
        <SummaryPanel />
      </aside>
    </div>
  );
};
