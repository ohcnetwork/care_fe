import {
  ActiveConditionVerificationStatuses,
  ConditionVerificationStatus,
  ConsultationDiagnosis,
} from "./types";
import { useTranslation } from "react-i18next";
import { compareBy } from "../../Utils/utils";
import { useState } from "react";
import CareIcon from "../../CAREUI/icons/CareIcon";
import ButtonV2 from "../Common/components/ButtonV2";

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
            className="text-md w-full p-0 font-semibold text-black hover:bg-gray-200"
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
        <h3 className="my-2 text-lg font-semibold leading-relaxed text-gray-900">
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
          className="text-md w-full rounded-lg p-0 text-gray-600 hover:bg-gray-200"
          ghost
          onClick={() => {
            setIsVisible(false);
          }}
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
            <span>{diagnosis.diagnosis_object?.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
