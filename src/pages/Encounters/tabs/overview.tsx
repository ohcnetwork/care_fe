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
    canReadSelectedEncounter: canAccess,
    canWriteSelectedEncounter: canWrite,
  } = useEncounter();

  const { data: plotsConfig } = useQuery<ObservationPlotConfig>({
    queryKey: ["plots-config"],
    queryFn: () => fetch(careConfig.plotsConfigUrl).then((res) => res.json()),
  });

  const vitalGroups =
    plotsConfig?.find((plot) => plot.id === "primary-parameters")?.groups || [];

  return (
    <div className="flex gap-3 @max-md:w-full">
      <div className="flex-1 xl:h-[calc(100vh-12rem)] xl:pr-3 overflow-y-auto">
        <div className="flex flex-col gap-6">
          {canWrite && <QuickActions />}
          <ClinicalHistoryOverview />
          <div className="xl:hidden">
            <SummaryPanel />
          </div>

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
      </div>

      <ScrollArea className="w-72 h-[calc(100vh-12rem)] hidden xl:block">
        <SummaryPanel />
      </ScrollArea>
    </div>
  );
};
