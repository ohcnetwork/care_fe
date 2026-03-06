import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import { ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";

import { EmptyState } from "@/components/ui/empty-state";
import { ScrollArea } from "@/components/ui/scroll-area";

import QuestionnaireResponsesList from "@/components/Facility/ConsultationDetails/QuestionnaireResponsesList";
import { AllergyList } from "@/components/Patient/allergy/list";
import { DiagnosisList } from "@/components/Patient/diagnosis/list";
import { SymptomsList } from "@/components/Patient/symptoms/list";
import { VitalsList } from "@/components/Patient/vitals/list";
import { ObservationPlotConfig } from "@/types/emr/observation/observation";

import { ClinicalHistoryOverview } from "@/pages/Encounters/tabs/overview/clinical-history-overview";
import { FavoriteFormsQuickActions } from "@/pages/Encounters/tabs/overview/FavoriteFormsQuickActions";
import { FormSubmissionDrafts } from "@/pages/Encounters/tabs/overview/FormSubmissionDrafts";
import { QuickActions } from "@/pages/Encounters/tabs/overview/quick-actions";
import { SummaryPanel } from "@/pages/Encounters/tabs/overview/summary-panel";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import EncounterOverviewDevices from "@/pages/Facility/settings/devices/components/EncounterOverviewDevices";
import { inactiveEncounterStatus } from "@/types/emr/encounter/encounter";

export const EncounterOverviewTab = () => {
  const { t } = useTranslation();
  const {
    selectedEncounter: encounter,
    patientId,
    selectedEncounterId: encounterId,
    canReadSelectedEncounter: canAccess,
    canWriteSelectedEncounter: canWrite,
    canReadClinicalData,
  } = useEncounter();

  const { data: plotsConfig } = useQuery<ObservationPlotConfig>({
    queryKey: ["plots-config"],
    queryFn: () => fetch(careConfig.plotsConfigUrl).then((res) => res.json()),
    enabled: canReadClinicalData,
  });

  const vitalGroups =
    plotsConfig?.find((plot) => plot.id === "primary-parameters")?.groups || [];

  return (
    <div className="flex gap-3 @max-md:w-full">
      {canReadClinicalData ? (
        <div className="flex-1 xl:pr-3 overflow-y-auto xl:h-[calc(100vh-14rem-var(--encounter-header-offset))]">
          <div className="flex flex-col gap-4">
            {canWrite && <QuickActions />}
            {canWrite && <FavoriteFormsQuickActions />}
            {<ClinicalHistoryOverview />}
            <div className="xl:hidden">
              <SummaryPanel />
            </div>

            {
              <div className="flex flex-col gap-8 overflow-x-auto">
                {/* Show preview of devices associated with the encounter */}
                {encounter && (
                  <EncounterOverviewDevices encounter={encounter} />
                )}
                {encounter &&
                  !inactiveEncounterStatus.includes(encounter.status) && (
                    <FormSubmissionDrafts
                      facilityId={encounter.facility.id}
                      patientId={patientId}
                      encounterId={encounterId}
                    />
                  )}
                {/* Clinical informations */}
                <AllergyList
                  patientId={patientId}
                  encounterId={encounterId}
                  readOnly={!canWrite}
                  encounterStatus={encounter?.status}
                  showViewEncounter={false}
                />
                <SymptomsList
                  patientId={patientId}
                  encounterId={encounterId}
                  readOnly={!canWrite}
                  showViewEncounter={false}
                />
                <DiagnosisList
                  patientId={patientId}
                  encounterId={encounterId}
                  readOnly={!canWrite}
                  showViewEncounter={false}
                />
                <VitalsList
                  patientId={patientId}
                  encounterId={encounterId}
                  codeGroups={vitalGroups}
                />
                <QuestionnaireResponsesList
                  encounterId={encounterId}
                  patientId={patientId}
                  canAccess={canAccess}
                />
              </div>
            }
          </div>
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

      <ScrollArea className="w-72 hidden xl:block h-[calc(100vh-14rem-var(--encounter-header-offset))]">
        <SummaryPanel />
      </ScrollArea>
    </div>
  );
};
