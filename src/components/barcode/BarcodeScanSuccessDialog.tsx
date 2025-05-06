import { Barcode, Droplet, TestTube } from "lucide-react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// Map cap colors to Tailwind color classes
const CAP_COLOR_MAP: { [key: string]: string } = {
  "light green": "text-green-500",
  green: "text-green-600",
  "dark green": "text-green-700",
  "light blue": "text-blue-400",
  blue: "text-blue-600",
  "dark blue": "text-blue-700",
  red: "text-red-600",
  yellow: "text-yellow-500",
  purple: "text-purple-600",
  lavender: "text-purple-400",
  gray: "text-gray-500",
  white: "text-gray-100",
  black: "text-gray-900",
};

function getCapColor(capName: string): string {
  // Convert cap name to lowercase and remove "cap" suffix
  const cleanCapName = capName.toLowerCase().replace(" cap", "");

  // Find the matching color class or return a default
  return (
    Object.entries(CAP_COLOR_MAP).find(([key]) =>
      cleanCapName.includes(key),
    )?.[1] || "text-gray-500"
  );
}

interface BarcodeScanSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  barcode: string;
  cap: string;
  specimen: string;
  onContinue: () => void;
}

export function BarcodeScanSuccessDialog({
  open,
  onOpenChange,
  barcode,
  cap,
  specimen,
  onContinue,
}: BarcodeScanSuccessDialogProps) {
  const { t } = useTranslation();
  const tubeColor = getCapColor(cap);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[95%] rounded-md p-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full border border-green-500 text-green-700 bg-green-50 text-sm font-medium">
            Success
          </span>
          <span className="text-primary-800 font-semibold text-lg">
            {t("barcode_scanned_successfully")}
          </span>
        </div>
        <div className="mb-4">
          <div className="text-gray-600 font-medium mb-1">
            {t("barcode_number")}:
          </div>
          <div className="flex items-center gap-2 uppercase">
            <Barcode className="size-6 text-gray-700 " />
            {barcode}
          </div>
        </div>
        <div className="flex gap-8 mb-6">
          <div>
            <div className="text-gray-600 font-medium mb-1">{t("tube")}:</div>
            <div className="flex items-center gap-2">
              <TestTube className={`size-5 ${tubeColor}`} />
              <span className="font-medium text-gray-800 capitalize">
                {cap}
              </span>
            </div>
          </div>
          <div>
            <div className="text-gray-600 font-medium mb-1">
              {t("specimen")}:
            </div>
            <div className="flex items-center gap-2">
              <Droplet className="size-5 text-red-500" />
              <span className="font-medium text-gray-800">{specimen}</span>
            </div>
          </div>
        </div>
        <Button
          className="w-full text-base font-semibold bg-green-700 hover:bg-green-800"
          onClick={onContinue}
        >
          Continue <CareIcon icon="l-arrow-right" className="size-5 ml-2" />
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export default BarcodeScanSuccessDialog;
