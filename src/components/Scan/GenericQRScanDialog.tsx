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

interface GenericQRScanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanSuccess: (scannedValue: string) => void;
  title?: string;
  inputLabel?: string;
  inputPlaceholder?: string;
  scanningMessage?: string;
  extractValue?: (rawValue: string) => string;
  /** If true, starts scanning immediately when the dialog opens */
  autoStartScanning?: boolean;
}

export function GenericQRScanDialog({
  open,
  onOpenChange,
  onScanSuccess,
  title,
  inputLabel,
  inputPlaceholder,
  scanningMessage,
  extractValue,
  autoStartScanning = false,
}: GenericQRScanDialogProps) {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState("");
  const [scanning, setScanning] = useState(autoStartScanning);
  const [hasPermission, setHasPermission] = useState(true);

  // Default values
  const dialogTitle = title || t("scan_qr");
  const labelText = inputLabel;
  const placeholderText = inputPlaceholder;
  const scanMessage = scanningMessage || t("align_qr_code_in_frame");

  useEffect(() => {
    if (!open) {
      setInputValue("");
      setScanning(autoStartScanning);
      setHasPermission(true);
    } else if (autoStartScanning) {
      setScanning(true);
    }
  }, [open, autoStartScanning]);

  // Helper function to extract value (can be customized per use case)
  function extractValueFromRaw(input: string): string {
    if (extractValue) {
      return extractValue(input);
    }
    return input.trim();
  }

  function handleScan(result: IDetectedBarcode[]) {
    if (result && result.length > 0) {
      const scannedCode = result[0].rawValue.trim();
      const extractedValue = extractValueFromRaw(scannedCode);
      if (extractedValue) {
        setInputValue(extractedValue);
        setScanning(false);
        handleContinue(extractedValue);
      }
    }
  }

  function handleScanError() {
    setScanning(false);
    setHasPermission(false);
    toast.error(t("camera_permission_denied"));
  }

  function handleContinue(scannedValue?: string) {
    const rawValue = scannedValue || inputValue;
    const valueToUse = extractValueFromRaw(rawValue);
    if (!valueToUse) return;

    onScanSuccess(valueToUse);
    onOpenChange(false);
    setInputValue("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[95%] rounded-lg p-0 overflow-hidden">
        <DialogHeader className="px-4 sm:px-6 py-3 border-b bg-gray-50/80">
          <DialogTitle className="flex items-center gap-2 font-semibold text-gray-900 text-sm sm:text-lg">
            <QrCode className="size-5 text-primary" />
            {dialogTitle}
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
                  aria-label={t("close")}
                >
                  <X className="size-4" />
                </Button>
              </div>
              <p className="font-medium animate-pulse text-sm">
                {hasPermission ? scanMessage : t("camera_permission_denied")}
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
                    {labelText}
                  </label>
                  <Input
                    placeholder={placeholderText}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value.trim())}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleContinue();
                      }
                    }}
                    onPaste={(e) => {
                      const pasted = e.clipboardData.getData("text").trim();
                      const extractedValue = extractValueFromRaw(pasted);
                      setInputValue(extractedValue);
                      if (extractedValue) {
                        handleContinue(extractedValue);
                      }
                    }}
                    autoFocus={!scanning}
                  />
                </div>

                <Button
                  className="w-full"
                  disabled={!inputValue}
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

export default GenericQRScanDialog;
