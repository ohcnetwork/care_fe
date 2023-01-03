import { useState } from "react";
import { ActionTextInputField, ErrorHelperText } from "./HelperInputFields";
import CropFreeIcon from "@material-ui/icons/CropFree"; // TODO: should use care icon
import DialogModal from "./Dialog";
import QrReader from "react-qr-reader";
import * as Notification from "../../Utils/Notifications.js";

interface IQRScannerModalProps {
  show: boolean;
  onClose: () => void;
  onScan: (scannedValue: any) => any;
  description?: string;
}

const QRScannerModal = ({
  show,
  onClose,
  onScan,
  description,
}: IQRScannerModalProps) => {
  return (
    <DialogModal
      title=""
      show={show}
      onClose={onClose}
      className="!max-w-full w-3/5"
    >
      <div className="md:w-1/2 w-full my-2 mx-auto flex flex-col justify-start items-end">
        <h2 className="text-center text-lg self-center mb-4">
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
}

const QRScanner = ({
  value,
  onChange,
  parse,
  className = "",
  error = "",
}: IProps) => {
  const [showScanner, setShowScanner] = useState(false);

  return (
    <div className={className}>
      <label htmlFor="asset-qr-id">Asset QR ID</label>
      <ActionTextInputField
        id="qr_code_id"
        fullWidth
        name="qr_code_id"
        placeholder=""
        variant="outlined"
        margin="dense"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        actionIcon={<CropFreeIcon className="cursor-pointer" />}
        action={() => setShowScanner(true)}
        errors={error}
      />
      <ErrorHelperText error={error} />

      <QRScannerModal
        show={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={(scannedValue: any) => {
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
