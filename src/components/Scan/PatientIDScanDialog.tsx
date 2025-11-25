import { IDetectedBarcode, Scanner } from "@yudiel/react-qr-scanner";
import { Camera, QrCode, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

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
  const [patientId, setPatientId] = useState("");
  const [scanning, setScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState(true);

  useEffect(() => {
    if (!open) {
      setPatientId("");
      setScanning(false);
    }
  }, [open]);

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

  function handleScan(result: IDetectedBarcode[]) {
    if (result && result.length > 0) {
      const scannedCode = result[0].rawValue.trim();
      if (scannedCode && scannedCode.length > 3) {
        const extractedId = extractPatientId(scannedCode);

        setPatientId(extractedId);
        setScanning(false);
        handleContinue(extractedId);
      }
    }
  }

  function handleScanError() {
    setScanning(false);
    setHasPermission(false);
    toast.error(t("camera_permission_denied"));
  }

  function handleContinue(scannedId?: string) {
    const rawId = scannedId || patientId;
    const idToUse = extractPatientId(rawId);
    if (!idToUse) return;

    onScanSuccess(idToUse);
    onOpenChange(false);
    setPatientId("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[95%] rounded-lg p-0 overflow-hidden">
        <DialogHeader className="px-4 sm:px-6 py-3 border-b bg-gray-50/80">
          <DialogTitle className="flex items-center gap-2 font-semibold text-gray-900 text-sm sm:text-lg">
            <QrCode className="size-5 text-primary" />
            {t("scan_patient_qr")}
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 sm:p-6 space-y-6">
          {scanning ? (
            <div className="w-full flex flex-col items-center">
              <div className="relative w-full aspect-square mb-3">
                <div className="absolute inset-0 z-10 pointer-events-none">
                  {/* QR Code Frame */}
                  <div className="absolute inset-[15%] sm:inset-[20%]">
                    <div className="absolute inset-0 border-2 border-primary rounded-xl overflow-hidden" />
                  </div>
                  <div className="absolute inset-0 border border-primary/30 rounded-xl overflow-hidden" />
                </div>
                <div className="absolute inset-0 bg-black/5 rounded-xl overflow-hidden">
                  <Scanner
                    onScan={handleScan}
                    onError={handleScanError}
                    constraints={{
                      facingMode: "environment",
                    }}
                    components={{
                      finder: false,
                    }}
                    sound={false}
                  />
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
                    {t("patient_id")}:
                  </label>
                  <Input
                    placeholder={t("enter_patient_id")}
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value.trim())}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleContinue();
                      }
                    }}
                    onPaste={(e) => {
                      const pasted = e.clipboardData.getData("text").trim();
                      const extractedId = extractPatientId(pasted);
                      setPatientId(extractedId);
                      if (extractedId) {
                        handleContinue(extractedId);
                      }
                    }}
                    autoFocus={!scanning}
                  />
                </div>

                <Button
                  className="w-full"
                  disabled={!patientId.trim()}
                  onClick={() => handleContinue()}
                >
                  {t("continue")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default PatientIDScanDialog;
