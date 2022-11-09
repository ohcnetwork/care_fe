import { CardContent, Grid, Typography } from "@material-ui/core";
import { navigate } from "raviger";
import React from "react";
import { ConsultationModel } from "./models";
import { KASP_STRING } from "../../Common/constants";
import { RoleButton } from "../Common/RoleButton";
import { formatDate } from "../../Utils/utils";
import ButtonV2 from "../Common/components/ButtonV2";

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
        <Grid
          container
          justify="space-between"
          alignItems="center"
          className="ml-2 mt-2"
        >
          <Grid item xs={12} container spacing={1}>
            <Grid item xs={3}>
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
            </Grid>
            <Grid item xs={3}>
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
            </Grid>
            {itemData.kasp_enabled_date && (
              <Grid item xs={3}>
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
              </Grid>
            )}
            {itemData.admission_date && (
              <Grid item xs={3}>
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
              </Grid>
            )}
            <Grid item xs={3}>
              <Typography>
                <div className="sm:col-span-1">
                  <div className="text-sm leading-5 font-semibold text-zinc-400">
                    Admitted{" "}
                  </div>
                  <div className="mt-1 text-sm leading-5 font-medium whitespace-normal break-words overflow-x-scroll">
                    {itemData.admitted ? "Yes" : "No"}
                  </div>
                </div>
              </Typography>
            </Grid>
            {itemData.discharge_date && (
              <Grid item xs={5}>
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
              </Grid>
            )}
          </Grid>
          <div className="flex flex-col mt-8">
            {
              <div className="text-sm text-gray-700 items-center flex flex-col md:flex-row">
                Created:{" "}
                <p>
                  {itemData.created_date
                    ? formatDate(itemData.created_date)
                    : "--:--"}{" "}
                </p>
                {itemData.created_by && (
                  <div className="tooltip">
                    <span className="tooltip-text tooltip-top">
                      <div className="text-sm leading-5 text-white whitespace-normal font-semibold">
                        {`${itemData.created_by?.first_name} ${itemData.created_by?.last_name} @${itemData.created_by?.username} (${itemData.created_by?.user_type})`}
                      </div>
                    </span>
                    <i className="ml-1 uil uil-user-circle text-green-700 font-semibold text-xl hover:text-green-600"></i>
                  </div>
                )}
              </div>
            }
            <div className="text-sm text-gray-700 items-center flex flex-col md:flex-row">
              Last Modified:{" "}
              <p>
                {itemData.modified_date
                  ? formatDate(itemData.modified_date)
                  : "--:--"}{" "}
              </p>
              {itemData.last_edited_by && (
                <div className="tooltip">
                  <span className="tooltip-text tooltip-top">
                    <div className="text-sm leading-5 text-white whitespace-normal font-semibold">
                      {`${itemData.last_edited_by?.first_name} ${itemData.last_edited_by?.last_name} @${itemData.last_edited_by?.username} (${itemData.last_edited_by?.user_type})`}
                    </div>
                  </span>
                  <i className="ml-1 uil uil-user-circle text-green-700 font-semibold text-xl hover:text-green-600"></i>
                </div>
              )}
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
              <RoleButton
                className="md:mr-4 px-4 py-2 border bg-white rounded-md text-sm cursor-pointer hover:bg-gray-300 text-center w-full md:w-fit my-1 border-gray-500"
                handleClickCB={() =>
                  navigate(
                    `/facility/${itemData.facility}/patient/${itemData.patient}/consultation/${itemData.id}/daily-rounds`
                  )
                }
                disableFor="readOnly"
                buttonType="html"
              >
                Add Consultation Updates
              </RoleButton>
            )}
          </div>
        </Grid>
      </CardContent>
    </div>
  );
};
