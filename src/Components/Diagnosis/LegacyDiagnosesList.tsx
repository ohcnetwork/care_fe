import {
  ActiveConditionVerificationStatuses,
  ConditionVerificationStatus,
  ConsultationDiagnosis,
} from "./types";
import { useTranslation } from "react-i18next";
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
    <div className="grid grid-cols-1 items-start gap-2 lg:grid-cols-2 2xl:grid-cols-3">
      {Object.entries(diagnoses).map(
        ([status, diagnoses]) =>
          !!diagnoses.length && (
            <DiagnosesOfStatus key={status} diagnoses={diagnoses} />
          )
      )}
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
