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

  const isActive = ActiveConditionVerificationStatuses.includes(
    object.verification_status as (typeof ActiveConditionVerificationStatuses)[number]
  );

  return (
    <div
      className={classNames(props.className, "flex w-full items-center gap-2")}
    >
      <div
        className={classNames(
          "cui-input-base relative flex w-full flex-col gap-2 md:flex-row",
          object.is_principal && "border-primary-500"
        )}
      >
        <span
          className={classNames(
            object.is_principal
              ? "font-semibold text-primary-500"
              : "font-normal",
            !isActive && "text-gray-500 line-through"
          )}
        >
          {object.diagnosis_object?.label}
        </span>

        <div className="flex items-center justify-end gap-2 sm:flex-row md:absolute md:inset-y-0 md:right-2 md:justify-normal">
          {isActive && (
            <ButtonV2
              type="button"
              size="small"
              variant={object.is_principal ? "primary" : "secondary"}
              disabled={disabled}
              ghost
              border
              onClick={async () => {
                const value = { ...object, is_principal: !object.is_principal };
                if (props.consultationId) {
                  await handleUpdate(value as ConsultationDiagnosis);
                }
                props.onChange({ type: "edit", value });
              }}
              tooltip={object.is_principal ? t("unmark_as_principal") : ""}
              tooltipClassName="tooltip-bottom -translate-x-1/2 translate-y-1 text-xs"
            >
              {object.is_principal && (
                <CareIcon icon="l-check" className="text-lg" />
              )}
              <span className="py-0.5">
                {object.is_principal ? (
                  <>
                    <span className="hidden md:block">
                      {t("principal_diagnosis")}
                    </span>
                    <span className="block md:hidden">{t("principal")}</span>
                  </>
                ) : (
                  t("mark_as_principal")
                )}
              </span>
            </ButtonV2>
          )}
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
                }
                props.onChange({
                  type: "edit",
                  value: value as CreateDiagnosis | ConsultationDiagnosis,
                });
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
