import React from "react";
import { Grid, Typography, Button } from "@material-ui/core";
import { makeStyles } from "@material-ui/styles";
import { navigate } from "hookrouter";
import { DoctorModal } from "./models";
import { DOCTOR_SPECIALIZATION } from "../../Common/constants";

interface DoctorsCountProps extends DoctorModal {
  facilityId: number;
}

const useStyles = makeStyles({
  countText: {
    fontSize: "2.25rem"
  }
});

const DoctorsCountCard = (props: DoctorsCountProps) => {
  const classes = useStyles();
  const specialization = DOCTOR_SPECIALIZATION.find(i => i.id === props.area);
  const area = specialization ? specialization.text : "Unknown";
  return (
    <div className="px-2 py-2 md:w-1/2 w-full">
      <div className="flex flex-col items-center shadow rounded-lg p-4">
        <div className="text-bold text-6xl mt-2">{props.count}</div>
        <div className="font-semibold text-xl mt-2">{area} Doctors</div>
        <div
          className="py-2 mt-2 px-6 bg-white rounded-md border border-grey-500 inline-flex items-center justify-center whitespace-no-wrap text-sm font-semibold rounded cursor-pointer hover:bg-gray-300"
          onClick={() =>
            navigate(`/facility/${props.facilityId}/doctor/${props.area}`)
          }
        >
          Edit
        </div>
      </div>
    </div>
  );
};

export default DoctorsCountCard;
