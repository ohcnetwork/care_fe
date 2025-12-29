import { navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import query from "@/Utils/request/query";
import specimenApi from "@/types/emr/specimen/specimenApi";

import GenericQRScanDialog from "./GenericQRScanDialog";
import { SpecimenIDScanSuccessDialog } from "./SpecimenIDScanSuccessDialog";

interface QRScanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId?: string;
  locationId?: string;
  onScanSuccess?: (specimen: string) => void;
}

export function QRScanDialog({
  open,
  onOpenChange,
  facilityId,
  locationId,
  onScanSuccess,
}: QRScanDialogProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [specimenData, setSpecimenData] = useState<any>(null);
  const [lastScannedId, setLastScannedId] = useState("");

  async function handleScanSuccess(scannedId: string) {
    setLastScannedId(scannedId);

    // If no facilityId provided, just return the string (simple mode)
    if (!facilityId) {
      if (onScanSuccess) {
        onScanSuccess(scannedId);
      }
      return;
    }

    // Full API mode - make API call and return specimen object
    setLoading(true);
    const signal = new AbortController().signal;

    try {
      let result;
      try {
        result = await query(specimenApi.retrieveByAccessionIdentifier, {
          pathParams: { facilityId },
          body: { accession_identifier: scannedId },
        })({ signal });
      } catch {
        result = await query(specimenApi.getSpecimen, {
          pathParams: { facilityId, specimenId: scannedId },
        })({ signal });
      }

      setSpecimenData(result);
      setShowSuccess(true);
    } catch {
      toast.error(t("specimen_not_found"));
    } finally {
      setLoading(false);
    }
  }

  function handleSuccessContinue() {
    const serviceRequestId = specimenData?.service_request?.id;
    if (!serviceRequestId) {
      toast.error(t("service_request_not_found"));
      return;
    }
    navigate(
      `/facility/${facilityId}/locations/${locationId}/service_requests/${serviceRequestId}`,
    );
    setShowSuccess(false);
    onOpenChange(false);
  }

  return (
    <>
      <GenericQRScanDialog
        open={open && !showSuccess}
        onOpenChange={onOpenChange}
        onScanSuccess={handleScanSuccess}
        title={t("scan_qr")}
        inputLabel={t("specimen_id")}
        inputPlaceholder={t("enter_specimen_id")}
        scanningMessage={loading ? t("searching") : undefined}
      />

      <SpecimenIDScanSuccessDialog
        open={showSuccess}
        onOpenChange={setShowSuccess}
        specimenId={specimenData?.external_id || lastScannedId}
        cap={
          specimenData?.specimen_definition?.type_tested?.container?.cap
            ?.display || "Unknown"
        }
        specimen={specimenData?.specimen_type?.display || "Unknown"}
        serviceRequestTitle={specimenData?.service_request?.title}
        serviceRequestId={specimenData?.service_request?.id}
        onContinue={handleSuccessContinue}
      />
    </>
  );
}

export default QRScanDialog;
