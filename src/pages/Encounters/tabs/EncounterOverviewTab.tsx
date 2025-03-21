import { useEffect } from "react";
import { toast } from "sonner";

import SideOverview from "@/components/Facility/ConsultationDetails/OverviewSideBar";
import QuestionnaireResponsesList from "@/components/Facility/ConsultationDetails/QuestionnaireResponsesList";
import { AllergyList } from "@/components/Patient/allergy/list";
import { DiagnosisList } from "@/components/Patient/diagnosis/list";
import { SymptomsList } from "@/components/Patient/symptoms/list";

import useAppHistory from "@/hooks/useAppHistory";

import { getPermissions } from "@/common/Permissions";

import { usePermissions } from "@/context/PermissionContext";
import { EncounterTabProps } from "@/pages/Encounters/EncounterShow";
import EncounterOverviewDevices from "@/pages/Facility/settings/devices/components/EncounterOverviewDevices";
import { inactiveEncounterStatus } from "@/types/emr/encounter";

export const EncounterOverviewTab = ({
  encounter,
  patient,
}: EncounterTabProps) => {
  const { hasPermission } = usePermissions();
  const {
    canViewClinicalData,
    canViewEncounter,
    canSubmitEncounterQuestionnaire,
  } = getPermissions(hasPermission, encounter.permissions);
  const canAccess = canViewEncounter || canViewClinicalData;
  const canEdit =
    canSubmitEncounterQuestionnaire &&
    !inactiveEncounterStatus.includes(encounter.status ?? "");
  const { goBack } = useAppHistory();

  useEffect(() => {
    if (!canAccess) {
      toast.error("You do not have permission to view this encounter");
      goBack();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAccess]);

  return (
    <div className="flex flex-col gap-4">
      {/* Main Content Area */}
      <div className="flex flex-col-reverse xl:flex-row gap-4">
        {/* Left Column - Symptoms, Diagnoses, and Questionnaire Responses */}
        <div className="flex-1 space-y-4" data-cy="encounter-overview">
          {/* Associated Devices Section */}
          <EncounterOverviewDevices encounter={encounter} />

          {/* Allergies Section */}
          <div>
            <AllergyList
              patientId={patient.id}
              encounterId={encounter.id}
              readOnly={!canEdit}
              encounterStatus={encounter.status}
            />
          </div>

          {/* Symptoms Section */}
          <div>
            <SymptomsList
              patientId={patient.id}
              encounterId={encounter.id}
              readOnly={!canEdit}
            />
          </div>

          {/* Diagnoses Section */}
          <div>
            <DiagnosisList
              patientId={patient.id}
              encounterId={encounter.id}
              readOnly={!canEdit}
            />
          </div>

          {/* Questionnaire Responses Section */}
          <div>
            <QuestionnaireResponsesList
              encounter={encounter}
              patientId={patient.id}
              canAccess={canAccess}
            />
          </div>
        </div>

        {/* Right Column - Observations */}
        <div className="xl:w-1/4 p-1 bg-white rounded-md shadow-md h-full">
          <SideOverview
            encounter={encounter}
            canAccess={canAccess}
            canEdit={canEdit}
          />
        </div>
      </div>
    </div>
  );
};
