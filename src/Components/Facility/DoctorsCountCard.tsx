import React, { useState } from "react";
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
import { DoctorIcon } from "../TeleIcu/Icons/DoctorIcon";
import { DoctorCapacityModal } from "./DoctorCapacityModal";

interface DoctorsCountProps extends DoctorModal {
  facilityId: number;
  removeDoctor: (doctorId: number | undefined) => void;
  handleUpdate: () => void;
}

const DoctorsCountCard = (props: DoctorsCountProps) => {
  const specialization = DOCTOR_SPECIALIZATION.find((i) => i.id === props.area);
  const dispatchAction: any = useDispatch();
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number>(-1);

  const handleDeleteSubmit = async () => {
    if (props.area) {
      const res = await dispatchAction(
        deleteDoctor(props.area, { facilityId: props.facilityId })
      );
      if (res?.status === 204) {
        Notification.Success({
          msg: "Doctor specialization type deleted successfully",
        });
        props.removeDoctor(props.id);
      } else {
        Notification.Error({
          msg:
            "Error while deleting Doctor specialization: " +
            (res?.data?.detail || ""),
        });
      }
    }
  };

  const handleDeleteClose = () => {
    setOpenDeleteDialog(false);
  };

  return (
    <div className="w-full">
      <div className="shadow-sm rounded-sm h-full border border-[#D2D6DC] flex flex-col">
        <div className="flex justify-start items-center gap-3 px-4 py-6 flex-1">
          <div className={`rounded-full p-4 ${specialization?.desc}`}>
            <DoctorIcon className="fill-current text-white w-5 h-5" />
          </div>
          <div>
            <div className="font-medium text-sm text-[#808080]">
              {specialization?.text} Doctors
            </div>
            <h2 className="font-bold text-xl mt-2">{props.count}</h2>
          </div>
        </div>
        <div className="bg-[#FBF9FB] py-2 px-3 flex justify-end gap-8 border-t border-[#D2D6DC]">
          <RoleButton
            className="font-medium"
            handleClickCB={() => {
              setSelectedId(props.area || 0);
              setOpen(true);
            }}
            disableFor="readOnly"
            buttonType="html"
          >
            Edit
          </RoleButton>
          <RoleButton
            className="font-medium text-[#C81E1E]"
            handleClickCB={() => setOpenDeleteDialog(true)}
            disableFor="readOnly"
            buttonType="html"
          >
            Delete
          </RoleButton>
        </div>
        <Dialog
          maxWidth={"md"}
          open={openDeleteDialog}
          onClose={handleDeleteClose}
        >
          <DialogTitle className="flex justify-center bg-primary-100">
            Are you sure you want to delete {specialization?.text} doctors?
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
      {open && (
        <DoctorCapacityModal
          show={open}
          facilityId={props.facilityId}
          handleClose={() => {
            setOpen(false);
          }}
          handleUpdate={() => {
            props.handleUpdate();
            setOpen(false);
          }}
          id={selectedId}
        />
      )}
    </div>
  );
};

export default DoctorsCountCard;
