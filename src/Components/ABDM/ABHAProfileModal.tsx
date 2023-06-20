import { AbhaObject } from "../Patient/models";
import CareIcon from "../../CAREUI/icons/CareIcon";
import DialogModal from "../Common/Dialog";
import QRCode from "qrcode.react";
import { formatDate } from "../../Utils/utils";
import html2canvas from "html2canvas";
import { useRef } from "react";

interface IProps {
  abha?: AbhaObject;
  show: boolean;
  onClose: () => void;
}

const ABHAProfileModal = ({ show, onClose, abha }: IProps) => {
  const printRef = useRef(null);

  return (
    <DialogModal
      title={
        <p className="flex items-center justify-between">
          <h4>ABHA Profile</h4>
          <div className="flex items-center gap-2">
            <CareIcon onClick={print} className="care-l-print cursor-pointer" />
            <CareIcon
              onClick={async () => {
                const element = printRef.current;
                if (!element) return;

                const canvas = await html2canvas(element);
                const data = canvas.toDataURL("image/jpg");
                const link = document.createElement("a");

                if (typeof link.download === "string") {
                  link.href = data;
                  link.download = `${abha?.name || "abha"}.jpg`;

                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                } else {
                  window.open(data);
                }
              }}
              className="care-l-import cursor-pointer"
            />
          </div>
        </p>
      }
      show={show}
      onClose={onClose}
    >
      <div
        ref={printRef}
        id="section-to-print"
        className="print flex items-center justify-around print:border border-black p-4 print:w-full"
      >
        <>
          <div className="flex flex-col items-center justify-evenly">
            <div className="flex items-center justify-evenly gap-2 text-lg font-semibold">
              {abha?.name ? (
                <span> {abha?.name}</span>
              ) : (
                <>
                  <span> {abha?.first_name}</span>
                  <span> {abha?.middle_name} </span>
                  <span> {abha?.last_name} </span>
                </>
              )}
            </div>
            <span className="font-bold">{abha?.abha_number}</span>
            {abha?.health_id && (
              <div className="flex items-center gap-1 font-bold">
                <span>{abha.health_id.split("@")[0]}</span>
                <span className="text-gray-700 text-sm">@</span>
                <span>{abha.health_id.split("@")[1] || "care"}</span>
              </div>
            )}
            <div className="flex flex-col mt-2">
              {abha?.gender && (
                <p className="text-sm text-gray-600">
                  Gender:
                  <span className="ml-2 text-base font-semibold text-gray-900">
                    {abha?.gender}
                  </span>
                </p>
              )}
              {abha?.date_of_birth && (
                <p className="text-sm text-gray-600">
                  DOB:
                  <span className="ml-2 text-base font-semibold text-gray-900">
                    {abha?.date_of_birth}
                  </span>
                </p>
              )}
              {abha?.email && (
                <p className="text-sm text-gray-600">
                  Email:
                  <span className="ml-2 text-base font-semibold text-gray-900">
                    {abha?.email}
                  </span>
                </p>
              )}
            </div>
          </div>
        </>
        <>
          <QRCode
            className="border border-black p-1"
            value={JSON.stringify({
              hidn: abha?.abha_number,
              phr: abha?.health_id,
              name: abha?.name,
              gender: abha?.gender,
              dob: abha?.date_of_birth,
              address: abha?.address,
              "state name": abha?.state,
              "dist name": abha?.district,
            })}
          />
        </>
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
