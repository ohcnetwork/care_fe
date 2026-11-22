import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import query from "@/Utils/request/query";
import { navigate } from "@/lib/router/navigate";
import { SpecimenRetrieve } from "@/types/emr/specimen/specimen";
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

function QRScanDialog({
  open,
  onOpenChange,
  facilityId,
  locationId,
  onScanSuccess,
}: QRScanDialogProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [scanResult, setScanResult] = useState<{
    scannedId: string;
    specimen: SpecimenRetrieve;
  } | null>(null);
  const latestLookupId = useRef(0);

  async function handleScanSuccess(scannedId: string) {
    // If no facilityId provided, just return the string (simple mode)
    if (!facilityId) {
      if (onScanSuccess) {
        onScanSuccess(scannedId);
      }
      return;
    }

    // Full API mode - make API call and return specimen object
    const lookupId = ++latestLookupId.current;
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

      if (lookupId !== latestLookupId.current) return;
      setScanResult({ scannedId, specimen: result });
      setShowSuccess(true);
    } catch {
      if (lookupId === latestLookupId.current) {
        toast.error(t("specimen_not_found"));
      }
    } finally {
      if (lookupId === latestLookupId.current) {
        setLoading(false);
      }
    }
  }

  function handleSuccessContinue() {
    const serviceRequestId = scanResult?.specimen.service_request?.id;
    if (!serviceRequestId) {
      toast.error(t("service_request_not_found"));
      return;
    }
    navigate({
      href: `/facility/${facilityId}/locations/${locationId}/service_requests/${serviceRequestId}`,
    });
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
        specimenId={scanResult?.scannedId || ""}
        cap={
          scanResult?.specimen.specimen_definition?.type_tested?.container?.cap
            ?.display || "Unknown"
        }
        specimen={scanResult?.specimen.specimen_type?.display || "Unknown"}
        serviceRequestTitle={scanResult?.specimen.service_request?.title}
        serviceRequestId={scanResult?.specimen.service_request?.id}
        onContinue={handleSuccessContinue}
      />
    </>
  );
}

export default QRScanDialog;
