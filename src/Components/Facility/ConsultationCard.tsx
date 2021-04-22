import { CardContent, Grid, Typography } from "@material-ui/core";
import { navigate } from "raviger";
import moment from "moment";
import React from "react";
import { ConsultationModel } from "./models";

interface ConsultationProps {
  itemData: ConsultationModel;
  isLastConsultation?: boolean;
}

export const ConsultationCard = (props: ConsultationProps) => {
  const { itemData, isLastConsultation } = props;
  return (
    <div className="block border rounded-lg bg-white shadow h-full cursor-pointer hover:border-primary-500 text-black mt-4">
      <CardContent>
        <Grid container justify="space-between" alignItems="center">
          <Grid item xs={12} container spacing={1}>
            <Grid item xs={7}>
              <Typography>
                <span className="text-gray-700">Facility: </span>
                {itemData.facility_name}            {
                  itemData.is_telemedicine &&
                  <span className="ml-2">(Telemedicine)</span>
                }
              </Typography>
            </Grid>
            <Grid item xs={5}>
              <Typography>
                <span className="text-gray-700">Updated on: </span>
                {itemData.created_date
                  ? moment(itemData.created_date).format("lll")
                  : "-"}
              </Typography>
            </Grid>
            <Grid item xs={7}>
              <Typography className="capitalize">
                <span className="text-gray-700">Suggestion: </span>
                {itemData.suggestion_text?.toLocaleLowerCase()}
              </Typography>
            </Grid>
            <Grid item xs={5}>
              <Typography>
                <span className="text-gray-700">Admitted: </span>
                {itemData.admitted ? "Yes" : "No"}
              </Typography>
            </Grid>
            {itemData.admission_date && (
              <Grid item xs={7}>
                <Typography>
                  <span className="text-gray-700">Admitted on: </span>
                  {moment(itemData.admission_date).format("lll")}
                </Typography>
              </Grid>
            )}
            {itemData.discharge_date && (
              <Grid item xs={5}>
                <Typography>
                  <span className="text-gray-700">Discharged on: </span>
                  {moment(itemData.discharge_date).format("lll")}
                </Typography>
              </Grid>
            )}
          </Grid>

          <div className="mt-4 flex flex-wrap justify-between w-full">
            <button
              className="px-4 py-2 shadow border bg-white rounded-md border border-grey-500 whitespace-no-wrap text-sm font-semibold rounded cursor-pointer hover:bg-gray-300 text-center"
              onClick={() =>
                navigate(
                  `/facility/${itemData.facility}/patient/${itemData.patient}/consultation/${itemData.id}/`
                )
              }
            >
              View Consultation / Consultation Updates
            </button>
            <button
              className="px-4 py-2 shadow border bg-white rounded-md border border-grey-500 whitespace-no-wrap text-sm font-semibold rounded cursor-pointer hover:bg-gray-300 text-center"
              onClick={() =>
                navigate(
                  `/facility/${itemData.facility}/patient/${itemData.patient}/consultation/${itemData.id}/files/`
                )
              }
            >
              View / Upload Consultation Files
            </button>
            {/* {isLastConsultation && (
              <button
                className="mr-1 px-4 py-2 shadow border bg-white rounded-md border border-grey-500 whitespace-no-wrap text-sm font-semibold rounded cursor-pointer hover:bg-gray-300 text-center"
                onClick={() =>
                  navigate(
                    `/facility/${itemData.facility}/patient/${itemData.patient}/consultation/${itemData.id}/update`
                  )
                }
              >
                Update Consultation Details
              </button>
            )} */}
            {isLastConsultation && (
              <button
                className="mr-4 px-4 py-2 shadow border bg-white rounded-md border border-grey-500 whitespace-no-wrap text-sm font-semibold rounded cursor-pointer hover:bg-gray-300 text-center"
                onClick={() =>
                  navigate(
                    `/facility/${itemData.facility}/patient/${itemData.patient}/consultation/${itemData.id}/daily-rounds`
                  )
                }
              >
                Add Consultation Updates
              </button>
            )}
          </div>
        </Grid>
      </CardContent>
    </div>
  );
};
