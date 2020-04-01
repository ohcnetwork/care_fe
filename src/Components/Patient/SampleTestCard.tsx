import React from "react";
import { Grid, Card, CardContent, Typography, Button } from "@material-ui/core";
import moment from "moment";
import { navigate } from "hookrouter";
import { SampleTestModel } from "./models";
import { patchSample } from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications";
import { useDispatch } from "react-redux";

interface ConsultationProps {
  itemData: SampleTestModel;
}

export const SampleTestCard = (props: any) => {
  const dispatch: any = useDispatch();
  const { itemData } = props;
  const handleApproval = (status: number, sample: any) => {
    const sampleData = {
      id: sample.id,
      status,
      date_of_sample: null,
      date_of_result: null,
      consultation: sample.consultation_id
    };
    let statusName = "";
    if (status === 4) {
      statusName = "SENT_TO_COLLECTON_CENTRE";
    }

    dispatch(patchSample(sample.id, sampleData)).then((resp: any) => {
      if (resp.status === 201 || resp.status === 200) {
        Notification.Success({
          msg: `Request ${statusName}`
        });
        window.location.reload();
      }
    });
  };
  return (
    <div className="block border rounded-lg bg-white shadow h-full cursor-pointer hover:border-primary-500 text-black mt-4">
      <CardContent>
        <Grid container justify="space-between" alignItems="center">
          <Grid item xs={11} container spacing={1}>
            <Grid item xs={6}>
              <Typography>
                <span className="w3-text-grey">Status:</span> {itemData.status}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography>
                <span className="w3-text-grey">Result:</span> {itemData.result}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography>
                <span className="w3-text-grey">Notes:</span> {itemData.notes}
              </Typography>
            </Grid>
            {itemData.date_of_result && (
              <Grid item xs={6}>
                <Typography>
                  <span className="w3-text-grey">Tested on :</span>{" "}
                  {moment(itemData.date_of_result).format("lll")}
                </Typography>
              </Grid>
            )}
            {itemData.date_of_result && (
              <Grid item xs={6}>
                <Typography>
                  <span className="w3-text-grey">Result on:</span>{" "}
                  {moment(itemData.date_of_result).format("lll")}
                </Typography>
              </Grid>
            )}
            {itemData.status === "APPROVED" && (
              <Button
                style={{ color: "green" }}
                variant="outlined"
                onClick={e => handleApproval(4, itemData)}
              >
                Sent to Collection Centre
              </Button>
            )}
          </Grid>
        </Grid>
      </CardContent>
    </div>
  );
};
