import { useTranslation } from "react-i18next";
import { AbhaNumberModel, ABHAQRContent } from "../types/abha";
import * as Notification from "../../../Utils/Notifications.js";

import { Scanner } from "@yudiel/react-qr-scanner";
import request from "../../../Utils/request/request";
import routes from "../../../Redux/api";
import { useState } from "react";

type ILoginWithQrProps = {
  onSuccess: (abhaNumber: AbhaNumberModel) => void;
};

export default function LinkWithQr({ onSuccess }: ILoginWithQrProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div>
      <Scanner
        onResult={async (scannedValue) => {
          if (!scannedValue || isLoading) return;

          try {
            const qrData = JSON.parse(scannedValue) as ABHAQRContent;

            setIsLoading(true);
            const { res, data } = await request(routes.abdm.abhaNumber.create, {
              body: {
                abha_number: qrData.hidn,
                health_id: qrData.hid || qrData.phr,
                name: qrData.name,
                gender: qrData.gender,
                date_of_birth: qrData.dob,
                address: qrData.address,
                district: qrData.district_name || qrData["dist name"],
                state: qrData.state_name || qrData["state name"],
                mobile: qrData.mobile,
              },
            });

            if (res?.status === 201 && data) {
              onSuccess(data);
            }
            setIsLoading(false);
          } catch (e) {
            Notification.Error({
              msg: t("abha__qr_scanning_error"),
            });
          }
        }}
        onError={(e) =>
          Notification.Error({
            msg: e.message,
          })
        }
        options={{
          delayBetweenScanAttempts: 300,
          delayBetweenScanSuccess: 2000,
        }}
      />
    </div>
  );
}
