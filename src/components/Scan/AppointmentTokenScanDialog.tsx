import { navigate } from "raviger";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import GenericQRScanDialog from "./GenericQRScanDialog";

interface AppointmentTokenScanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  onScanSuccess?: (scannedData: string) => void;
}

export function AppointmentTokenScanDialog({
  open,
  onOpenChange,
  facilityId,
  onScanSuccess,
}: AppointmentTokenScanDialogProps) {
  const { t } = useTranslation();

  // Helper function to extract appointment/token ID from either plain text or JSON
  function extractAppointmentTokenId(input: string): string {
    const trimmedInput = input.trim();

    try {
      // Try to parse as JSON first (structured QR code)
      const parsed = JSON.parse(trimmedInput);

      // Check for appointment ID in common QR code formats
      if (parsed.appointment_id || parsed.appointmentId || parsed.appointment) {
        return (
          parsed.appointment_id || parsed.appointmentId || parsed.appointment
        );
      }

      // Check for token ID
      if (parsed.token_id || parsed.tokenId || parsed.token) {
        return parsed.token_id || parsed.tokenId || parsed.token;
      }

      // Check for generic ID
      if (parsed.id) {
        return parsed.id;
      }
    } catch {
      // Not valid JSON, treat as plain appointment/token ID
    }

    return trimmedInput;
  }

  function handleScanSuccess(scannedId: string) {
    try {
      // First try to navigate to appointment
      navigate(`/facility/${facilityId}/appointments/${scannedId}`);

      if (onScanSuccess) {
        onScanSuccess(scannedId);
      }

      toast.success(t("navigating_to_appointment"));
    } catch (error) {
      console.error("Failed to navigate:", error);
      toast.error(t("invalid_appointment_token_qr"));
    }
  }

  return (
    <GenericQRScanDialog
      open={open}
      onOpenChange={onOpenChange}
      onScanSuccess={handleScanSuccess}
      title={t("scan_appointment_token_qr")}
      inputLabel={t("appointment_token_id")}
      inputPlaceholder={t("enter_appointment_or_token_id")}
      extractValue={extractAppointmentTokenId}
      autoStartScanning={true}
    />
  );
}

export default AppointmentTokenScanDialog;
