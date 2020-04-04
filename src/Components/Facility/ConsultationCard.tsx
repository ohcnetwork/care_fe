import React from "react";
import {
  Grid,
  Card,
  CardContent,
  IconButton,
  Typography,
  Button
} from "@material-ui/core";
import ArrowForwardIosIcon from "@material-ui/icons/ArrowForwardIos";
import moment from "moment";
import { navigate } from "hookrouter";
import { ConsultationModal } from "./models";

interface ConsultationProps {
  itemData: ConsultationModal;
}

export const ConsultationCard = (props: ConsultationProps) => {
  const { itemData } = props;
  return (
    <div className="block border rounded-lg bg-white shadow h-full cursor-pointer hover:border-primary-500 text-black mt-4">
      <CardContent>
        <Grid container justify="space-between" alignItems="center">
          <Grid item xs={11} container spacing={1}>
            <Grid item xs={8}>
              <Typography>
                <span className="w3-text-grey">Facility:</span>{" "}
                {itemData.facility_name}
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography>
                <span className="w3-text-grey">Patient:</span>{" "}
                {itemData.patient}
              </Typography>
            </Grid>
            <Grid item xs={8}>
              <Typography>
                <span className="w3-text-grey">Suggestion:</span>{" "}
                {itemData.suggestion_text}
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography>
                <span className="w3-text-grey">Admitted:</span>{" "}
                {itemData.admitted ? "Yes" : "No"}
              </Typography>
            </Grid>
            {itemData.existing_medication && (
              <Grid item xs={12}>
                <Typography>
                  <span className="w3-text-grey">Existing Medication:</span>{" "}
                  {itemData.existing_medication}
                </Typography>
              </Grid>
            )}
            {itemData.examination_details && (
              <Grid item xs={12}>
                <Typography>
                  <span className="w3-text-grey">Examination Details:</span>{" "}
                  {itemData.examination_details}
                </Typography>
              </Grid>
            )}
            {itemData.prescribed_medication && (
              <Grid item xs={12}>
                <Typography>
                  <span className="w3-text-grey">Prescribed Medication:</span>{" "}
                  {itemData.prescribed_medication}
                </Typography>
              </Grid>
            )}
            {itemData.admission_date && (
              <Grid item xs={6}>
                <Typography style={{ fontSize: "12px" }}>
                  <span className="w3-text-grey">Admitted on :</span>{" "}
                  {moment(itemData.admission_date).format("lll")}
                </Typography>
              </Grid>
            )}
            {itemData.discharge_date && (
              <Grid item xs={6}>
                <Typography style={{ fontSize: "12px" }}>
                  <span className="w3-text-grey">Discharged on:</span>{" "}
                  {moment(itemData.discharge_date).format("lll")}
                </Typography>
              </Grid>
            )}
          </Grid>
          <div className="mt-4">
            <button className="mr-4 px-4 py-2 shadow border bg-white rounded-md border border-grey-500 whitespace-no-wrap text-sm font-semibold rounded cursor-pointer hover:bg-gray-300 text-center"
              onClick={
                () => navigate(`/facility/${itemData.facility}/patient/${itemData.patient}/consultation/${itemData.id}/daily-rounds`)}>
              Add Daily Rounds
            </button>
            {/*<button className="px-4 py-2 shadow border bg-white rounded-md border border-grey-500 whitespace-no-wrap text-sm font-semibold rounded cursor-pointer hover:bg-gray-300 text-center"*/}
            {/*  onClick={*/}
            {/*    () => navigate(`/facility/${itemData.facility}/patient/${itemData.patient}/consultation/${itemData.id}/daily-rounds-list`)}>*/}
            {/*  View Daily Rounds*/}
            {/*</button>*/}
          </div>
        </Grid>
      </CardContent>
    </div>
  );
};
