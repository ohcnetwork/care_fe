import { useState } from "react";
import * as Notification from "../../Utils/Notifications";
import { animated, config, useSpring } from "@react-spring/web";
import { useDispatch } from "react-redux";
import { deleteCapacity } from "../../Redux/actions";
import { BedCapacity } from "./BedCapacity";
import DialogModal from "../Common/Dialog";
import ButtonV2 from "../Common/components/ButtonV2";
import { NonReadOnlyUsers } from "../../Utils/AuthorizeFor";
import CareIcon from "../../CAREUI/icons/CareIcon";
import RecordMeta from "../../CAREUI/display/RecordMeta";
import ConfirmDialog from "../Common/ConfirmDialog";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
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
      } flex h-full flex-col justify-between rounded-xl opacity-100 shadow-sm`}
      style={{ padding: "clamp(0.75rem,5vw,1.5rem)" }}
    >
      <div className={"opacity-100"}>
        <p
          className={`${
            facilityId ? "font-medium" : "font-bold"
          } mb-2 text-center text-xl text-slate-900 md:mb-4`}
        >
          {label}
        </p>

        <div className="relative">
          <div className={"opacity-100"}>
            <div className="flex h-2/3 items-center justify-center">
              <div className="relative m-2 flex w-4/5 content-center justify-center">
                <svg viewBox="0 0 38 36" className="w-full">
                  <path
                    className={`${
                      facilityId ? "text-slate-200" : "text-white"
                    } stroke-current stroke-[3px]`}
                    fill="none"
                    d={CIRCLE_PATH}
                  />
                  <animated.path
                    className="stroke-current stroke-[2px] text-primary-500"
                    fill="none"
                    strokeDasharray={progress}
                    d={CIRCLE_PATH}
                  />
                </svg>
                <div className="absolute inline-flex w-3/5 flex-col items-center justify-center self-center text-center text-sm xl:text-lg">
                  <div className="space-x-1">
                    <animated.span className="text-center text-3xl font-semibold text-slate-700">
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
            <div className="mt-4 flex h-1/3 flex-col items-center justify-center gap-4 text-center lg:flex-row">
              <div className="overflow-x-auto">
                <p className="text-lg font-medium text-slate-500 xl:text-xl">
                  Used:
                  <animated.span className="ml-2 text-lg font-semibold text-slate-700">
                    {occupied.to((x: number) => Math.round(x))}
                  </animated.span>
                </p>
              </div>
              <div className="overflow-x-auto">
                <p className="text-lg font-medium text-slate-500 xl:text-xl">
                  Total:
                  <animated.span className="ml-2 text-lg font-semibold text-slate-700">
                    {totalCount.to((x: number) => Math.round(x))}
                  </animated.span>
                </p>
              </div>
            </div>
            {facilityId && (
              <div className="flex items-center justify-between gap-2 pt-6">
                {lastUpdated && (
                  <RecordMeta
                    className="text-xs font-normal text-gray-600"
                    prefix={t("updated")}
                    time={lastUpdated}
                  />
                )}
                <div className="relative flex justify-end gap-2">
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
              "pointer-events-none absolute left-1/2 top-1/4 my-8 w-full -translate-x-1/2 text-center text-xl font-bold text-slate-500 opacity-0"
            }
          >
            No Data Available
          </p>
        </div>
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
