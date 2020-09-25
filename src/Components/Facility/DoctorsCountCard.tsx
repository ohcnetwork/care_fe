import React from "react";
import { navigate } from "raviger";
import { DoctorModal } from "./models";
import { DOCTOR_SPECIALIZATION } from "../../Common/constants";

interface DoctorsCountProps extends DoctorModal {
  facilityId: number;
}

const DoctorsCountCard = (props: DoctorsCountProps) => {
  const specialization = DOCTOR_SPECIALIZATION.find(i => i.id === props.area);
  const area = specialization ? specialization.text : "Unknown";
  return (
    <div className="px-2 py-2 lg:w-1/5 w-full">
      <div className="flex flex-col items-center shadow rounded-lg p-4 h-full justify-between">
        <div className="text-bold text-3xl mt-2">{props.count}</div>
        <div className="font-semibold text-md mt-2">{area} Doctors</div>
        <div
          className="btn btn-default"
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
