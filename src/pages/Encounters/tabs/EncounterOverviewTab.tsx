import SideOverview from "@/components/Facility/ConsultationDetails/OverviewSideBar";
import QuestionnaireResponsesList from "@/components/Facility/ConsultationDetails/QuestionnaireResponsesList";
import { AllergyList } from "@/components/Patient/allergy/list";
import { DiagnosisList } from "@/components/Patient/diagnosis/list";
import { SymptomsList } from "@/components/Patient/symptoms/list";

import { EncounterTabProps } from "@/pages/Encounters/EncounterShow";
import EncounterOverviewDevices from "@/pages/Facility/settings/devices/components/EncounterOverviewDevices";

export const EncounterOverviewTab = ({
  encounter,
  patient,
}: EncounterTabProps) => {
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
              encounterStatus={encounter.status}
            />
          </div>

          {/* Symptoms Section */}
          <div>
            <SymptomsList patientId={patient.id} encounterId={encounter.id} />
          </div>

          {/* Diagnoses Section */}
          <div>
            <DiagnosisList patientId={patient.id} encounterId={encounter.id} />
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
        <div className="xl:w-1/4 p-1 bg-white rounded-md shadow-md h-full">
          <SideOverview encounter={encounter} />
        </div>
      </div>
    </div>
  );
};
