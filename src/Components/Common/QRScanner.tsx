import * as Notification from "../../Utils/Notifications.js";

import CareIcon from "../../CAREUI/icons/CareIcon";
import DialogModal from "./Dialog";
import QrReader from "react-qr-reader";
import TextFormField from "../Form/FormFields/TextFormField.js";
import { useState } from "react";

interface IQRScannerModalProps {
  show: boolean;
  onClose: () => void;
  onScan: (scannedValue: any) => any;
  description?: string;
  disabled?: boolean;
}

const QRScannerModal = ({
  show,
  onClose,
  onScan,
  description,
  disabled = false,
}: IQRScannerModalProps) => {
  return (
    <DialogModal
      title=""
      show={!disabled && show}
      onClose={onClose}
      className="w-3/5 !max-w-full"
    >
      <div className="mx-auto my-2 flex w-full flex-col items-end justify-start md:w-1/2">
        <h2 className="mb-4 self-center text-center text-lg">
          {description || "Scan QR code!"}
        </h2>
        <QrReader
          delay={300}
          onScan={onScan}
          onError={(e: any) =>
            Notification.Error({
              msg: e.message,
            })
          }
          style={{ width: "100%" }}
        />
      </div>
    </DialogModal>
  );
};

interface IProps {
  value: string;
  onChange: (value: string) => void;
  parse?: (scannedValue: any) => any;
  className?: string;
  error?: string;
  label?: string;
  disabled?: boolean;
}

const QRScanner = ({
  value,
  onChange,
  parse,
  disabled = false,
  className = "",
  error = "",
  label = "QR Code",
}: IProps) => {
  const [showScanner, setShowScanner] = useState(false);

  return (
    <div className={className}>
      <TextFormField
        trailing={
          <CareIcon
            onClick={() => setShowScanner(true)}
            className="care-l-focus z-50 cursor-pointer text-black"
          />
        }
        error={error}
        disabled={disabled}
        label={label}
        id="qr_code_id"
        name="qr_code_id"
        placeholder=""
        value={value}
        onChange={(e) => onChange(e.value)}
      />

      <QRScannerModal
        show={showScanner}
        disabled={disabled}
        onClose={() => setShowScanner(false)}
        onScan={async (scannedValue: any) => {
          const parsedValue = (await parse?.(scannedValue)) ?? null;
          if (parsedValue) {
            onChange(parsedValue);
            setShowScanner(false);
          }
        }}
      />
    </div>
  );
};

export default QRScanner;
