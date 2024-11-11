import { useState } from "react";

import ButtonV2 from "@/components/Common/ButtonV2";
import ConfirmDialog from "@/components/Common/ConfirmDialog";
import DialogModal from "@/components/Common/Dialog";
import { StaffCapacity } from "@/components/Facility/StaffCapacity";
import { DoctorModal } from "@/components/Facility/models";
import { DoctorIcon } from "@/components/TeleIcu/Icons/DoctorIcon";

import { DOCTOR_SPECIALIZATION } from "@/common/constants";

import { NonReadOnlyUsers } from "@/Utils/AuthorizeFor";
import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";

interface DoctorsCountProps extends DoctorModal {
  facilityId: string;
  removeDoctor: (doctorId: number | undefined) => void;
  handleUpdate: () => void;
}

const StaffCountCard = (props: DoctorsCountProps) => {
  const specialization = DOCTOR_SPECIALIZATION.find((i) => i.id === props.area);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number>(-1);

  const handleDeleteSubmit = async () => {
    if (!props.area) return;

    const { res } = await request(routes.deleteDoctor, {
      pathParams: { facilityId: props.facilityId, area: `${props.area}` },
    });

    if (res?.ok) {
      props.removeDoctor(props.id);
      Notification.Success({
        msg: "Staff specialization type deleted successfully",
      });
    }
  };

  const handleDeleteClose = () => {
    setOpenDeleteDialog(false);
  };

  return (
    <div className="w-full">
      <div className="flex h-full flex-col rounded-sm border border-[#D2D6DC] shadow-sm">
        <div className="flex flex-1 items-center justify-start gap-3 px-4 py-6">
          <div className="rounded-full bg-yellow-500 p-4">
            <DoctorIcon className="h-5 w-5 fill-current text-white" />
          </div>
          <div>
            <div className="text-sm font-medium text-[#808080]">
              {specialization?.text}
            </div>
            <h2 className="mt-2 text-xl font-bold">{props.count}</h2>
          </div>
        </div>
        <div className="flex justify-end gap-4 border-t border-[#D2D6DC] bg-[#FBF9FB] px-3 py-2">
          <ButtonV2
            id="edit-facility-doctorcapacity"
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
            id="delete-facility-doctorcapacity"
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
          title={`Delete ${specialization?.text}`}
          description="You will not be able to access this specialization type later."
          action="Delete"
          variant="danger"
          onConfirm={handleDeleteSubmit}
        />
      </div>
      {open && (
        <DialogModal
          show={open}
          onClose={() => setOpen(false)}
          title="Update Staff Capacity"
        >
          <StaffCapacity
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

export default StaffCountCard;
