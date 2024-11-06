import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import ButtonV2 from "@/components/Common/ButtonV2";
import {
  ActiveConditionVerificationStatuses,
  ConditionVerificationStatus,
  ConsultationDiagnosis,
} from "@/components/Diagnosis/types";

import { classNames, compareBy } from "@/Utils/utils";

interface Props {
  diagnoses: ConsultationDiagnosis[];
}

type GroupedDiagnoses = Record<
  ConditionVerificationStatus,
  ConsultationDiagnosis[]
>;

function groupDiagnoses(diagnoses: ConsultationDiagnosis[]) {
  const groupedDiagnoses = {} as GroupedDiagnoses;

  for (const status of ActiveConditionVerificationStatuses) {
    groupedDiagnoses[status] = diagnoses
      .filter((d) => d.verification_status === status)
      .sort(compareBy("is_principal"));
  }

  return groupedDiagnoses;
}

export default function DiagnosesListAccordion(props: Props) {
  const [isVisible, setIsVisible] = useState(true);
  const diagnoses = groupDiagnoses(props.diagnoses);

  return (
    <div>
      <div className="flex justify-between">
        {!isVisible && (
          <ButtonV2
            className="text-md w-full p-0 font-semibold text-black hover:bg-secondary-200"
            ghost
            onClick={() => {
              setIsVisible((prev) => !prev);
            }}
          >
            <CareIcon icon="l-angle-down" className="h-7" />
            Expand Diagnoses
          </ButtonV2>
        )}
      </div>
      <div
        className={`transition-all duration-500 ease-in-out ${
          isVisible ? "overflow-visible" : "h-0 overflow-hidden"
        }`}
      >
        <h3 className="my-2 text-lg font-semibold leading-relaxed text-secondary-900">
          Diagnoses
        </h3>
        <div
          className="grid grid-cols-1 items-start gap-2 lg:grid-cols-2 2xl:grid-cols-3"
          id="diagnoses-view"
        >
          {Object.entries(diagnoses).map(
            ([status, diagnoses]) =>
              !!diagnoses.length && (
                <DiagnosesOfStatus key={status} diagnoses={diagnoses} />
              ),
          )}
        </div>
        <ButtonV2
          className="text-md w-full rounded-lg p-0 text-secondary-600 hover:bg-secondary-200"
          ghost
          onClick={() => {
            setIsVisible(false);
          }}
          shadow={false}
        >
          <CareIcon icon="l-angle-up" className="h-7" />
          Hide Diagnoses
        </ButtonV2>
      </div>
    </div>
  );
}

const DiagnosesOfStatus = ({ diagnoses }: Props) => {
  const { t } = useTranslation();

  return (
    <div>
      <h2 className="text-sm font-semibold">
        {t(diagnoses[0].verification_status)} {t("diagnoses")}{" "}
        <span>({t("icd11_as_recommended")})</span>
      </h2>
      <ul className="text-sm">
        {diagnoses.map((diagnosis) => (
          <li key={diagnosis.id} className="flex items-center gap-2">
            <span
              className={classNames(
                !diagnosis.diagnosis_object?.label &&
                  "italic text-secondary-500",
              )}
            >
              {diagnosis.diagnosis_object?.label ||
                "Unable to resolve ICD-11 diagnosis at the moment"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
