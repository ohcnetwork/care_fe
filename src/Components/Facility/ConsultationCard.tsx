import { CardContent, Typography } from "@material-ui/core";
import { navigate } from "raviger";
import React from "react";
import { ConsultationModel } from "./models";
import { KASP_STRING } from "../../Common/constants";
import { formatDate } from "../../Utils/utils";
import ButtonV2 from "../Common/components/ButtonV2";
import { NonReadOnlyUsers } from "../../Utils/AuthorizeFor";
import RelativeDateUserMention from "../Common/RelativeDateUserMention";

interface ConsultationProps {
  itemData: ConsultationModel;
  isLastConsultation?: boolean;
}

export const ConsultationCard = (props: ConsultationProps) => {
  const { itemData, isLastConsultation } = props;
  return (
    <div className="block border rounded-lg bg-white shadow cursor-pointer hover:border-primary-500 text-black mt-4">
      {itemData.is_kasp && (
        <div className="ml-3 mt-2 inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium leading-5 bg-yellow-100 text-yellow-800">
          {KASP_STRING}
        </div>
      )}

      <CardContent>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-4 ml-2 mt-2">
          <div className="sm:col-span-1">
            <Typography>
              <div className="sm:col-span-1">
                <div className="text-sm leading-5 font-semibold text-zinc-400">
                  Facility
                </div>
                <div className="mt-1 text-sm leading-5 font-medium whitespace-normal break-words overflow-x-scroll">
                  {itemData.facility_name}{" "}
                  {itemData.is_telemedicine && (
                    <span className="ml-2">(Telemedicine)</span>
                  )}
                </div>
              </div>
            </Typography>
          </div>
          <div className="sm:col-span-1">
            <Typography className="capitalize">
              <div className="sm:col-span-1">
                <div className="text-sm leading-5 font-semibold text-zinc-400">
                  Suggestion{" "}
                </div>
                <div className="mt-1 text-sm leading-5 font-medium whitespace-normal break-words overflow-x-scroll">
                  {itemData.suggestion_text?.toLocaleLowerCase()}
                </div>
              </div>
            </Typography>
          </div>
          {itemData.kasp_enabled_date && (
            <div className="sm:col-span-1">
              <Typography>
                <div className="sm:col-span-1">
                  <div className="text-sm leading-5 font-semibold text-zinc-400">
                    {KASP_STRING} Enabled date{" "}
                  </div>
                  <div className="mt-1 text-sm leading-5 font-medium whitespace-normal break-words overflow-x-scroll">
                    {itemData.kasp_enabled_date
                      ? formatDate(itemData.kasp_enabled_date)
                      : "-"}
                  </div>
                </div>
              </Typography>
            </div>
          )}
          {itemData.admitted && itemData.admission_date && (
            <div className="sm:col-span-1">
              <Typography>
                <div className="sm:col-span-1">
                  <div className="text-sm leading-5 font-semibold text-zinc-400">
                    Admitted on
                  </div>
                  <div className="mt-1 text-sm leading-5 font-medium whitespace-normal break-words overflow-x-scroll">
                    {formatDate(itemData.admission_date)}
                  </div>
                </div>
              </Typography>
            </div>
          )}
          {!itemData.admitted && (
            <div className="sm:col-span-1">
              <Typography>
                <div className="sm:col-span-1">
                  <div className="text-sm leading-5 font-semibold text-zinc-400">
                    Admitted{" "}
                  </div>
                  <div className="mt-1 text-sm leading-5 font-medium whitespace-normal break-words overflow-x-scroll">
                    No
                  </div>
                </div>
              </Typography>
            </div>
          )}
          {itemData.discharge_date && (
            <div className="sm:col-span-1">
              <Typography>
                <div className="sm:col-span-1">
                  <div className="text-sm leading-5 font-semibold text-zinc-400">
                    Discharged on{" "}
                  </div>
                  <div className="mt-1 text-sm leading-5 font-medium whitespace-normal break-words overflow-x-scroll">
                    {formatDate(itemData.discharge_date)}
                  </div>
                </div>
              </Typography>
            </div>
          )}
        </div>
        <div className="flex flex-col mt-8">
          {
            <div className="text-sm text-gray-700 items-center flex flex-col md:flex-row">
              Created:{" "}
              <RelativeDateUserMention
                actionDate={itemData.created_date}
                user={itemData.created_by}
              />
            </div>
          }
          <div className="text-sm text-gray-700 items-center flex flex-col md:flex-row">
            Last Modified:{" "}
            <RelativeDateUserMention
              actionDate={itemData.modified_date}
              user={itemData.last_edited_by}
            />
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-1 md:flex-row justify-between w-full">
          <ButtonV2
            className="bg-white hover:bg-gray-300 border border-gray-500 text-black"
            onClick={() =>
              navigate(
                `/facility/${itemData.facility}/patient/${itemData.patient}/consultation/${itemData.id}`
              )
            }
          >
            View Consultation / Consultation Updates
          </ButtonV2>
          <ButtonV2
            className="bg-white hover:bg-gray-300 border border-gray-500 text-black"
            onClick={() =>
              navigate(
                `/facility/${itemData.facility}/patient/${itemData.patient}/consultation/${itemData.id}/files/`
              )
            }
          >
            View / Upload Consultation Files
          </ButtonV2>
          {isLastConsultation && (
            <ButtonV2
              className="bg-white hover:bg-gray-300 border border-gray-500 text-black"
              onClick={() =>
                navigate(
                  `/facility/${itemData.facility}/patient/${itemData.patient}/consultation/${itemData.id}/daily-rounds`
                )
              }
              authorizeFor={NonReadOnlyUsers}
            >
              Add Consultation Updates
            </ButtonV2>
          )}
        </div>
      </CardContent>
    </div>
  );
};
