import React from "react";
import { CapacityModal } from "./models";
import { navigate } from "hookrouter";
import { BED_TYPES } from "../../Common/constants";

interface BedTypeProps extends CapacityModal {
  facilityId: number;
}

const BedTypeCard = (props: BedTypeProps) => {
  const bed = BED_TYPES.find(i => i.id === props.room_type);
  const roomType = bed ? bed.text : "Unknown";
  return (
    <div className="px-2 py-2 md:w-1/5 w-full">
      <div className="flex flex-col items-center shadow rounded-lg p-4 h-full justify-between">
        <div className="font-semibold text-sm mt-2">{roomType}</div>
        <div className="text-bold text-xl md:text-3xl mt-2">
          {props.current_capacity} / {props.total_capacity}
        </div>
        <div className="font-bold text-xs mt-2 text-center">
          Currently Occupied / Total Capacity
        </div>
        <div
          className="py-2 mt-2 px-6 bg-white rounded-md border border-grey-500 inline-flex items-center justify-center whitespace-no-wrap text-sm font-semibold rounded cursor-pointer hover:bg-gray-300"
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
