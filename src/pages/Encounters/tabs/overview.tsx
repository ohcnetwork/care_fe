import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";

import { ScrollArea } from "@/components/ui/scroll-area";

import { ObservationPlotConfig } from "@/components/Common/Charts/ObservationChart";
import QuestionnaireResponsesList from "@/components/Facility/ConsultationDetails/QuestionnaireResponsesList";
import { AllergyList } from "@/components/Patient/allergy/list";
import { DiagnosisList } from "@/components/Patient/diagnosis/list";
import { SymptomsList } from "@/components/Patient/symptoms/list";
import { VitalsList } from "@/components/Patient/vitals/list";

import { ClinicalHistoryOverview } from "@/pages/Encounters/tabs/overview/clinical-history-overview";
import { QuickActions } from "@/pages/Encounters/tabs/overview/quick-actions";
import { SummaryPanel } from "@/pages/Encounters/tabs/overview/summary-panel";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import EncounterOverviewDevices from "@/pages/Facility/settings/devices/components/EncounterOverviewDevices";

export const EncounterOverviewTab = () => {
  const {
    selectedEncounter: encounter,
    patientId,
    selectedEncounterId: encounterId,
    canAccessSelectedEncounter: canAccess,
    canWriteSelectedEncounter: canWrite,
  } = useEncounter();

  const { data: plotsConfig } = useQuery<ObservationPlotConfig>({
    queryKey: ["plots-config"],
    queryFn: () => fetch(careConfig.plotsConfigUrl).then((res) => res.json()),
  });

  const vitalGroups =
    plotsConfig?.find((plot) => plot.id === "primary-parameters")?.groups || [];

  return (
    <div className="flex gap-3">
      <ScrollArea className="flex-1 h-[calc(100vh-12rem)] pr-3">
        <div className="flex flex-col gap-6">
          <QuickActions />
          <ClinicalHistoryOverview />
          <SummaryPanel />

          <div className="flex flex-col gap-8 overflow-x-auto">
            {/* Show preview of devices associated with the encounter */}
            {encounter && <EncounterOverviewDevices encounter={encounter} />}
            {/* Clinical informations */}
            <AllergyList
              patientId={patientId}
              encounterId={encounterId}
              readOnly={!canWrite}
              encounterStatus={encounter?.status}
            />
            <SymptomsList
              patientId={patientId}
              encounterId={encounterId}
              readOnly={!canWrite}
            />
            <DiagnosisList
              patientId={patientId}
              encounterId={encounterId}
              readOnly={!canWrite}
            />
            <VitalsList
              patientId={patientId}
              encounterId={encounterId}
              codeGroups={vitalGroups}
            />
            <QuestionnaireResponsesList
              encounter={encounter}
              patientId={patientId}
              canAccess={canAccess}
            />
          </div>
        </div>
      </ScrollArea>

      <ScrollArea className="w-72 h-[calc(100vh-12rem)]">
        <SummaryPanel />
      </ScrollArea>
    </div>
  );
};
