import { useState } from "react";
import {
  ActiveConditionVerificationStatuses,
  ConditionVerificationStatus,
  ConsultationDiagnosis,
} from "./types";
import { useTranslation } from "react-i18next";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { compareBy } from "../../Utils/utils";

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

export default function LegacyDiagnosesList(props: Props) {
  const diagnoses = groupDiagnoses(props.diagnoses);

  return (
    <div className="flex flex-col items-start gap-2">
      {Object.entries(diagnoses).map(
        ([status, diagnoses]) =>
          !!diagnoses.length && (
            <DiagnosesOfStatus key={status} diagnoses={diagnoses} />
          )
      )}
    </div>
  );
}

const DefaultShowLimit = 3;

const DiagnosesOfStatus = ({ diagnoses }: Props) => {
  const { t } = useTranslation();
  const [showMore, setShowMore] = useState(false);

  const queryset = showMore ? diagnoses : diagnoses.slice(0, DefaultShowLimit);

  return (
    <div>
      <h2 className="text-sm font-semibold">
        {t(queryset[0].verification_status)} {t("diagnoses")}{" "}
        <span>({t("icd11_as_recommended")})</span>
      </h2>
      <ul className="text-sm">
        {queryset.map((diagnosis) => (
          <li key={diagnosis.id} className="flex items-center gap-2">
            <span>{diagnosis.diagnosis_object?.label}</span>
            {diagnosis.is_principal && (
              <span className="flex items-start gap-0.5 rounded border border-primary-500 py-0.5 pl-1 pr-2 text-xs font-medium text-primary-500">
                <CareIcon icon="l-check" className="text-base" />
                {t("principal")}
              </span>
            )}
          </li>
        ))}
      </ul>

      {diagnoses.length > DefaultShowLimit && (
        <a
          onClick={() => setShowMore(!showMore)}
          className="cursor-pointer text-sm text-blue-600 hover:text-blue-300"
        >
          {showMore
            ? t("hide")
            : `... and ${diagnoses.length - queryset.length} more.`}
        </a>
      )}
    </div>
  );
};
