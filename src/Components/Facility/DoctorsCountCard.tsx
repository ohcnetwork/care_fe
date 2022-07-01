import React, { useState } from "react";
import { navigate } from "raviger";
import { DoctorModal } from "./models";
import { DOCTOR_SPECIALIZATION } from "../../Common/constants";
import { RoleButton } from "../Common/RoleButton";
import { useDispatch } from "react-redux";
import { deleteDoctor } from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@material-ui/core";

interface DoctorsCountProps extends DoctorModal {
  facilityId: number;
}

const DoctorsCountCard = (props: DoctorsCountProps) => {
  const specialization = DOCTOR_SPECIALIZATION.find((i) => i.id === props.area);
  const dispatchAction: any = useDispatch();
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const handleDeleteSubmit = async () => {
    if (props.area) {
      const res = await dispatchAction(
        deleteDoctor(props.area, { facilityId: props.facilityId })
      );
      if (res && res.status == 204) {
        Notification.Success({
          msg: "Doctor specialization type deleted successfully",
        });
        setDeleted(true);
      }
    }
  };

  const handleDeleteClose = () => {
    setOpenDeleteDialog(false);
  };

  const area = specialization ? specialization.text : "Unknown";

  if (deleted) {
    return null;
  }
  return (
    <div className="px-2 py-2 lg:w-1/5 w-full">
      <div className="flex flex-col items-center shadow rounded-lg p-4 h-full justify-between">
        <div className="text-bold text-3xl mt-2">{props.count}</div>
        <div className="font-semibold text-md mt-2">{area} Doctors</div>

        <RoleButton
          className="btn btn-default w-full my-2"
          handleClickCB={() =>
            navigate(`/facility/${props.facilityId}/doctor/${props.area}`)
          }
          disableFor="readOnly"
          buttonType="html"
        >
          Edit
        </RoleButton>
        <RoleButton
          className="btn btn-danger w-full my-2"
          handleClickCB={() => setOpenDeleteDialog(true)}
          disableFor="readOnly"
          buttonType="html"
        >
          Delete
        </RoleButton>

        <Dialog
          maxWidth={"md"}
          open={openDeleteDialog}
          onClose={handleDeleteClose}
        >
          <DialogTitle className="flex justify-center bg-primary-100">
            Are you sure you want to delete {area} doctors?
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              You will not be able to access this docter specialization type
              later.
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
    </div>
  );
};

export default DoctorsCountCard;
