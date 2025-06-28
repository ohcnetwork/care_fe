import { t } from "i18next";

import { MedicationStatementList } from "@/components/Patient/MedicationStatementList";
import { AllergyList } from "@/components/Patient/allergy/list";
import { DiagnosisList } from "@/components/Patient/diagnosis/list";
import { SymptomsList } from "@/components/Patient/symptoms/list";

import { PatientProps } from ".";

export const HealthProfileSummary = (props: PatientProps) => {
  const { patientId } = props;

  return (
    <div className="mt-4 px-4 md:px-0" data-test-id="patient-health-profile">
      <div className="group my-2 w-full">
        <div className="h-full space-y-2">
          <div className="flex flex-row items-center justify-between">
            <div className="mr-4 text-xl font-bold text-secondary-900">
              {t("health_profile")}
            </div>
          </div>

          <div className="mt-2 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2 md:gap-y-8">
            <div className="md:col-span-2">
              <MedicationStatementList patientId={patientId} />
            </div>

            <div className="md:col-span-2">
              <AllergyList patientId={patientId} readOnly={true} />
            </div>

            <div className="md:col-span-2">
              <SymptomsList patientId={patientId} readOnly={true} />
            </div>

            <div className="md:col-span-2">
              <DiagnosisList patientId={patientId} readOnly={true} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
