import { useTranslation } from "react-i18next";

import { DiagnosisList } from "@/components/Patient/diagnosis/list";
import { SymptomsList } from "@/components/Patient/symptoms/list";

import { PatientProps } from ".";
import { MedicationStatementList } from "../MedicationStatementList";
import { AllergyList } from "../allergy/list";

export const HealthProfileSummary = (props: PatientProps) => {
  const { patientData, id } = props;

  const { t } = useTranslation();

  let patientMedHis: JSX.Element[] = [];

  if (patientData?.medical_history?.length) {
    const medHis = patientData.medical_history;
    patientMedHis = medHis
      .filter((item) => item.disease !== "NO")
      .map((item, idx) => (
        <div className="sm:col-span-1" key={`med_his_${idx}`}>
          <div className="break-words text-sm font-semibold leading-5 text-zinc-400">
            {item.disease}
          </div>
          <div className="mt-1 whitespace-normal break-words text-sm font-medium leading-5">
            {item.details}
          </div>
        </div>
      ));
  }

  return (
    <div className="mt-4 px-4 md:px-0" data-test-id="patient-health-profile">
      <div className="group my-2 w-full">
        <div className="h-full space-y-2">
          <div className="flex flex-row items-center justify-between">
            <div className="mr-4 text-xl font-bold text-secondary-900">
              Health Profile
            </div>
          </div>

          <div className="mt-2 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2 md:gap-y-8">
            <div className="sm:col-span-1">
              <div className="text-sm font-semibold leading-5 text-zinc-400">
                {t("present_health")}
              </div>
              <div
                data-testid="patient-present-health"
                className="mt-1 overflow-x-scroll whitespace-normal break-words text-sm font-medium leading-5"
              >
                {patientData.present_health || "-"}
              </div>
            </div>

            <div className="md:col-span-2">
              <MedicationStatementList patientId={id} />
            </div>

            <div className="md:col-span-2">
              <AllergyList patientId={id} />
            </div>

            <div className="md:col-span-2">
              <SymptomsList patientId={id} />
            </div>

            <div className="md:col-span-2">
              <DiagnosisList patientId={id} />
            </div>

            {patientData.gender === 2 && patientData.is_antenatal && (
              <div className="sm:col-span-1">
                <div className="text-sm font-semibold leading-5 text-zinc-400">
                  {t("is_pregnant")}
                </div>
                <div className="mt-1 whitespace-normal break-words text-sm font-medium leading-5">
                  {t("yes")}
                </div>
              </div>
            )}
            {patientMedHis}
          </div>
        </div>
      </div>
    </div>
  );
};
