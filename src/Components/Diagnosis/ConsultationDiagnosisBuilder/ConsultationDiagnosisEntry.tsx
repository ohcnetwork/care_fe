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
import * as Notification from "../../../Utils/Notifications";

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
    const { res, data, error } = await request(
      DiagnosesRoutes.updateConsultationDiagnosis,
      {
        pathParams: {
          consultation: props.consultationId as string,
          id: value.id,
        },
      }
    );
    setDisabled(false);

    if (error) {
      Notification.Error({ msg: error });
    }

    if (res?.ok && data) {
      setData(data);
    }
  };

  const object = data ?? props.value;

  return (
    <div className={props.className}>
      <div className="flex items-start gap-2">
        <div className="cui-input-base">{object.diagnosis_object?.label}</div>

        <ButtonV2
          className="shrink-0"
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

          <span className="sr-only">
            {object.is_principal
              ? t("mark_as_principal")
              : t("unmark_as_principal")}
          </span>
        </ButtonV2>

        <ConditionVerificationStatusMenu
          className="shrink-0"
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
