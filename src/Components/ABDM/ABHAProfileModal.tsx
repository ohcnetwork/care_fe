import CareIcon from "../../CAREUI/icons/CareIcon";
import DialogModal from "../Common/Dialog";
import QRCode from "qrcode.react";
import { formatDateTime } from "../../Utils/utils";
import { useRef } from "react";
import request from "../../Utils/request/request";
import routes from "../../Redux/api";
import { AbhaNumberModel } from "./types/abha";
import { useTranslation } from "react-i18next";

interface IProps {
  patientId?: string;
  abha?: AbhaNumberModel;
  show: boolean;
  onClose: () => void;
}

const ABHAProfileModal = ({ patientId, show, onClose, abha }: IProps) => {
  const { t } = useTranslation();

  const printRef = useRef(null);

  const downloadAbhaCard = async (type: "pdf" | "png") => {
    if (!patientId) return;
    const { res, data } = await request(routes.abdm.healthId.getAbhaCard, {
      body: {},
    });

    if (res?.status === 200 && data) {
      if (type === "png") {
        const downloadLink = document.createElement("a");
        downloadLink.href = "data:application/octet-stream;base64," + data;
        downloadLink.download = "abha.png";
        downloadLink.click();
      } else {
        const htmlPopup = `<embed width=100% height=100%" type='application/pdf' src='data:application/pdf;base64,${data}'></embed>`;

        const printWindow = window.open("", "PDF");
        printWindow?.document.write(htmlPopup);
        printWindow?.print();
      }
    }
  };

  return (
    <DialogModal
      title={
        <div className="flex items-center justify-between">
          <h4>{t("abha_profile")}</h4>
          <div className="flex items-center gap-2">
            <CareIcon
              onClick={() => downloadAbhaCard("pdf")}
              icon="l-print"
              className="cursor-pointer"
            />
            <CareIcon
              onClick={() => downloadAbhaCard("png")}
              icon="l-import"
              className="cursor-pointer"
            />
          </div>
        </div>
      }
      show={show}
      onClose={onClose}
      className="max-w-[500px]"
      fixedWidth={false}
    >
      <div
        ref={printRef}
        id="section-to-print"
        className="print flex flex-col gap-4 border-black sm:flex-row print:w-full print:border"
      >
        <div className="flex-1 sm:aspect-square sm:h-40 sm:flex-auto">
          <QRCode
            className="h-full w-full border border-black p-1"
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
        </div>
        <div className="flex flex-wrap gap-4">
          {[
            {
              label: t("full_name"),
              value:
                abha?.name ||
                `${abha?.first_name} ${abha?.middle_name} ${abha?.last_name}`,
            },
            { label: t("date_of_birth"), value: abha?.date_of_birth },
            { label: t("gender"), value: abha?.gender },
            { label: t("abha_number"), value: abha?.abha_number },
            {
              label: t("abha_address"),
              value: abha?.health_id?.split("@")[0],
            },
            { label: t("email"), value: abha?.email },
          ].map((item, index) =>
            item.value ? (
              <div key={index}>
                <div className="text-xs text-secondary-700">{item.label}</div>
                <div>{item.value}</div>
              </div>
            ) : null,
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-col text-xs text-secondary-700">
        {abha?.created_date && (
          <div className="flex items-center gap-1">
            <span>{t("created_on")}: </span>
            <span>{formatDateTime(abha.created_date)}</span>
          </div>
        )}
        {abha?.modified_date && (
          <div className="flex items-center gap-1">
            <span>{t("modified_on")}: </span>
            <span>{formatDateTime(abha.modified_date)}</span>
          </div>
        )}
      </div>
    </DialogModal>
  );
};

export default ABHAProfileModal;
