import { Prescription } from "./models";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { classNames } from "../../Utils/utils";
import ReadMore from "../Common/components/Readmore";
import ButtonV2 from "../Common/components/ButtonV2";
import { useTranslation } from "react-i18next";
import RecordMeta from "../../CAREUI/display/RecordMeta";
import { useState } from "react";
import { AuthorizedForConsultationRelatedActions } from "../../CAREUI/misc/AuthorizedChild";

interface Props {
  prescription: Prescription;
  readonly?: boolean;
  children?: React.ReactNode;
  onDiscontinueClick?: () => void;
  onAdministerClick?: () => void;
  selected?: boolean;
  collapsible?: boolean;
}

export default function PrescriptionDetailCard({
  prescription,
  collapsible = false,
  onAdministerClick,
  onDiscontinueClick,
  ...props
}: Props) {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(
    collapsible && prescription.discontinued,
  );

  return (
    <div
      className={classNames(
        "flex flex-col rounded border-2 p-3 transition-all duration-200 ease-in-out md:flex-row",
        props.selected
          ? "border-primary-500"
          : "border-spacing-2 border-dashed border-gray-500",
        prescription.discontinued && "bg-gray-200 opacity-80",
        collapsible && "cursor-pointer hover:border-gray-900",
      )}
    >
      <div
        className="flex flex-1 flex-col"
        onClick={() => {
          if (collapsible) {
            setIsCollapsed(!isCollapsed);
          }
        }}
      >
        <div>
          <div className="flex items-center justify-between">
            <div className="flex w-full items-center justify-between gap-4">
              <h3
                className={classNames(
                  "text-lg font-bold transition-all duration-200 ease-in-out",
                  props.selected ? "text-black" : "text-gray-700",
                )}
              >
                {isCollapsed ? (
                  prescription.medicine_object?.name ??
                  prescription.medicine_old
                ) : (
                  <>
                    {prescription.prescription_type === "DISCHARGE" &&
                      `${t("discharge")} `}
                    {t(
                      prescription.dosage_type === "PRN"
                        ? "prn_prescription"
                        : "prescription",
                    )}
                    {` #${prescription.id?.slice(-5)}`}
                  </>
                )}
              </h3>
              {prescription.discontinued && (
                <span className="rounded-full bg-gray-700 px-2 py-1 text-xs font-semibold uppercase text-white">
                  {t("discontinued")}
                </span>
              )}
            </div>

            {!props.readonly &&
              prescription.prescription_type !== "DISCHARGE" && (
                <AuthorizedForConsultationRelatedActions>
                  <div className="flex flex-col-reverse items-end gap-2 sm:flex-row">
                    {!prescription.discontinued && onAdministerClick && (
                      <ButtonV2
                        id="administer-medicine"
                        disabled={prescription.discontinued}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAdministerClick();
                        }}
                        type="button"
                        size="small"
                        variant="secondary"
                        ghost
                        border
                      >
                        <CareIcon icon="l-syringe" className="text-base" />
                        {t("administer")}
                      </ButtonV2>
                    )}
                    {!prescription.discontinued && onDiscontinueClick && (
                      <ButtonV2
                        type="button"
                        size="small"
                        variant="danger"
                        ghost
                        border
                        onClick={(e) => {
                          e.stopPropagation();
                          onDiscontinueClick();
                        }}
                      >
                        <CareIcon icon="l-ban" className="text-base" />
                        {t("discontinue")}
                      </ButtonV2>
                    )}
                  </div>
                </AuthorizedForConsultationRelatedActions>
              )}
          </div>
        </div>
        {!isCollapsed && (
          <div className="mt-4 grid grid-cols-10 items-center gap-2">
            <Detail
              className={
                prescription.dosage_type === "TITRATED"
                  ? "col-span-10"
                  : "col-span-10 md:col-span-4"
              }
              label={t("medicine")}
            >
              {prescription.medicine_object?.name ?? prescription.medicine_old}
            </Detail>
            <Detail
              className="col-span-10 break-all sm:col-span-4"
              label={t("route")}
            >
              {prescription.route &&
                t("PRESCRIPTION_ROUTE_" + prescription.route)}
            </Detail>
            {prescription.dosage_type === "TITRATED" ? (
              <>
                <Detail
                  className="col-span-5 sm:col-span-3"
                  label={t("start_dosage")}
                >
                  {prescription.base_dosage}
                </Detail>
                <Detail
                  className="col-span-5 sm:col-span-3"
                  label={t("target_dosage")}
                >
                  {prescription.target_dosage}
                </Detail>
              </>
            ) : (
              <Detail
                className="col-span-10 sm:col-span-6 md:col-span-2"
                label={t("dosage")}
              >
                {prescription.base_dosage}
              </Detail>
            )}

            {prescription.dosage_type === "PRN" ? (
              <>
                <Detail
                  className="col-span-10 md:col-span-6"
                  label={t("indicator")}
                >
                  {prescription.indicator}
                </Detail>
                <Detail
                  className="col-span-10 md:col-span-2"
                  label={t("max_dosage_24_hrs")}
                >
                  {prescription.max_dosage}
                </Detail>
                <Detail
                  className="col-span-10 md:col-span-2"
                  label={t("min_time_bw_doses")}
                >
                  {prescription.min_hours_between_doses &&
                    prescription.min_hours_between_doses + " hrs."}
                </Detail>
              </>
            ) : (
              <>
                <Detail className="col-span-5" label={t("frequency")}>
                  {prescription.frequency &&
                    t(
                      "PRESCRIPTION_FREQUENCY_" +
                        prescription.frequency.toUpperCase(),
                    )}
                </Detail>
                <Detail className="col-span-5" label={t("days")}>
                  {prescription.days}
                </Detail>
              </>
            )}

            {prescription.instruction_on_titration && (
              <Detail
                className="col-span-10"
                label={t("instruction_on_titration")}
              >
                <ReadMore
                  text={prescription.instruction_on_titration}
                  minChars={120}
                />
              </Detail>
            )}

            {prescription.notes && (
              <Detail className="col-span-10" label={t("notes")}>
                <ReadMore text={prescription.notes} minChars={120} />
              </Detail>
            )}

            {prescription.discontinued && (
              <Detail
                className="col-span-10"
                label={t("reason_for_discontinuation")}
              >
                {prescription.discontinued_reason}
              </Detail>
            )}
          </div>
        )}
        <div className="flex flex-col gap-1 text-xs text-gray-600 md:mt-3 md:flex-row md:items-center">
          <span className="flex gap-1 font-medium">
            Prescribed
            <RecordMeta
              time={prescription.created_date}
              user={prescription.prescribed_by}
              inlineUser
            />
          </span>
          {prescription.discontinued && (
            <span className="flex gap-1">
              and was discontinued
              <RecordMeta time={prescription.discontinued_date} />
            </span>
          )}
        </div>
      </div>

      {props.children}
    </div>
  );
}

const Detail = (props: {
  className?: string;
  label: string;
  children?: React.ReactNode;
}) => {
  const { t } = useTranslation();
  return (
    <div className={classNames("flex flex-col gap-1", props.className)}>
      <label className="text-sm font-medium text-gray-600">{props.label}</label>
      <div className="cui-input-base w-full">
        {props.children ? (
          <span className="font-medium">{props.children}</span>
        ) : (
          <span className="whitespace-nowrap text-xs font-medium text-gray-500">
            {t("not_specified")}
          </span>
        )}
      </div>
    </div>
  );
};
