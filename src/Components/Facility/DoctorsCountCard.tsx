import React, { useEffect, useState } from "react";
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
  removeDoctor: (doctorId: number | undefined) => void;
}

const DoctorsCountCard = (props: DoctorsCountProps) => {
  const specialization = DOCTOR_SPECIALIZATION.find((i) => i.id === props.area);
  const dispatchAction: any = useDispatch();
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [color, setColor] = useState("#000000");
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

  const area = specialization ? specialization.text : "Unknown";

  useEffect(() => {
    if (area === "General Medicine") {
      setColor("#D79B00");
    } else if (area === "Critical Care") {
      setColor("#C81E1E");
    } else if (area === "Paediatrics") {
      setColor("#453C52");
    } else if (area === "Other Speciality") {
      setColor("#03543F");
    } else if (area === "Pulmonology") {
      setColor("#000080");
    }
  }, [color, area]);

  return (
    <div className="w-full">
      <div className="shadow-sm rounded-sm h-full border border-[#D2D6DC] flex flex-col">
        <div className="flex justify-start items-center gap-3 px-4 py-6 flex-1">
          <div className="rounded-full p-4" style={{ background: `${color}` }}>
            <svg
              className="w-5 h-5"
              viewBox="0 0 14 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7 8C9.20938 8 11 6.20937 11 4C11 1.79063 9.20938 0 7 0C4.79063 0 3 1.79063 3 4C3 6.20937 4.79063 8 7 8ZM4 9.725C1.6875 10.4031 0 12.5406 0 15.0719C0 15.5844 0.415625 16 0.928125 16H13.0719C13.5844 16 14 15.5844 14 15.0719C14 12.5406 12.3125 10.4031 10 9.725V11.3125C10.8625 11.5344 11.5 12.3188 11.5 13.25V14.5C11.5 14.775 11.275 15 11 15H10.5C10.225 15 10 14.775 10 14.5C10 14.225 10.225 14 10.5 14V13.25C10.5 12.6969 10.0531 12.25 9.5 12.25C8.94687 12.25 8.5 12.6969 8.5 13.25V14C8.775 14 9 14.225 9 14.5C9 14.775 8.775 15 8.5 15H8C7.725 15 7.5 14.775 7.5 14.5V13.25C7.5 12.3188 8.1375 11.5344 9 11.3125V9.52812C8.8125 9.50937 8.62188 9.5 8.42813 9.5H5.57188C5.37813 9.5 5.1875 9.50937 5 9.52812V11.5719C5.72188 11.7875 6.25 12.4563 6.25 13.25C6.25 14.2156 5.46562 15 4.5 15C3.53437 15 2.75 14.2156 2.75 13.25C2.75 12.4563 3.27813 11.7875 4 11.5719V9.725ZM4.5 14C4.91563 14 5.25 13.6656 5.25 13.25C5.25 12.8344 4.91563 12.5 4.5 12.5C4.08437 12.5 3.75 12.8344 3.75 13.25C3.75 13.6656 4.08437 14 4.5 14Z"
                fill="white"
              />
            </svg>
          </div>
          <div>
            <div className="font-medium text-sm text-[#808080]">
              {area} Doctors
            </div>
            <h2 className="font-bold text-xl mt-2">{props.count}</h2>
          </div>
        </div>
        <div className="bg-[#FBF9FB] py-2 px-3 flex justify-end gap-8 border-t border-[#D2D6DC]">
          <RoleButton
            className="font-medium"
            handleClickCB={() =>
              navigate(`/facility/${props.facilityId}/doctor/${props.area}`)
            }
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
        {/* <div className="text-bold text-3xl mt-2">{props.count}</div>
        <div className="font-semibold text-md mt-2 text-center">
          {area} Doctors
        </div>

        <div className="flex justify-evenly w-full gap-2 mt-2 pt-2 border border-t-gray-300">
          <RoleButton
            className="btn btn-default w-1/2"
            handleClickCB={() =>
              navigate(`/facility/${props.facilityId}/doctor/${props.area}`)
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
        </div> */}

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
