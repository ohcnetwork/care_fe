import { useState } from "react";
import { useTranslation } from "react-i18next";

import RecordMeta from "@/CAREUI/display/RecordMeta";
import CareIcon from "@/CAREUI/icons/CareIcon";
import { AuthorizedForConsultationRelatedActions } from "@/CAREUI/misc/AuthorizedChild";

import ButtonV2 from "@/components/Common/ButtonV2";

import {
  classNames,
  displayCode,
  displayQuantity,
  displayTiming,
} from "@/Utils/utils";
import { MedicationRequest } from "@/types/emr/medicationRequest";
import { Quantity } from "@/types/questionnaire/quantity";

import { isMedicationDiscontinued } from "./MedicineAdministrationSheet/utils";

interface Props {
  prescription: MedicationRequest;
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
    collapsible && isMedicationDiscontinued(prescription),
  );

  return (
    <div
      className={classNames(
        "flex flex-col rounded border-2 p-3 transition-all duration-200 ease-in-out md:flex-row",
        props.selected
          ? "border-primary-500"
          : "border-spacing-2 border-dashed border-secondary-500",
        isMedicationDiscontinued(prescription) && "bg-secondary-200 opacity-80",
        collapsible && "cursor-pointer hover:border-secondary-900",
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
                  props.selected ? "text-black" : "text-secondary-700",
                )}
              >
                {isCollapsed ? (
                  displayCode(prescription.medication)
                ) : (
                  <>
                    {prescription.category === "discharge" &&
                      `${t("discharge")} `}
                    {t(
                      prescription.dosage_instruction[0].as_needed_boolean
                        ? "prn_prescription"
                        : "prescription",
                    )}
                    {` #${prescription.id?.slice(-5)}`}
                  </>
                )}
              </h3>
              {isMedicationDiscontinued(prescription) && (
                <span className="rounded-full bg-secondary-700 px-2 py-1 text-xs font-semibold uppercase text-white">
                  {t("discontinued")}
                </span>
              )}
            </div>

            {!props.readonly && prescription.category === "discharge" && (
              <AuthorizedForConsultationRelatedActions>
                <div className="flex flex-col-reverse items-end gap-2 sm:flex-row">
                  {!isMedicationDiscontinued(prescription) &&
                    onAdministerClick && (
                      <ButtonV2
                        id="administer-medicine"
                        disabled={isMedicationDiscontinued(prescription)}
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
                  {!isMedicationDiscontinued(prescription) &&
                    onDiscontinueClick && (
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
            <Detail className="col-span-10">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <span className="font-semibold uppercase">
                    {displayCode(prescription.medication)}
                  </span>
                </div>
              </div>
            </Detail>

            {prescription.dosage_instruction[0].dose_and_rate?.dose_range && (
              <>
                <Detail className="col-span-5" label={t("start_dosage")}>
                  {displayQuantity(
                    prescription.dosage_instruction[0].dose_and_rate?.dose_range
                      ?.low as Quantity,
                  )}
                </Detail>
                <Detail className="col-span-5" label={t("target_dosage")}>
                  {displayQuantity(
                    prescription.dosage_instruction[0].dose_and_rate?.dose_range
                      ?.high as Quantity,
                  )}
                </Detail>
              </>
            )}

            {prescription.dosage_instruction[0].dose_and_rate
              ?.dose_quantity && (
              <Detail
                className="col-span-10 sm:col-span-6 md:col-span-4"
                label={t("dosage")}
              >
                {displayQuantity(
                  prescription.dosage_instruction[0].dose_and_rate
                    ?.dose_quantity as Quantity,
                )}
              </Detail>
            )}

            <Detail
              className="col-span-10 break-all sm:col-span-6"
              label={t("route")}
            >
              {displayCode(prescription.dosage_instruction[0].route)}
            </Detail>

            {prescription.dosage_instruction[0].as_needed_boolean ? (
              <Detail
                className="col-span-10 md:col-span-4"
                label={t("indicator")}
              >
                {displayCode(prescription.dosage_instruction[0].as_needed_for)}
              </Detail>
            ) : (
              <Detail className="col-span-5" label={t("frequency")}>
                {displayTiming(prescription.dosage_instruction[0].timing)}
              </Detail>
            )}

            {prescription.note && (
              <Detail className="col-span-10" label={t("notes")}>
                {prescription.note}
              </Detail>
            )}

            {isMedicationDiscontinued(prescription) && (
              <Detail
                className="col-span-10"
                label={t("reason_for_discontinuation")}
              >
                {prescription.status_reason}
              </Detail>
            )}
          </div>
        )}
        <div className="flex flex-col gap-1 text-xs text-secondary-600 md:mt-3 md:flex-row md:items-center">
          <span className="flex gap-1 font-medium">
            Prescribed
            <RecordMeta
              time={prescription.authored_on}
              user={prescription.created_by}
              inlineUser
            />
          </span>
          {isMedicationDiscontinued(prescription) && (
            <span className="flex gap-1">
              and was discontinued
              <RecordMeta time={prescription.status_changed} />
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
  label?: string;
  children?: React.ReactNode;
}) => {
  const { t } = useTranslation();
  return (
    <div className={classNames("flex flex-col gap-1", props.className)}>
      {props.label && (
        <label className="text-sm font-medium text-secondary-600">
          {props.label}
        </label>
      )}
      <div className="cui-input-base w-full">
        {props.children ? (
          <span className="font-medium">{props.children}</span>
        ) : (
          <span className="whitespace-nowrap text-xs font-medium text-secondary-500">
            {t("not_specified")}
          </span>
        )}
      </div>
    </div>
  );
};
