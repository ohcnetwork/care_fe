import careConfig from "@careConfig";
import { navigate } from "raviger";
import { useState } from "react";

import Chip from "@/CAREUI/display/Chip";

import ButtonV2 from "@/components/Common/ButtonV2";
import DialogModal from "@/components/Common/Dialog";
import RelativeDateUserMention from "@/components/Common/RelativeDateUserMention";
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
    ? "Bed History"
    : !itemData.current_bed
      ? "Assign Bed"
      : "Switch Bed";
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
          <div>Invalid Patient Data</div>
        )}
      </DialogModal>
      <div className="mt-4 block cursor-pointer rounded-lg border bg-white p-4 text-black shadow hover:border-primary-500">
        {itemData.is_kasp && (
          <div className="ml-3 mt-2 inline-flex items-center rounded-md bg-yellow-100 px-2.5 py-0.5 text-sm font-medium leading-5 text-yellow-800">
            {careConfig.kasp.string}
          </div>
        )}

        <div className="ml-2 mt-2 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="sm:col-span-1">
            <div className="sm:col-span-1">
              <div className="text-sm font-semibold leading-5 text-zinc-400">
                Facility
              </div>
              <div className="mt-1 overflow-x-scroll whitespace-normal break-words text-sm font-medium leading-5">
                {itemData.facility_name}{" "}
                {itemData.is_telemedicine && (
                  <span className="ml-2">(Telemedicine)</span>
                )}
              </div>
            </div>
          </div>
          <div className="sm:col-span-1">
            <div className="capitalize">
              <div className="sm:col-span-1">
                <div className="text-sm font-semibold leading-5 text-zinc-400">
                  Suggestion{" "}
                </div>
                <div className="mt-1 overflow-x-scroll whitespace-normal break-words text-sm font-medium leading-5">
                  {itemData.suggestion_text?.toLocaleLowerCase()}
                </div>
              </div>
            </div>
          </div>
          {itemData.kasp_enabled_date && (
            <div className="sm:col-span-1">
              <div className="sm:col-span-1">
                <div className="text-sm font-semibold leading-5 text-zinc-400">
                  {careConfig.kasp.string} Enabled date{" "}
                </div>
                <div className="mt-1 overflow-x-scroll whitespace-normal break-words text-sm font-medium leading-5">
                  {itemData.kasp_enabled_date
                    ? formatDateTime(itemData.kasp_enabled_date)
                    : "-"}
                </div>
              </div>
            </div>
          )}
          {itemData.admitted && itemData.encounter_date && (
            <div className="sm:col-span-1">
              <div className="sm:col-span-1">
                <div className="text-sm font-semibold leading-5 text-zinc-400">
                  Admitted on
                </div>
                <div className="mt-1 overflow-x-scroll whitespace-normal break-words text-sm font-medium leading-5">
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
                </div>
              </div>
            </div>
          )}
          {!itemData.admitted && (
            <div className="sm:col-span-1">
              <div className="sm:col-span-1">
                <div className="text-sm font-semibold leading-5 text-zinc-400">
                  Admitted{" "}
                </div>
                <div className="mt-1 overflow-x-scroll whitespace-normal break-words text-sm font-medium leading-5">
                  No
                </div>
              </div>
            </div>
          )}
          {itemData.discharge_date && (
            <div className="sm:col-span-1">
              <div className="sm:col-span-1">
                <div className="text-sm font-semibold leading-5 text-zinc-400">
                  Discharged on{" "}
                </div>
                <div className="mt-1 overflow-x-scroll whitespace-normal break-words text-sm font-medium leading-5">
                  {formatDateTime(itemData.discharge_date)}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="mt-8 flex flex-col">
          {
            <div className="flex flex-col items-center text-sm text-secondary-700 md:flex-row">
              <div className="font-medium text-black">Created : </div>
              <div className="ml-1 text-black">
                <RelativeDateUserMention
                  tooltipPosition="right"
                  actionDate={itemData.created_date}
                  user={itemData.created_by}
                />
              </div>
            </div>
          }
          <div className="flex flex-col items-center text-sm text-secondary-700 md:flex-row">
            <div className="font-medium text-black">Last Modified : </div>
            <div className="ml-1 text-secondary-700">
              <RelativeDateUserMention
                tooltipPosition="right"
                actionDate={itemData.modified_date}
                user={itemData.last_edited_by}
              />
            </div>
          </div>
        </div>
        <div className="mt-4 flex w-full flex-col justify-between gap-1 md:flex-row">
          <ButtonV2
            id="view_consulation_updates"
            className="h-auto whitespace-pre-wrap border border-secondary-500 bg-white text-black hover:bg-secondary-300"
            onClick={() =>
              navigate(
                `/facility/${itemData.facility}/patient/${itemData.patient}/consultation/${itemData.id}`,
              )
            }
          >
            View Consultation / Consultation Updates
          </ButtonV2>
          <ButtonV2
            className="h-auto whitespace-pre-wrap border border-secondary-500 bg-white text-black hover:bg-secondary-300"
            onClick={() =>
              navigate(
                `/facility/${itemData.facility}/patient/${itemData.patient}/consultation/${itemData.id}/files/`,
              )
            }
          >
            View / Upload Consultation Files
          </ButtonV2>
          {isLastConsultation && (
            <ButtonV2
              className="h-auto whitespace-pre-wrap border border-secondary-500 bg-white text-black hover:bg-secondary-300"
              onClick={() => {
                if (itemData.admitted && !itemData.current_bed) {
                  Notification.Error({
                    msg: "Please assign a bed to the patient",
                  });
                  setOpen(true);
                } else {
                  navigate(
                    `/facility/${itemData.facility}/patient/${itemData.patient}/consultation/${itemData.id}/daily-rounds`,
                  );
                }
              }}
              disabled={!!itemData.discharge_date}
              authorizeFor={NonReadOnlyUsers}
            >
              Add Consultation Updates
            </ButtonV2>
          )}
        </div>
      </div>
    </>
  );
};
