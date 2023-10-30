import { useTranslation } from "react-i18next";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import ButtonV2 from "../../Common/components/ButtonV2";
import ConditionVerificationStatusMenu from "../ConditionVerificationStatusMenu";
import {
  ActiveConditionVerificationStatuses,
  ConditionVerificationStatuses,
  ConsultationDiagnosis,
  CreateDiagnosis,
} from "../types";
import DiagnosesRoutes from "../routes";
import { useState } from "react";
import request from "../../../Utils/request/request";
import { classNames } from "../../../Utils/utils";

interface RemoveAction {
  type: "remove";
}

interface EditAction {
  type: "edit";
  value: CreateDiagnosis | ConsultationDiagnosis;
}

type Action = RemoveAction | EditAction;

interface BaseProps {
  className?: string;
}

interface ConsultationCreateProps extends BaseProps {
  consultationId?: undefined;
  value: CreateDiagnosis;
  onChange: (action: Action) => void;
}

interface ConsultationEditProps extends BaseProps {
  consultationId: string;
  value: ConsultationDiagnosis;
}

type Props = ConsultationCreateProps | ConsultationEditProps;

export default function ConsultationDiagnosisEntry(props: Props) {
  const { t } = useTranslation();
  const [data, setData] = useState<ConsultationDiagnosis>();
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
      }
    );
    setDisabled(false);

    if (res?.ok && data) {
      setData(data);
    }
  };

  const object = data ?? props.value;

  return (
    <div
      className={classNames(props.className, "flex w-full items-center gap-2")}
    >
      <div
        className={classNames(
          "cui-input-base relative w-full",
          object.is_principal && "border-primary-500 ring-1 ring-primary-500"
        )}
      >
        {object.diagnosis_object?.label}

        <ButtonV2
          className="absolute right-2 top-2 h-full"
          type="button"
          size="small"
          variant={object.is_principal ? "primary" : "secondary"}
          disabled={disabled}
          ghost
          border
          onClick={() => {
            const value = { ...object, is_principal: !object.is_principal };

            if (props.consultationId === undefined) {
              props.onChange({ type: "edit", value });
              return;
            }

            handleUpdate(value as ConsultationDiagnosis);
          }}
        >
          <CareIcon
            icon={object.is_principal ? "l-check" : "l-times"}
            className="text-lg"
          />

          <span>
            {object.is_principal
              ? t("principal_diagnosis")
              : t("mark_as_principal")}
          </span>
        </ButtonV2>
      </div>

      <div className="w-72">
        <ConditionVerificationStatusMenu
          className="w-full"
          value={object.verification_status}
          disabled={disabled}
          options={
            props.consultationId === undefined
              ? ActiveConditionVerificationStatuses
              : ConditionVerificationStatuses
          }
          onSelect={(verification_status) => {
            const value = { ...object, verification_status };

            if (props.consultationId === undefined) {
              props.onChange({ type: "edit", value: value as CreateDiagnosis });
              return;
            }

            handleUpdate(value as ConsultationDiagnosis);
          }}
          onRemove={
            props.consultationId === undefined
              ? () => props.onChange({ type: "remove" })
              : undefined
          }
        />
      </div>
    </div>
  );
}
