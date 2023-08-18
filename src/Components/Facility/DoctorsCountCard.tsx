import { useState } from "react";
import { DoctorModal } from "./models";
import { DOCTOR_SPECIALIZATION } from "../../Common/constants";
import { useDispatch } from "react-redux";
import { deleteDoctor } from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications";
import { DoctorIcon } from "../TeleIcu/Icons/DoctorIcon";
import { DoctorCapacity } from "./DoctorCapacity";
import DialogModal from "../Common/Dialog";
import ConfirmDialog from "../Common/ConfirmDialog";
import ButtonV2 from "../Common/components/ButtonV2";
import { NonReadOnlyUsers } from "../../Utils/AuthorizeFor";

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
      <div className="flex h-full flex-col rounded-sm border border-[#D2D6DC] shadow-sm">
        <div className="flex flex-1 items-center justify-start gap-3 px-4 py-6">
          <div className={`rounded-full p-4 ${specialization?.desc}`}>
            <DoctorIcon className="h-5 w-5 fill-current text-white" />
          </div>
          <div>
            <div className="text-sm font-medium text-[#808080]">
              {specialization?.text} Doctors
            </div>
            <h2 className="mt-2 text-xl font-bold">{props.count}</h2>
          </div>
        </div>
        <div className="flex justify-end gap-4 border-t border-[#D2D6DC] bg-[#FBF9FB] px-3 py-2">
          <ButtonV2
            variant="secondary"
            ghost
            onClick={() => {
              setSelectedId(props.area || 0);
              setOpen(true);
            }}
            authorizeFor={NonReadOnlyUsers}
          >
            Edit
          </ButtonV2>
          <ButtonV2
            variant="danger"
            ghost
            onClick={() => setOpenDeleteDialog(true)}
            authorizeFor={NonReadOnlyUsers}
          >
            Delete
          </ButtonV2>
        </div>
        <ConfirmDialog
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
