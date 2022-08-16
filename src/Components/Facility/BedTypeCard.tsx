import React, { useState } from "react";
import { CapacityModal } from "./models";
import { navigate } from "raviger";
import { BED_TYPES } from "../../Common/constants";
import moment from "moment";
import { RoleButton } from "../Common/RoleButton";
import { useDispatch } from "react-redux";
import * as Notification from "../../Utils/Notifications";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@material-ui/core";
import { deleteCapacity } from "../../Redux/actions";

interface BedTypeProps extends CapacityModal {
  facilityId: number;
  removeBedType: (bedTypeId: number | undefined) => void;
}

const BedTypeCard = (props: BedTypeProps) => {
  const bed = BED_TYPES.find((i) => i.id === props.room_type);
  const roomType = bed ? bed.text : "Unknown";

  const dispatchAction: any = useDispatch();
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const handleDeleteSubmit = async () => {
    if (props.room_type) {
      const res = await dispatchAction(
        deleteCapacity({
          facilityId: props.facilityId,
          bed_id: props.room_type,
        })
      );
      if (res && res.status == 204) {
        Notification.Success({
          msg: "Bed type deleted successfully",
        });
        props.removeBedType(props.id);
      }
    }
  };

  const handleDeleteClose = () => {
    setOpenDeleteDialog(false);
  };

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
        <div className="flex justify-evenly w-full gap-2 mt-2 pt-2 border border-t-gray-300">
          <RoleButton
            className="btn btn-default w-1/2"
            handleClickCB={() =>
              navigate(`/facility/${props.facilityId}/bed/${props.room_type}`)
            }
            disableFor="readOnly"
            buttonType="html"
          >
            Edit
          </RoleButton>
          <RoleButton
            className="btn btn-danger w-1/2"
            handleClickCB={() => setOpenDeleteDialog(true)}
            disableFor="readOnly"
            buttonType="html"
          >
            Delete
          </RoleButton>
        </div>
        <div className="text-xs text-gray-600 mt-2">
          <i className="fas fa-history text-sm pr-2"></i>
          {props.modified_date && moment(props.modified_date).fromNow()}
        </div>
      </div>

      <Dialog
        maxWidth={"md"}
        open={openDeleteDialog}
        onClose={handleDeleteClose}
      >
        <DialogTitle className="flex justify-center bg-primary-100">
          Are you sure you want to delete {roomType} type?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            You will not be able to access this bed type later.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <button onClick={handleDeleteClose} className="btn btn-primary">
            Cancel
          </button>
          <button
            onClick={handleDeleteSubmit}
            id="facility-delete-confirm"
            className="btn btn-danger"
          >
            Delete
          </button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default BedTypeCard;
