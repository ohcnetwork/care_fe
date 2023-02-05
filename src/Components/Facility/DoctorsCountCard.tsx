import React, { useState } from "react";
import { DoctorModal } from "./models";
import { DOCTOR_SPECIALIZATION } from "../../Common/constants";
import { RoleButton } from "../Common/RoleButton";
import { useDispatch } from "react-redux";
import { deleteDoctor } from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications";
import { DoctorIcon } from "../TeleIcu/Icons/DoctorIcon";
import { DoctorCapacity } from "./DoctorCapacity";
import DialogModal from "../Common/Dialog";
import ConfirmDialogV2 from "../Common/ConfirmDialogV2";

interface DoctorsCountProps extends DoctorModal {
  facilityId: string;
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
        <ConfirmDialogV2
          show={openDeleteDialog}
          onClose={handleDeleteClose}
          title={`Delete ${specialization?.text} doctors`}
          description="You will not be able to access this docter specialization type later."
          action="Delete"
          variant="danger"
          onConfirm={handleDeleteSubmit}
        />
      </div>
      {open && (
        <DialogModal
          show={open}
          onClose={() => setOpen(false)}
          title="Update Doctor Capacity"
        >
          <DoctorCapacity
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
        </DialogModal>
      )}
    </div>
  );
};

export default DoctorsCountCard;
