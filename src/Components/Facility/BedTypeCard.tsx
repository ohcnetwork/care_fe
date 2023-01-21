import React, { useState } from "react";
import * as Notification from "../../Utils/Notifications";
import { animated, config, useSpring } from "@react-spring/web";
import { useDispatch } from "react-redux";
import {
  DialogContentText,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@material-ui/core";
import { deleteCapacity } from "../../Redux/actions";
import { BedCapacity } from "./BedCapacity";
import DialogModal from "../Common/Dialog";
import ButtonV2 from "../Common/components/ButtonV2";
import { NonReadOnlyUsers } from "../../Utils/AuthorizeFor";
import CareIcon from "../../CAREUI/icons/CareIcon";
import RelativeTime from "../../CAREUI/display/RelativeTime";

interface BedTypeCardProps {
  facilityId?: string;
  bedCapacityId?: number;
  room_type?: number;
  label: string;
  used: number;
  total: number;
  lastUpdated?: string;
  removeBedType?: (bedTypeId: number | undefined) => void;
  handleUpdate: () => void;
}

const CIRCLE_PATH =
  "M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831";

export const BedTypeCard: React.FC<BedTypeCardProps> = ({
  facilityId,
  bedCapacityId,
  room_type,
  label,
  used,
  total,
  lastUpdated,
  removeBedType,
  handleUpdate,
}) => {
  const dispatchAction: any = useDispatch();
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number>(-1);
  const handleDeleteSubmit = async () => {
    if (room_type) {
      const res = await dispatchAction(
        deleteCapacity({
          facilityId: facilityId,
          bed_id: room_type,
        })
      );
      if (res && res.status == 204) {
        Notification.Success({
          msg: "Bed type deleted successfully",
        });
        setOpenDeleteDialog(false);
        if (removeBedType) {
          removeBedType(bedCapacityId);
        }
      }
    }
  };

  const handleDeleteClose = () => {
    setOpenDeleteDialog(false);
  };

  const _p = total ? Math.round((used / total) * 100) : 0;

  const { occupied, totalCount, progress, innerProgress } = useSpring({
    from: { occupied: 0, totalCount: 0, progress: "0, 100", innerProgress: 0 },
    to: {
      occupied: used,
      totalCount: total,
      progress: `${Number.isNaN(_p) ? 0 : _p}, 100`,
      innerProgress: Number.isNaN(_p) ? 0 : _p,
    },
    delay: 0,
    config: config.slow,
  });

  return (
    <div
      className={`${
        facilityId
          ? "border border-slate-200 bg-white"
          : "border border-primary-500 bg-primary-100"
      } opacity-100 shadow-sm rounded-xl flex flex-col justify-between h-full`}
      style={{ padding: "clamp(0.75rem,5vw,1.5rem)" }}
    >
      <div className={"opacity-100"}>
        <p
          className={`${
            facilityId ? "font-medium" : "font-bold"
          } text-slate-900 text-xl mb-2 md:mb-4 text-center h-12`}
        >
          {label}
        </p>

        <div className="relative">
          <div className={"opacity-100"}>
            <div className="flex items-center justify-center h-2/3">
              <div className="relative flex content-center justify-center m-2 w-4/5">
                <svg viewBox="0 0 38 36" className="w-full">
                  <path
                    className={`${
                      facilityId ? "text-slate-200" : "text-white"
                    } stroke-current stroke-[3px]`}
                    fill="none"
                    d={CIRCLE_PATH}
                  />
                  <animated.path
                    className="text-primary-500 stroke-current stroke-[2px]"
                    fill="none"
                    strokeDasharray={progress}
                    d={CIRCLE_PATH}
                  />
                </svg>
                <div className="absolute inline-flex flex-col items-center justify-center self-center w-3/5 text-center text-sm xl:text-lg">
                  <div className="space-x-1">
                    <animated.span className="text-center text-3xl text-slate-700 font-semibold">
                      {innerProgress.to(
                        (x: number) => `${Math.round(x) || 0}%`
                      )}
                    </animated.span>
                  </div>
                  {
                    <div className="mt-2 text-center">
                      <span
                        className={"text-xl font-medium text-green-600"}
                      ></span>
                    </div>
                  }
                </div>
              </div>
            </div>
            <div className="flex flex-col h-1/3 lg:flex-row gap-4 text-center mt-4 justify-center items-center">
              <div className="w-1/2">
                <p className="text-slate-500 font-medium text-lg xl:text-xl">
                  Used:
                  <animated.span className="ml-2 text-slate-700 font-semibold text-lg  xl:text-xl">
                    {occupied.to((x: number) => Math.round(x))}
                  </animated.span>
                </p>
              </div>
              <div className="w-1/2">
                <p className="text-slate-500 font-medium text-lg xl:text-xl">
                  Total:
                  <animated.span className="ml-2 text-slate-700 text-lg font-semibold xl:text-xl">
                    {totalCount.to((x: number) => Math.round(x))}
                  </animated.span>
                </p>
              </div>
            </div>
            {facilityId && (
              <div className="flex items-center justify-between gap-2 pt-6">
                {lastUpdated && (
                  <div className="flex gap-1 text-xs text-gray-600 font-normal">
                    <span>Last updated:</span>
                    <RelativeTime time={lastUpdated} />
                  </div>
                )}
                <div className="flex justify-end gap-2 relative">
                  <ButtonV2
                    onClick={() => {
                      setSelectedId(room_type || 0);
                      setOpen(true);
                    }}
                    authorizeFor={NonReadOnlyUsers}
                    className="tooltip p-2"
                    variant="secondary"
                    ghost
                  >
                    <CareIcon className="care-l-edit-alt" />
                    <span className="tooltip-text tooltip-bottom">Edit</span>
                  </ButtonV2>
                  <ButtonV2
                    onClick={() => setOpenDeleteDialog(true)}
                    authorizeFor={NonReadOnlyUsers}
                    className="tooltip p-2"
                    variant="danger"
                    ghost
                  >
                    <CareIcon className="care-l-trash-alt" />
                    <span className="tooltip-text tooltip-bottom">Delete</span>
                  </ButtonV2>
                </div>
              </div>
            )}
          </div>
          <p
            className={
              "font-bold text-xl text-slate-500 text-center my-8 w-full absolute top-1/4 left-1/2 -translate-x-1/2 opacity-0 pointer-events-none"
            }
          >
            No Data Available
          </p>
        </div>
      </div>
      <Dialog
        maxWidth={"md"}
        open={openDeleteDialog}
        onClose={handleDeleteClose}
      >
        <DialogTitle className="flex justify-center bg-primary-100">
          Are you sure you want to delete {label} type?
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
      {open && (
        <DialogModal
          show={open}
          onClose={() => setOpen(false)}
          title="Update Bed Capacity"
          className="max-w-lg md:min-w-[650px]"
        >
          <BedCapacity
            facilityId={facilityId || ""}
            handleClose={() => {
              setOpen(false);
            }}
            handleUpdate={() => {
              handleUpdate();
              setOpen(false);
            }}
            id={selectedId}
          />
        </DialogModal>
      )}
    </div>
  );
};

export default BedTypeCard;
