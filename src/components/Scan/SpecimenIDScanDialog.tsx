// TODO: Make this a generic QR scanner component
import { Camera, QrCode, X } from "lucide-react";
import { navigate } from "raviger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import QrCodeScanner from "react-qr-barcode-scanner";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import query from "@/Utils/request/query";
import specimenApi from "@/types/emr/specimen/specimenApi";

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
  const [specimenId, setSpecimenId] = useState("");
  const [scanning, setScanning] = useState(false);
  const [inputHighlighted, setInputHighlighted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [specimenData, setSpecimenData] = useState<any>(null);
  const [hasPermission, setHasPermission] = useState(true);

  useEffect(() => {
    if (!open) {
      setSpecimenId("");
      setScanning(false);
    }
  }, [open]);

  function handleScan(_: any, result: any) {
    if (result?.text) {
      const scannedCode = result.text.trim();
      if (scannedCode && scannedCode.length > 3) {
        setSpecimenId(scannedCode);
        setScanning(false);
        setInputHighlighted(true);
        setTimeout(() => setInputHighlighted(false), 1200);
        handleContinue(scannedCode);
      }
    }
  }

  function handleScanError() {
    setScanning(false);
    setHasPermission(false);
    toast.error(t("camera_permission_denied"));
  }

  async function handleContinue(scannedId?: string) {
    const idToUse = (scannedId || specimenId).trim();
    if (!idToUse) return;

    // If no facilityId provided, just return the string (simple mode)
    if (!facilityId) {
      if (onScanSuccess) {
        onScanSuccess(idToUse);
      }
      onOpenChange(false);
      return;
    }

    // Full API mode - make API call and return specimen object
    setLoading(true);
    const signal = new AbortController().signal;

    try {
      const result = await query(specimenApi.getSpecimen, {
        pathParams: { facilityId, specimenId: idToUse },
      })({ signal });

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
      <Dialog open={open && !showSuccess} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md w-[95%] rounded-lg p-0 overflow-hidden">
          <DialogHeader
            className={cn("px-4 sm:px-6 py-3 border-b bg-gray-50/80")}
          >
            <DialogTitle
              className={cn(
                "flex items-center gap-2 font-semibold text-gray-900",
                "text-sm sm:text-lg",
              )}
            >
              <QrCode className="size-5 text-primary" />
              {t("scan_qr")}
            </DialogTitle>
          </DialogHeader>

          <div className={cn("p-4 sm:p-6", "space-y-6")}>
            {scanning ? (
              <div className="w-full flex flex-col items-center">
                <div className="relative w-full aspect-square mb-3">
                  <div className="absolute inset-0 z-10 pointer-events-none">
                    {/* QR Code Frame */}
                    <div className="absolute inset-[15%] sm:inset-[20%]">
                      <div className="absolute inset-0 border-2 border-primary rounded-xl overflow-hidden" />
                    </div>
                    <div className="absolute inset-0 border border-black/10 rounded-xl overflow-hidden" />
                  </div>
                  <div className="absolute inset-0 bg-black/5 rounded-xl overflow-hidden">
                    <div className="w-full h-full relative aspect-square scale-[2]">
                      <QrCodeScanner
                        onUpdate={handleScan}
                        onError={handleScanError}
                        facingMode="environment"
                      />
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute top-2 right-2 z-20"
                    onClick={() => setScanning(false)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
                <p className="font-medium animate-pulse text-sm">
                  {hasPermission
                    ? t("align_qr_code_in_frame")
                    : t("camera_permission_denied")}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mb-3">
                    <QrCode className="size-8 text-primary" />
                  </div>
                  <Button
                    variant="outline"
                    size="lg"
                    className="gap-2"
                    onClick={() => setScanning(true)}
                  >
                    <Camera className="size-5" />
                    {t("scan_with_camera")}
                  </Button>
                </div>

                <div>
                  <div className="relative">
                    <Separator className="absolute top-1/2 w-full" />
                    <div className="relative flex justify-center">
                      <span className="bg-white px-2 text-sm text-gray-500">
                        {t("or")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm sm:text-base font-medium text-gray-700">
                      {t("specimen_id")}:
                    </label>
                    <Input
                      id="qr-input"
                      placeholder={t("enter_specimen_id")}
                      value={specimenId}
                      onChange={(e) => setSpecimenId(e.target.value.trim())}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !loading) {
                          handleContinue();
                        }
                      }}
                      onPaste={(e) => {
                        const pasted = e.clipboardData.getData("text").trim();
                        setSpecimenId(pasted);
                        if (pasted) handleContinue(pasted);
                      }}
                      className={cn(
                        "mt-1.5 transition-all text-sm",
                        inputHighlighted && "ring-2 ring-primary/30",
                      )}
                      autoFocus={!scanning}
                    />
                  </div>

                  <Button
                    className="w-full"
                    disabled={!specimenId.trim() || loading}
                    onClick={() => handleContinue()}
                  >
                    {loading ? t("searching") : t("continue")}
                    <CareIcon
                      icon="l-arrow-right"
                      className="size-4 sm:size-5 ml-2"
                    />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <SpecimenIDScanSuccessDialog
        open={showSuccess}
        onOpenChange={setShowSuccess}
        specimenId={specimenData?.external_id || specimenId}
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
