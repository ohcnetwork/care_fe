import React from "react";
import { navigate } from "hookrouter";
import { DoctorModal } from "./models";
import { DOCTOR_SPECIALIZATION } from "../../Common/constants";

interface DoctorsCountProps extends DoctorModal {
  facilityId: number;
}

const DoctorsCountCard = (props: DoctorsCountProps) => {
  const specialization = DOCTOR_SPECIALIZATION.find(i => i.id === props.area);
  const area = specialization ? specialization.text : "Unknown";
  return (
    <div className="px-2 py-2 md:w-1/5 w-full">
      <div className="flex flex-col items-center shadow rounded-lg p-4 h-full justify-between">
        <div className="text-bold text-3xl mt-2">{props.count}</div>
        <div className="font-semibold text-md mt-2">{area} Doctors</div>
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
