// import CareIcon from "../../CAREUI/icons/CareIcon";
import { formatDate } from "../../Utils/utils";
import DialogModal from "../Common/Dialog";
import { AbhaObject } from "../Patient/models";

interface IProps {
  abha?: AbhaObject;
  show: boolean;
  onClose: () => void;
}

const ABHAProfileModal = ({ show, onClose, abha }: IProps) => {
  return (
    <DialogModal title="ABHA Profile" show={show} onClose={onClose}>
      <div className="flex items-center justify-between">
        <div className="flex items-center justify-evenly gap-2 text-lg font-semibold">
          <span> {abha?.first_name}</span>
          <span> {abha?.middle_name} </span>
          <span> {abha?.last_name} </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-2xl text-gray-500">#</span>
          <span className="">{abha?.id}</span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span>{abha?.abha_number}</span>
        {abha?.health_id && (
          <div className="flex items-center gap-1">
            <span>{abha.health_id.split("@")[0]}</span>
            <span className="text-gray-700 text-sm">@</span>
            <span>{abha.health_id.split("@")[1] || "care"}</span>
          </div>
        )}
      </div>
      <div className="flex mt-2">
        <span>{abha?.email}</span>
      </div>

      <div className="flex flex-col mt-4 text-sm text-gray-700">
        {abha?.created_date && (
          <div className="flex gap-1 items-center">
            <span className="">Created On: </span>
            <span>{formatDate(abha.created_date)}</span>
          </div>
        )}
        {abha?.modified_date && (
          <div className="flex gap-1 items-center">
            <span className="">Last Modified On: </span>
            <span>{formatDate(abha.modified_date)}</span>
          </div>
        )}
      </div>
    </DialogModal>
  );
};

export default ABHAProfileModal;
