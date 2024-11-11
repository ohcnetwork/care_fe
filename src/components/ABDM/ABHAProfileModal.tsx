import QRCode from "qrcode.react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { AbhaNumberModel } from "@/components/ABDM/types/abha";
import DialogModal from "@/components/Common/Dialog";

import * as Notify from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import { formatDateTime } from "@/Utils/utils";

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
    if (!patientId || !abha?.abha_number) return;

    Notify.Success({ msg: t("downloading_abha_card") });

    const { res, data } = await request(routes.abdm.healthId.getAbhaCard, {
      query: { abha_id: abha?.abha_number },
    });

    if (res?.status === 200 && data) {
      const imageUrl = URL.createObjectURL(data);

      if (type === "png") {
        const downloadLink = document.createElement("a");
        downloadLink.href = imageUrl;
        downloadLink.download = "abha.png";
        downloadLink.click();
        URL.revokeObjectURL(imageUrl);
      } else {
        const printWindow = window.open("", "_blank");
        const htmlPopup = `
            <html>
              <head>
                <title>Print Image</title>
                <style>
                @media print {
                  @page {
                    size: landscape;
                  }
                  body, html { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100%; }
                }
                </style>
              </head>
              <body>
                <embed width="100%" height="100%" src="${imageUrl}" type="image/png"></embed>
              </body>
            </html>
          `;
        printWindow?.document.write(htmlPopup);
        printWindow?.document.close();
        printWindow?.addEventListener("load", () => {
          printWindow?.print();
          URL.revokeObjectURL(imageUrl);
        });
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
