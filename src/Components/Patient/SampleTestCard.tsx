import { Button, CardContent, Grid, Typography } from "@material-ui/core";
import { navigate } from "hookrouter";
import moment from "moment";
import React from "react";
import { SampleTestModel } from "./models";

interface SampleDetailsProps {
  facilityId: number;
  patientId: number;
  itemData: SampleTestModel;
  handleApproval: (status: number, sample: SampleTestModel) => void;
}

export const SampleTestCard = (props: SampleDetailsProps) => {
  const { itemData, handleApproval, facilityId, patientId } = props;

  return (
    <div onClick={e => navigate(`/facility/${facilityId}/patient/${patientId}/sample/${itemData.id}`)} className="block border rounded-lg bg-white shadow h-full cursor-pointer hover:border-primary-500 text-black mt-4">
      <CardContent>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <div>
            <span className="w3-text-grey">Status: </span>{itemData.status}
          </div>
          <div>
            <span className="w3-text-grey">Result: </span>{itemData.result}
          </div>
          <div className="md:col-span-2">
            <span className="w3-text-grey">Sample Type: </span>
            {itemData.sample_type !== 'OTHER TYPE' ? itemData.sample_type : itemData.sample_type_other}
          </div>
          {itemData.fast_track && <div className="md:col-span-2">
            <span className="w3-text-grey">Fast-Track:</span> {itemData.fast_track}
          </div>}
          {itemData.date_of_result && (
            <div>
              <span className="w3-text-grey">Tested on :</span>{" "}
              {moment(itemData.date_of_result).format("lll")}
            </div>
          )}
          {itemData.date_of_result && (
            <div>
              <span className="w3-text-grey">Result on:</span>{" "}
              {moment(itemData.date_of_result).format("lll")}
            </div>
          )}
        </div>
        {itemData.status === "APPROVED" && (<div className="mt-4">
          <Button
            style={{ color: "green" }}
            variant="outlined"
            onClick={e => { e.stopPropagation(); handleApproval(4, itemData) }}
          >Sent to Collection Centre</Button>
        </div>)}
      </CardContent>
    </div>
  );
};
