import {
  formatDosage,
  formatDuration,
  formatFrequency,
  formatTotalUnits,
} from "@/components/Medicine/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  displayMedicationName,
  MEDICATION_REQUEST_STATUS_COLORS,
} from "@/types/emr/medicationRequest/medicationRequest";
import { PrescriptionRead } from "@/types/emr/prescription/prescription";
import prescriptionApi from "@/types/emr/prescription/prescriptionApi";
import { getLocationPath } from "@/types/location/utils";
import query from "@/Utils/request/query";
import { formatName } from "@/Utils/utils";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { PrinterIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

interface PrescriptionDialogProps {
  prescription?: PrescriptionRead;
  open: boolean;
  patientId?: string;
  prescriptionId?: string;
  onOpenChange: (open: boolean) => void;
}

export const PrescriptionDialog = ({
  prescription: prescriptionProp,
  open,
  onOpenChange,
  prescriptionId,
  patientId,
}: PrescriptionDialogProps) => {
  const { t } = useTranslation();

  const { data: prescriptionData } = useQuery({
    queryKey: ["prescription", patientId, prescriptionId],
    queryFn: query(prescriptionApi.get, {
      pathParams: { patientId: patientId!, id: prescriptionId! },
    }),
    enabled: !!prescriptionId,
  });

  const prescription = prescriptionData || prescriptionProp;

  if (!prescription) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto p-8">
        <div className="grid grid-cols-[1fr_1fr_auto_auto_auto] divide-y divide-gray-200 rounded-md border border-gray-200 overflow-auto divide-x">
          <div className="relative flex justify-between col-start-1 col-span-5 bg-white pt-4 pr-2 pb-2 pl-4">
            <div className="absolute top-5 left-0 h-4 w-1 bg-indigo-500 rounded-r-md" />
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-0.5">
                <div className="text-base text-gray-950">
                  <span className="font-medium">{t("prescribed_by")} </span>
                  <span className="font-semibold">
                    {formatName(prescription.prescribed_by)}
                  </span>
                </div>
                <div className="flex gap-2.5">
                  <span className="text-sm font-medium text-gray-700">
                    {format(prescription.created_date, "dd/MM/yyyy · hh:mm a")}{" "}
                    (
                    {t("items_count", {
                      count: prescription.medications?.length,
                    })}
                    )
                  </span>
                  <hr className="h-5 w-px bg-gray-300" />
                  <div className="flex gap-2">
                    <span className="text-sm font-medium text-gray-950">
                      {t("location")}:{" "}
                    </span>
                    <span className="text-sm text-gray-700">
                      {prescription.encounter.current_location
                        ? getLocationPath(
                            prescription.encounter.current_location,
                          )
                        : "-"}
                    </span>
                  </div>
                </div>
              </div>
              {prescription.note && (
                <span className="text-sm font-medium text-gray-700">
                  {t("note")}: {prescription.note}
                </span>
              )}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                // TODO: wire this
              }}
            >
              <PrinterIcon />
            </Button>
          </div>
          <div className="col-start-1 bg-gray-100 py-1 px-3 flex items-center">
            <span className="text-sm font-medium text-gray-700">
              {t("medicine")}
            </span>
          </div>
          <div className="bg-gray-100 py-1 px-3 flex items-center">
            <span className="text-sm font-medium text-gray-700 text-center">
              {t("dose")} . {t("schedule")} . {t("duration")}/
              {t("instructions")}
            </span>
          </div>
          <div className="bg-gray-100 py-1 px-3 flex items-center">
            <span className="text-sm font-medium text-gray-700">
              {t("total_to_dispense")}
            </span>
          </div>
          <div className="bg-gray-100 py-1 px-3 flex items-center">
            <span className="text-sm font-medium text-gray-700">
              {t("dispense_status")}
            </span>
          </div>
          <div className="bg-gray-100 py-1 px-3 flex items-center">
            <span className="text-sm font-medium text-gray-700">
              {t("status")}
            </span>
          </div>

          {prescription.medications?.map((medication) => (
            <div
              key={medication.id}
              className="contents group divide-x divide-y divide-gray-200"
            >
              <div className="col-start-1 bg-white group-hover:bg-gray-50 py-2 px-3 flex items-center text-gray-950 font-semibold">
                {displayMedicationName(medication)}
              </div>
              <div className="bg-white group-hover:bg-gray-50 py-2 px-3 flex flex-col justify-center text-sm text-gray-950 font-medium">
                <span>
                  {formatDosage(medication.dosage_instruction?.[0])} .
                  {formatFrequency(medication.dosage_instruction?.[0])} .
                  {formatDuration(medication.dosage_instruction?.[0])}
                </span>
                <span className="text-gray-700 font-medium">
                  {medication.note}
                </span>
              </div>
              <div className="bg-white group-hover:bg-gray-50 py-2 px-3 flex items-center text-sm text-gray-950 font-medium">
                {formatTotalUnits(
                  medication.dosage_instruction
                    ? [medication.dosage_instruction[0]]
                    : [],
                  t("units"),
                )}
              </div>
              <div className="border-r border-gray-200 bg-white group-hover:bg-gray-50 py-2 px-3 flex items-center">
                <Badge variant="secondary" size="sm">
                  {t(medication.dispense_status || "incomplete") || "-"}
                </Badge>
              </div>
              <div className="border-b border-gray-200 bg-white group-hover:bg-gray-50 py-2 px-3 flex items-center">
                <Badge
                  variant={MEDICATION_REQUEST_STATUS_COLORS[medication.status]}
                  size="sm"
                >
                  {t(medication.status)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
