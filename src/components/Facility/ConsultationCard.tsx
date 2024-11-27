import careConfig from "@careConfig";
import dayjs from "dayjs";
import { t } from "i18next";
import { navigate } from "raviger";
import { useState } from "react";

import Chip from "@/CAREUI/display/Chip";
import CareIcon from "@/CAREUI/icons/CareIcon";

import ButtonV2 from "@/components/Common/ButtonV2";
import DialogModal from "@/components/Common/Dialog";
import Beds from "@/components/Facility/Consultations/Beds";
import { ConsultationModel } from "@/components/Facility/models";

import { NonReadOnlyUsers } from "@/Utils/AuthorizeFor";
import * as Notification from "@/Utils/Notifications";
import { formatDateTime } from "@/Utils/utils";

interface ConsultationProps {
  itemData: ConsultationModel;
  isLastConsultation?: boolean;
  refetch: () => void;
}

export const ConsultationCard = (props: ConsultationProps) => {
  const { itemData, isLastConsultation, refetch } = props;
  const [open, setOpen] = useState(false);
  const bedDialogTitle = itemData.discharge_date
    ? t("bed_history")
    : !itemData.current_bed
      ? t("assign_bed")
      : t("switch_bed");
  return (
    <>
      <DialogModal
        title={bedDialogTitle}
        show={open}
        onClose={() => setOpen(false)}
        className="md:max-w-3xl"
      >
        {itemData.facility && itemData.patient && itemData.id ? (
          <Beds
            facilityId={itemData.facility}
            discharged={!!itemData.discharge_date}
            consultationId={itemData.id ?? ""}
            setState={setOpen}
            fetchPatientData={refetch}
            smallLoader
            hideTitle
          />
        ) : (
          <div>{t("invalid_patient_data")}</div>
        )}
      </DialogModal>
      <div className="pb-16 block relative cursor-pointer border-l-2 px-4 border-l-secondary-300 hover:border-primary-500 transition-all before:absolute before:-left-[7px] before:top-0 before:w-3 before:aspect-square before:bg-secondary-400 before:rounded-full hover:before:bg-primary-500 before:transition-all">
        <Chip
          size="small"
          variant={itemData.suggestion === "A" ? "alert" : "primary"}
          text={
            itemData.suggestion === "A" ? t("ip_encounter") : t("op_encounter")
          }
          className="-translate-y-2"
        />
        <div className="text-sm">
          {dayjs(itemData.created_date).format("DD/MM/YYYY")}
        </div>

        {itemData.is_kasp && (
          <div className="ml-3 mt-2 inline-flex items-center rounded-md bg-yellow-100 px-2.5 py-0.5 text-sm font-medium leading-5 text-yellow-800">
            {careConfig.kasp.string}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {[
            {
              label: t("facility"),
              value: (
                <>
                  {itemData.facility_name}
                  {itemData.is_telemedicine && (
                    <span className="ml-1">(Telemedicine)</span>
                  )}
                </>
              ),
            },
            {
              label: t("suggestion"),
              value: itemData.suggestion_text?.toLocaleLowerCase(),
            },
            {
              hide: !itemData.kasp_enabled_date,
              label: t("kasp_enabled_date", {
                kasp_string: careConfig.kasp.string,
              }),
              value: itemData.kasp_enabled_date
                ? formatDateTime(itemData.kasp_enabled_date)
                : undefined,
            },

            {
              label: t("admitted_on"),
              hide: !(itemData.admitted && itemData.encounter_date),
              value: (
                <>
                  {formatDateTime(itemData.encounter_date)}
                  {itemData.is_readmission && (
                    <Chip
                      size="small"
                      variant="custom"
                      className="ml-4 border-blue-600 bg-blue-100 text-blue-600"
                      startIcon="l-repeat"
                      text="Readmission"
                    />
                  )}
                </>
              ),
            },
            {
              label: t("admitted"),
              hide: itemData.admitted,
              value: t("no"),
            },
            {
              label: t("discharged_on"),
              hide: !itemData.discharge_date,
              value: formatDateTime(itemData.discharge_date),
            },
          ]
            .filter((f) => !f.hide)
            .map((field, i) => (
              <div key={i}>
                <div className="text-sm text-gray-600">{field.label}</div>
                <div className="font-bold">{field.value}</div>
              </div>
            ))}
        </div>

        <div className="flex gap-2 items-center mt-4">
          <ButtonV2
            id="view_consultation_and_log_updates"
            variant="secondary"
            className="bg-gray-200 rounded-lg font-semibold shadow-none text-xs"
            onClick={() =>
              navigate(
                `/facility/${itemData.facility}/patient/${itemData.patient}/consultation/${itemData.id}`,
              )
            }
          >
            {t("view_updates")}
          </ButtonV2>
          <ButtonV2
            variant="secondary"
            className="bg-gray-200 rounded-lg font-semibold shadow-none text-xs"
            onClick={() =>
              navigate(
                `/facility/${itemData.facility}/patient/${itemData.patient}/consultation/${itemData.id}/files/`,
              )
            }
          >
            {t("view_files")}
          </ButtonV2>
        </div>
        {isLastConsultation && (
          <ButtonV2
            variant="secondary"
            className="mt-2 shadow-none border border-secondary-300"
            onClick={() => {
              if (itemData.admitted && !itemData.current_bed) {
                Notification.Error({
                  msg: t("please_assign_bed_to_patient"),
                });
                setOpen(true);
              } else {
                navigate(
                  `/facility/${itemData.facility}/patient/${itemData.patient}/consultation/${itemData.id}/log_updates/`,
                );
              }
            }}
            disabled={!!itemData.discharge_date}
            authorizeFor={NonReadOnlyUsers}
          >
            <CareIcon icon="l-plus-circle" />
            {t("add_consultation_update")}
          </ButtonV2>
        )}
      </div>
    </>
  );
};
