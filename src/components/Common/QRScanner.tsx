import { IDetectedBarcode, Scanner } from "@yudiel/react-qr-scanner";
import { useState } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import DialogModal from "@/components/Common/Dialog";
import TextFormField from "@/components/Form/FormFields/TextFormField";

import * as Notification from "@/Utils/Notifications";

interface IQRScannerModalProps {
  show: boolean;
  onClose: () => void;
  onScan: (scannedValue: string | null) => void;
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
        <Scanner
          onScan={(detectedCodes: IDetectedBarcode[]) => {
            if (detectedCodes.length > 0) {
              const text = detectedCodes[0].rawValue;
              if (text) {
                onScan(text);
              }
            }
          }}
          onError={(e: unknown) => {
            const errorMessage =
              e instanceof Error ? e.message : "Unknown error";
            Notification.Error({
              msg: errorMessage,
            });
          }}
          scanDelay={3000}
        />
      </div>
    </DialogModal>
  );
};

interface IProps {
  value: string;
  onChange: (value: string) => void;
  parse?: (scannedValue: string | null) => void;
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
            icon="l-focus"
            onClick={() => setShowScanner(true)}
            className="z-50 cursor-pointer text-black"
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
        onScan={async (scannedValue) => {
          const parsedValue = parse?.(scannedValue) ?? null;
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
