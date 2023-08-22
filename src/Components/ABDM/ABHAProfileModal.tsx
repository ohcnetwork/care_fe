import * as Notify from "../../Utils/Notifications";

import { AbhaObject } from "../Patient/models";
import CareIcon from "../../CAREUI/icons/CareIcon";
import DialogModal from "../Common/Dialog";
import QRCode from "qrcode.react";
import { formatDateTime } from "../../Utils/utils";
import { getAbhaCard } from "../../Redux/actions";
import { useDispatch } from "react-redux";
import { useRef } from "react";

interface IProps {
  patientId?: string;
  abha?: AbhaObject;
  show: boolean;
  onClose: () => void;
}

const ABHAProfileModal = ({ patientId, show, onClose, abha }: IProps) => {
  const printRef = useRef(null);
  const dispatch = useDispatch<any>();

  const downloadAbhaCard = async (type: "pdf" | "png") => {
    if (!patientId) return;
    const response = await dispatch(getAbhaCard(patientId, type));

    if (response.status === 200 && response.data) {
      if (type === "png") {
        const downloadLink = document.createElement("a");
        downloadLink.href =
          "data:application/octet-stream;base64," + response.data;
        downloadLink.download = "abha.png";
        downloadLink.click();
      } else {
        const htmlPopup = `<embed width=100% height=100%" type='application/pdf' src='data:application/pdf;base64,${response.data}'></embed>`;

        const printWindow = window.open("", "PDF");
        printWindow?.document.write(htmlPopup);
        printWindow?.print();
      }
    } else {
      Notify.Error({ msg: "Download Failed..." });
    }
  };

  return (
    <DialogModal
      title={
        <div className="flex items-center justify-between">
          <h4>ABHA Profile</h4>
          <div className="flex items-center gap-2">
            <CareIcon
              onClick={() => downloadAbhaCard("pdf")}
              className="care-l-print cursor-pointer"
            />
            <CareIcon
              onClick={() => downloadAbhaCard("png")}
              className="care-l-import cursor-pointer"
            />
          </div>
        </div>
      }
      show={show}
      onClose={onClose}
    >
      <div
        ref={printRef}
        id="section-to-print"
        className="print flex items-center justify-around border-black p-4 print:w-full print:border"
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
                {/* <span className="text-gray-700 text-sm">@</span>
                <span>{abha.health_id.split("@")[1] || "care"}</span> */}
              </div>
            )}
            <div className="mt-2 flex flex-col">
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

      <div className="mt-4 flex flex-col text-sm text-gray-700">
        {abha?.created_date && (
          <div className="flex items-center gap-1">
            <span className="">Created On: </span>
            <span>{formatDateTime(abha.created_date)}</span>
          </div>
        )}
        {abha?.modified_date && (
          <div className="flex items-center gap-1">
            <span className="">Last Modified On: </span>
            <span>{formatDateTime(abha.modified_date)}</span>
          </div>
        )}
      </div>
    </DialogModal>
  );
};

export default ABHAProfileModal;
