import { useTranslation } from "react-i18next";
import GenericQRScanDialog from "./GenericQRScanDialog";

interface PatientIDScanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanSuccess: (patientId: string) => void;
}

export function PatientIDScanDialog({
  open,
  onOpenChange,
  onScanSuccess,
}: PatientIDScanDialogProps) {
  const { t } = useTranslation();

  // Helper function to extract patient ID from either plain text or JSON
  function extractPatientId(input: string): string {
    const trimmedInput = input.trim();

    try {
      const parsed = JSON.parse(trimmedInput);
      if (parsed.uuid && typeof parsed.uuid === "string") {
        return parsed.uuid;
      }
    } catch {
      // Not valid JSON, use the input as-is
    }

    return trimmedInput;
  }

  return (
    <GenericQRScanDialog
      open={open}
      onOpenChange={onOpenChange}
      onScanSuccess={onScanSuccess}
      title={t("scan_patient_qr")}
      inputLabel={t("patient_id")}
      inputPlaceholder={t("enter_patient_id")}
      extractValue={extractPatientId}
      autoStartScanning={true}
    />
  );
}

export default PatientIDScanDialog;
