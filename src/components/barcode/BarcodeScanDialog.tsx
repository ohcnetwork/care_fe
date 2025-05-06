import { useQuery } from "@tanstack/react-query";
import { Camera, ScanBarcode, X } from "lucide-react";
import { navigate } from "raviger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import BarcodeScanner, { BarcodeFormat } from "react-qr-barcode-scanner";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import query from "@/Utils/request/query";
import specimenApi from "@/types/emr/specimen/specimenApi";

import { BarcodeScanSuccessDialog } from "./BarcodeScanSuccessDialog";

interface BarcodeScanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  serviceId: string;
  locationId: string;
}

export function BarcodeScanDialog({
  open,
  onOpenChange,
  facilityId,
  serviceId,
  locationId,
}: BarcodeScanDialogProps) {
  const { t } = useTranslation();
  const [barcode, setBarcode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [inputHighlighted, setInputHighlighted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [specimenData, setSpecimenData] = useState<any>(null);

  useEffect(() => {
    if (!open) setBarcode("");
  }, [open]);

  const { refetch } = useQuery({
    queryKey: ["specimen", facilityId, barcode],
    queryFn: query(specimenApi.getSpecimen, {
      pathParams: { facilityId, specimenId: barcode },
    }),
    enabled: false,
  });

  function handleScan(result: any) {
    if (result) {
      const scannedCode = result.getText()?.trim();
      if (scannedCode && scannedCode.length > 3) {
        setBarcode(scannedCode);
        setScanning(false);
        setInputHighlighted(true);
        setTimeout(() => setInputHighlighted(false), 1200);
        handleContinue(scannedCode);
      }
    }
  }

  async function handleContinue(scannedBarcode?: string) {
    const barcodeToUse = (scannedBarcode || barcode).trim();
    if (!barcodeToUse) return;
    setLoading(true);
    try {
      const result = await refetch();
      if (!result.data) throw new Error(t("specimen_not_found"));
      setSpecimenData(result.data);
      setShowSuccess(true);
    } catch (err: any) {
      toast.error(err.message || t("specimen_not_found"));
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
      `/facility/${facilityId}/services/${serviceId}/requests/locations/${locationId}/service_requests/${serviceRequestId}`,
    );
    setShowSuccess(false);
    onOpenChange(false);
  }

  return (
    <>
      <Dialog open={open && !showSuccess} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md w-[95%] rounded-md p-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              {t("scan_barcode")}
            </DialogTitle>
          </DialogHeader>

          <div className="p-6">
            {scanning ? (
              <div className="w-full flex flex-col items-center mb-6">
                <div className="relative w-full aspect-[4/3] mb-3">
                  <div className="absolute inset-0 z-10 pointer-events-none">
                    <div className="absolute inset-12 border-2 border-primary/30 rounded-md" />
                    <div className="absolute inset-0 border border-black/10 rounded-xl overflow-hidden" />
                  </div>
                  <div className="absolute inset-0 bg-black/5 rounded-xl overflow-hidden">
                    <div className="w-full h-full">
                      <BarcodeScanner
                        onUpdate={handleScan}
                        onError={() => {
                          setScanning(false);
                          toast.error(t("camera_permission_denied"));
                        }}
                        facingMode="environment"
                        formats={[
                          BarcodeFormat.CODE_128,
                          BarcodeFormat.CODE_39,
                        ]}
                      />
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute top-3 right-3 z-20"
                    onClick={() => setScanning(false)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-600 font-medium animate-pulse">
                  {t("align_barcode_in_frame")}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mb-4">
                  <ScanBarcode className="size-8 text-primary" />
                </div>
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2 mb-2"
                  onClick={() => setScanning(true)}
                >
                  <Camera className="size-5" />
                  {t("scan_with_camera")}
                </Button>
                <p className="text-sm text-gray-500">
                  {t("or_enter_manually_below")}
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  {t("barcode_number")}:
                </label>
                <Input
                  id="barcode-input"
                  placeholder={t("enter_barcode_number")}
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value.trim())}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !loading) {
                      handleContinue();
                    }
                  }}
                  className={`mt-1 text-base transition-all ${
                    inputHighlighted ? "ring-2 ring-primary/30" : ""
                  }`}
                  autoFocus={!scanning}
                />
              </div>

              <Button
                className="w-full"
                disabled={!barcode.trim() || loading}
                onClick={() => handleContinue()}
              >
                {loading ? t("searching") : t("continue")}
                <CareIcon icon="l-arrow-right" className="size-5 ml-2" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BarcodeScanSuccessDialog
        open={showSuccess}
        onOpenChange={setShowSuccess}
        barcode={specimenData?.external_id || barcode}
        cap={
          specimenData?.specimen_definition?.type_tested?.container?.cap
            ?.display || "Unknown"
        }
        specimen={specimenData?.specimen_type?.display || "Unknown"}
        onContinue={handleSuccessContinue}
      />
    </>
  );
}

export default BarcodeScanDialog;
