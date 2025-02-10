import { useEffect } from "react";
import { toast } from "sonner";

import SideOverview from "@/components/Facility/ConsultationDetails/OverviewSideBar";
import QuestionnaireResponsesList from "@/components/Facility/ConsultationDetails/QuestionnaireResponsesList";
import { AllergyList } from "@/components/Patient/allergy/list";
import { DiagnosisList } from "@/components/Patient/diagnosis/list";
import { SymptomsList } from "@/components/Patient/symptoms/list";

import useAppHistory from "@/hooks/useAppHistory";
import useAuthUser from "@/hooks/useAuthUser";

import { getPermissions } from "@/common/Permissions";

import { usePermissions } from "@/context/PermissionContext";
import { EncounterTabProps } from "@/pages/Encounters/EncounterShow";

export const EncounterUpdatesTab = ({
  facilityId,
  encounter,
  patient,
}: EncounterTabProps) => {
  const authUser = useAuthUser();
  const { hasPermission } = usePermissions();
  const { canViewClinicalData, canViewEncounter } = getPermissions(
    hasPermission,
    authUser.permissions,
  );
  const { goBack } = useAppHistory();
  const canAccess = canViewClinicalData || canViewEncounter;

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
      <div className="flex flex-col xl:flex-row gap-4">
        {/* Left Column - Symptoms, Diagnoses, and Questionnaire Responses */}
        <div className="flex-1 space-y-4" data-cy="encounter-overview">
          {/* Allergies Section */}
          <div>
            <AllergyList
              facilityId={facilityId}
              patientId={patient.id}
              encounterId={encounter.id}
              encounterStatus={encounter.status}
            />
          </div>

          {/* Symptoms Section */}
          <div>
            <SymptomsList
              patientId={patient.id}
              encounterId={encounter.id}
              facilityId={facilityId}
            />
          </div>

          {/* Diagnoses Section */}
          <div>
            <DiagnosisList
              patientId={patient.id}
              encounterId={encounter.id}
              facilityId={facilityId}
            />
          </div>

          {/* Questionnaire Responses Section */}
          <div>
            <QuestionnaireResponsesList
              encounter={encounter}
              patientId={patient.id}
            />
          </div>
        </div>

        {/* Right Column - Observations */}
        <div className="xl:w-1/3 p-1 bg-white rounded-md shadow-md h-full">
          <SideOverview encounter={encounter} canAccess={canAccess} />
        </div>
      </div>
    </div>
  );
};
