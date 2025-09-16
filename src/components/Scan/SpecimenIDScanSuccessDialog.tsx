import "@fontsource/libre-barcode-128-text";
import { Droplet, FileText, TestTube } from "lucide-react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

function getCapColor(capName: string): string {
  return capName
    .toLowerCase()
    .replace(" cap", "")
    .replace("dark yellow", "gold")
    .replace(" ", "");
}

interface SpecimenIDScanSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  specimenId: string;
  cap: string;
  specimen: string;
  onContinue: () => void;
  serviceRequestTitle?: string;
  serviceRequestId?: string;
}

export function SpecimenIDScanSuccessDialog({
  open,
  onOpenChange,
  specimenId,
  cap,
  specimen,
  onContinue,
  serviceRequestTitle,
  serviceRequestId,
}: SpecimenIDScanSuccessDialogProps) {
  const { t } = useTranslation();
  const tubeColor = getCapColor(cap);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[95%] rounded-lg p-0 overflow-hidden">
        {/* Success Header */}
        <div className="bg-green-50 px-4 sm:px-6 py-3 border-b border-green-100">
          <div className="flex items-center gap-2">
            <Badge variant="green" className="rounded-full shrink-0">
              {t("success")}
            </Badge>
            <h2 className="text-primary-800 font-semibold text-base sm:text-lg">
              {t("qr_code_scanned_successfully")}
            </h2>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          {/* Service Request Info */}
          {(serviceRequestTitle || serviceRequestId) && (
            <div className="rounded-lg bg-gray-50 border border-gray-100">
              <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-100">
                <div className="flex items-center gap-2 text-gray-600">
                  <FileText className="size-4 shrink-0" />
                  <span className="font-medium">{t("service_request")}</span>
                </div>
              </div>
              <div className="px-3 sm:px-4 py-2 sm:py-3">
                {serviceRequestTitle && (
                  <div className="text-gray-900 font-medium text-sm sm:text-base mb-1 break-words">
                    {serviceRequestTitle}
                  </div>
                )}
                {serviceRequestId && (
                  <div className="text-gray-500 text-xs sm:text-sm flex items-center gap-1.5 flex-wrap">
                    <span>{t("request_id")}:</span>
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded break-all">
                      {serviceRequestId}
                    </code>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Specimen Info */}
          <div className="rounded-lg bg-gray-50 border border-gray-100">
            <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-gray-600">
                <TestTube className="size-4 shrink-0" />
                <span className="font-medium">{t("specimen_details")}</span>
              </div>
            </div>
            <div className="px-3 sm:px-4 py-2 sm:py-3 space-y-3">
              <div className="flex items-center gap-2">
                <div className="text-gray-500 text-xs sm:text-sm w-full break-words">
                  {t("specimen_id")}:{" "}
                  <code className="bg-gray-100 px-1.5 py-0.5 rounded break-all">
                    {specimenId}
                  </code>
                </div>
              </div>
              <Separator className="bg-gray-200" />
              <div className="flex items-start sm:items-center gap-2">
                <TestTube
                  className="size-5 shrink-0 mt-0.5 sm:mt-0"
                  style={{ color: tubeColor }}
                />
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm text-gray-500">
                    {t("container_cap")}
                  </div>
                  <div className="font-medium text-gray-900 text-sm sm:text-base break-words">
                    {cap}
                  </div>
                </div>
              </div>
              <Separator className="bg-gray-200" />
              <div className="flex items-start sm:items-center gap-2">
                <Droplet className="size-5 text-red-500 shrink-0 mt-0.5 sm:mt-0" />
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm text-gray-500">
                    {t("specimen_type")}
                  </div>
                  <div className="font-medium text-gray-900 text-sm sm:text-base break-words">
                    {specimen}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <Button className="w-full mt-2" onClick={onContinue}>
            {t("continue")}
            <CareIcon icon="l-arrow-right" className="size-4 sm:size-5 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SpecimenIDScanSuccessDialog;
