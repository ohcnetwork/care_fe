import { useEffect, useState } from "react";
import * as Notification from "../../Utils/Notifications";
import DialogModal from "../Common/Dialog";
import ButtonV2 from "../Common/components/ButtonV2";
import { NonReadOnlyUsers } from "../../Utils/AuthorizeFor";
import CareIcon from "../../CAREUI/icons/CareIcon";
import RecordMeta from "../../CAREUI/display/RecordMeta";
import ConfirmDialog from "../Common/ConfirmDialog";
import routes from "../../Redux/api";
import request from "../../Utils/request/request";
import { OxygenDetails } from "./OxygenDetails";
import { FacilityModel } from "./models";

interface OxygenTypeCardProps {
  facilityId?: string;
  oxygen_type?: number;
  label: string;
  used: number;
  total: number;
  handleUpdate: () => void;
  facilityData?: FacilityModel;
}

export const OxygenTypeCard: React.FC<OxygenTypeCardProps> = ({
  facilityId,
  oxygen_type,
  label,
  used,
  total,
  handleUpdate,
  facilityData,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number>(-1);

  const handleDeleteSubmit = async () => {
    if (oxygen_type) {
      const { res } = await request(routes.partialUpdateFacility, {
        pathParams: { id: facilityId + "" },
        body:
          oxygen_type === 1
            ? {
                oxygen_capacity: 0,
                expected_oxygen_requirement: 0,
              }
            : oxygen_type === 2
              ? {
                  type_b_cylinders: 0,
                  expected_type_b_cylinders: 0,
                }
              : oxygen_type === 3
                ? {
                    type_c_cylinders: 0,
                    expected_type_c_cylinders: 0,
                  }
                : {
                    type_d_cylinders: 0,
                    expected_type_d_cylinders: 0,
                  },
      });
      console.log(res?.status);
      if (res?.status == 200) {
        Notification.Success({
          msg: "Oxygen type deleted successfully",
        });
        setOpenDeleteDialog(false);
        handleUpdate();
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
        <span className="flex items-center justify-center rounded py-0 text-sm text-gray-500">
          {usedPercent}%
        </span>
      </header>
      <div className="mt-4 text-xl font-extrabold text-black">
        {used} / {total}
      </div>
      <div className="mt-3 flex flex-col items-stretch justify-center rounded-md">
        <div className="flex h-3 w-full rounded-md bg-gray-300">
          <div
            className="flex h-3 shrink-0 flex-col rounded-md bg-blue-600"
            style={{ width: `${usedPercent}%` }}
          ></div>
        </div>

        <div className="mt-3 text-sm tracking-normal text-zinc-700">
          {" "}
          In Use / Total Capacity{" "}
        </div>
        {facilityId ? (
          <div className="mt-3 flex w-full flex-col items-end justify-between gap-5 sm:flex-row">
            <div className="mt-4 text-xs italic text-gray-500">
              {facilityData?.modified_date && (
                <RecordMeta
                  className="py-0 text-xs font-normal text-gray-600"
                  prefix={"Last updated;"}
                  time={facilityData?.modified_date}
                />
              )}
            </div>
            <div className="flex items-stretch justify-end gap-4 self-stretch">
              <ButtonV2
                id="edit-facility-bedcapacity"
                onClick={() => {
                  setSelectedId(oxygen_type || 0);
                  setOpen(true);
                }}
                authorizeFor={NonReadOnlyUsers}
                className="tooltip bg-opacity/20 flex aspect-square h-7 w-7 flex-col items-center justify-center rounded bg-gray-300 px-4 py-0"
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
                className=" tooltip bg-opacity/10 flex aspect-square h-7 w-7 flex-col items-center justify-center rounded bg-red-100 px-4 py-0 hover:bg-red-200"
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
          title="Update Oxygen Capacity"
          className="max-w-lg md:min-w-[650px]"
        >
          <OxygenDetails
            facilityId={facilityId || ""}
            facilityData={facilityData}
            oxygen_type={oxygen_type}
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

export default OxygenTypeCard;
