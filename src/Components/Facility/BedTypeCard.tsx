import React from "react";
import { CapacityModal } from "./models";
import { navigate } from "raviger";
import { BED_TYPES } from "../../Common/constants";

interface BedTypeProps extends CapacityModal {
  facilityId: number;
}

const BedTypeCard = (props: BedTypeProps) => {
  const bed = BED_TYPES.find(i => i.id === props.room_type);
  const roomType = bed ? bed.text : "Unknown";
  return (
    <div className="px-2 py-2 lg:w-1/5 w-full">
      <div className="flex flex-col items-center shadow rounded-lg p-4 h-full justify-between">
        <div className="font-semibold text-sm mt-2">{roomType}</div>
        <div className="text-bold text-xl md:text-3xl mt-2">
          {props.current_capacity} / {props.total_capacity}
        </div>
        <div className="font-bold text-xs mt-2 text-center">
          Currently Occupied / Total Capacity
        </div>
        <div
          className="btn btn-default"
          onClick={() =>
            navigate(`/facility/${props.facilityId}/bed/${props.room_type}`)
          }
        >
          Edit
        </div>
      </div>
    </div>
  );
};

export default BedTypeCard;
