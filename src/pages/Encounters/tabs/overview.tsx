import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";

import { ScrollArea } from "@/components/ui/scroll-area";

import { ObservationPlotConfig } from "@/components/Common/Charts/ObservationChart";
import { CardListSkeleton } from "@/components/Common/SkeletonLoading";
import SideOverview from "@/components/Facility/ConsultationDetails/OverviewSideBar";
import QuestionnaireResponsesList from "@/components/Facility/ConsultationDetails/QuestionnaireResponsesList";
import { AllergyList } from "@/components/Patient/allergy/list";
import { DiagnosisList } from "@/components/Patient/diagnosis/list";
import { SymptomsList } from "@/components/Patient/symptoms/list";
import { VitalsList } from "@/components/Patient/vitals/list";

import EncounterDetailsTab from "@/pages/Encounters/EncounterDetailsTab";
import { ClinicalHistoryOverview } from "@/pages/Encounters/tabs/overview/clinical-history-overview";
import { QuickActions } from "@/pages/Encounters/tabs/overview/quick-actions";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import EncounterOverviewDevices from "@/pages/Facility/settings/devices/components/EncounterOverviewDevices";

export const EncounterOverviewTab = () => {
  const {
    selectedEncounter: encounter,
    patientId,
    selectedEncounterId: encounterId,
    canAccessSelectedEncounter: canAccess,
    canEditSelectedEncounter: canEdit,
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

          {/* Main Content Area */}
          <div className="flex flex-col xl:flex-row gap-4">
            {/* Left Column - Symptoms, Diagnoses, and Questionnaire Responses */}
            <div className="flex-1 space-y-4">
              {encounter ? (
                <EncounterDetailsTab encounter={encounter} canEdit={canEdit} />
              ) : (
                <div className="flex-1 space-y-4 max-w-[18rem]">
                  <CardListSkeleton count={3} />
                </div>
              )}
              {/* Associated Devices Section */}
              {encounter && <EncounterOverviewDevices encounter={encounter} />}

              {/* Allergies Section */}
              <div>
                <AllergyList
                  patientId={patientId}
                  encounterId={encounterId}
                  readOnly={!canEdit}
                  encounterStatus={encounter?.status}
                />
              </div>
              {/* Symptoms Section */}
              <div>
                <SymptomsList
                  patientId={patientId}
                  encounterId={encounterId}
                  readOnly={!canEdit}
                />
              </div>
              {/* Diagnoses Section */}
              <div>
                <DiagnosisList
                  patientId={patientId}
                  encounterId={encounterId}
                  readOnly={!canEdit}
                />
              </div>

              {/* Vitals Section */}
              <div>
                <VitalsList
                  patientId={patientId}
                  encounterId={encounterId}
                  codeGroups={vitalGroups}
                />
              </div>

              {/* Questionnaire Responses Section */}
              <div>
                <QuestionnaireResponsesList
                  encounter={encounter}
                  patientId={patientId}
                  canAccess={canAccess}
                />
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>

      <ScrollArea className="w-72 h-[calc(100vh-12rem)]">
        {encounter ? (
          <SideOverview
            encounter={encounter}
            canAccess={canAccess}
            canEdit={canEdit}
          />
        ) : (
          <div className="space-y-4 w-72">
            <CardListSkeleton count={3} />
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

const SummaryPanel = () => {
  return <div></div>;
};
