import { useEffect, useState } from "react";

import RecordMeta from "@/CAREUI/display/RecordMeta";
import CareIcon from "@/CAREUI/icons/CareIcon";

import ButtonV2 from "@/components/Common/ButtonV2";
import ConfirmDialog from "@/components/Common/ConfirmDialog";
import DialogModal from "@/components/Common/Dialog";
import { BedCapacity } from "@/components/Facility/BedCapacity";

import { NonReadOnlyUsers } from "@/Utils/AuthorizeFor";
import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number>(-1);
  const handleDeleteSubmit = async () => {
    if (room_type) {
      const { res } = await request(routes.deleteCapacityBed, {
        pathParams: {
          facilityId: facilityId ?? "",
          bed_id: room_type.toString(),
        },
      });
      if (res?.status == 204) {
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

  useEffect(() => {
    if (isRefreshing) {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  }, [isRefreshing]);

  const usedPercent = total ? Math.round((used / total) * 100) : 0;

  return (
    <div
      className={`${
        facilityId
          ? "border border-slate-200 bg-white"
          : "border border-primary-300 bg-green-50"
      } flex h-full flex-col justify-between rounded-xl p-4 opacity-100 shadow-sm`}
    >
      <header className="flex items-start justify-between">
        <div className="text-md font-medium not-italic leading-[normal] text-[#453C52]">
          {label}
        </div>
        <span className="flex items-center justify-center rounded py-0 text-sm text-secondary-500">
          {usedPercent}%
        </span>
      </header>
      <div className="mt-4 text-xl font-extrabold text-black">
        {used} / {total}
      </div>
      <div className="mt-3 flex flex-col items-stretch justify-center rounded-md">
        <div className="flex h-3 w-full rounded-md bg-secondary-300">
          <div
            className="flex h-3 shrink-0 flex-col rounded-md bg-blue-600"
            style={{ width: `${usedPercent}%` }}
          ></div>
        </div>

        <div className="mt-3 text-sm tracking-normal text-zinc-700">
          {" "}
          Currently Occupied / Total Capacity{" "}
        </div>
        {facilityId ? (
          <div className="mt-3 flex w-full flex-col items-start justify-between gap-5 sm:flex-row">
            <div className="mt-4 text-xs italic text-secondary-500">
              {lastUpdated && (
                <RecordMeta
                  className="py-0 text-xs font-normal text-secondary-600"
                  prefix={"Last updated;"}
                  time={lastUpdated}
                />
              )}
            </div>
            <div className="flex items-stretch justify-between gap-4 self-stretch">
              <ButtonV2
                id="edit-facility-bedcapacity"
                onClick={() => {
                  setSelectedId(room_type || 0);
                  setOpen(true);
                }}
                authorizeFor={NonReadOnlyUsers}
                className="tooltip bg-opacity/20 flex aspect-square h-7 w-7 flex-col items-center justify-center rounded bg-secondary-300 px-4 py-0"
                variant="secondary"
                ghost
              >
                <CareIcon icon="l-edit-alt" className="h-5 w-5 text-black" />
                <span className="tooltip-text tooltip-bottom">Edit</span>
              </ButtonV2>

              <ButtonV2
                id="delete-facility-bedcapacity"
                onClick={() => setOpenDeleteDialog(true)}
                authorizeFor={NonReadOnlyUsers}
                className="tooltip bg-opacity/10 flex aspect-square h-7 w-7 flex-col items-center justify-center rounded bg-red-100 px-4 py-0 hover:bg-red-200"
                variant="secondary"
                ghost
              >
                <CareIcon icon="l-trash-alt" className="h-5 w-5 text-red-600" />
                <span className="tooltip-text tooltip-bottom">Delete</span>
              </ButtonV2>
            </div>
          </div>
        ) : (
          <div className="h-8"></div>
        )}
      </div>
      <ConfirmDialog
        show={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        title={`Delete ${label}?`}
        description="You will not be able to access this bed type later."
        action="Delete"
        variant="danger"
        onConfirm={handleDeleteSubmit}
      />
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
