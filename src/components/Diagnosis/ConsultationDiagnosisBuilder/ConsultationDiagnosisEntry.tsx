import { useState } from "react";

import ConditionVerificationStatusMenu from "@/components/Diagnosis/ConditionVerificationStatusMenu";
import DiagnosesRoutes from "@/components/Diagnosis/routes";
import {
  ActiveConditionVerificationStatuses,
  ConditionVerificationStatuses,
  ConsultationDiagnosis,
  CreateDiagnosis,
} from "@/components/Diagnosis/types";

import request from "@/Utils/request/request";
import { classNames } from "@/Utils/utils";

interface RemoveAction {
  type: "remove";
}

interface EditAction {
  type: "edit";
  value: CreateDiagnosis | ConsultationDiagnosis;
}

interface BaseProps {
  className?: string;
}

interface ConsultationCreateProps extends BaseProps {
  consultationId?: undefined;
  value: CreateDiagnosis;
  onChange: (action: EditAction | RemoveAction) => void;
}

interface ConsultationEditProps extends BaseProps {
  consultationId: string;
  value: ConsultationDiagnosis;
  onChange: (action: EditAction) => void;
}

type Props = ConsultationCreateProps | ConsultationEditProps;

export default function ConsultationDiagnosisEntry(props: Props) {
  const [disabled, setDisabled] = useState(false);

  const handleUpdate = async (value: ConsultationDiagnosis) => {
    setDisabled(true);
    const { res, data } = await request(
      DiagnosesRoutes.updateConsultationDiagnosis,
      {
        pathParams: {
          consultation: props.consultationId as string,
          id: value.id,
        },
        body: value,
      },
    );
    setDisabled(false);

    if (res?.ok && data) {
      props.onChange({ type: "edit", value: data });
    }
  };

  const object = props.value;
  const isActive = ActiveConditionVerificationStatuses.includes(
    object.verification_status as (typeof ActiveConditionVerificationStatuses)[number],
  );

  return (
    <div
      className={classNames(props.className, "flex w-full items-center gap-2")}
    >
      <div
        className={classNames(
          "cui-input-base relative flex w-full flex-col gap-2 md:flex-row",
          object.is_principal && "border-primary-500",
        )}
      >
        <span
          className={classNames(
            object.is_principal
              ? "font-semibold text-primary-500"
              : "font-normal",
            !isActive && "text-secondary-500 line-through",
            !object.diagnosis_object?.label && "italic text-secondary-500",
          )}
        >
          {object.diagnosis_object?.label ||
            "Unable to retrieve this ICD-11 diagnosis at the moment"}
        </span>
        <div className="flex items-center justify-end gap-2 sm:flex-row md:absolute md:inset-y-0 md:right-2 md:justify-normal">
          <div className="w-32">
            <ConditionVerificationStatusMenu
              className="w-full"
              value={object.verification_status}
              disabled={disabled}
              options={
                props.consultationId === undefined
                  ? ActiveConditionVerificationStatuses
                  : ConditionVerificationStatuses
              }
              onSelect={async (verification_status) => {
                const value = { ...object, verification_status };
                if (props.consultationId) {
                  await handleUpdate(value as ConsultationDiagnosis);
                } else {
                  props.onChange({
                    type: "edit",
                    value: value as CreateDiagnosis | ConsultationDiagnosis,
                  });
                }
              }}
              onRemove={
                props.consultationId === undefined
                  ? () => props.onChange({ type: "remove" })
                  : undefined
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
