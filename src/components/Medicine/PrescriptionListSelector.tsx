import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";

import { CardListSkeleton } from "@/components/Common/SkeletonLoading";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { PrescriptionRead } from "@/types/emr/prescription/prescription";
import prescriptionApi from "@/types/emr/prescription/prescriptionApi";
import query from "@/Utils/request/query";
import { formatDateTime, formatName } from "@/Utils/utils";
import { ChevronDown, ReceiptTextIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

interface PrescriptionListSelectorProps {
  patientId: string;
  encounterId: string;
  facilityId?: string;
  selectedPrescriptionId?: string;
  onSelectPrescription: (prescription: PrescriptionRead | undefined) => void;
}

export default function PrescriptionListSelector({
  patientId,
  encounterId,
  facilityId,
  selectedPrescriptionId,
  onSelectPrescription,
}: PrescriptionListSelectorProps) {
  const { t } = useTranslation();
  const [openDrawer, setOpenDrawer] = React.useState(false);
  const { data: prescriptions, isLoading } = useQuery({
    queryKey: ["prescriptions", patientId, encounterId],
    queryFn: query(prescriptionApi.list, {
      pathParams: { patientId },
      queryParams: { encounter: encounterId, facility: facilityId },
    }),
    enabled: !!patientId && !!encounterId,
  });

  function handleSelectPrescription(
    prescription: PrescriptionRead | undefined,
  ) {
    onSelectPrescription(prescription);
    setOpenDrawer(false);
  }

  // Select first prescription by default
  React.useEffect(() => {
    if (prescriptions?.results?.length) {
      if (!selectedPrescriptionId) {
        onSelectPrescription(prescriptions.results[0] as PrescriptionRead);
      }
    } else {
      onSelectPrescription(undefined);
    }
  }, [prescriptions, selectedPrescriptionId, onSelectPrescription]);

  if (isLoading) {
    return (
      <div className="space-y-3 w-60">
        <CardListSkeleton count={7} />
      </div>
    );
  }

  if (!prescriptions?.results?.length) {
    return null;
  }

  const selectedPrescription = selectedPrescriptionId
    ? prescriptions?.results.find((pres) => pres.id === selectedPrescriptionId)
    : undefined;

  return (
    <>
      <div className="hidden lg:block h-full overflow-y-auto pr-1">
        <PrescriptionList
          prescriptions={prescriptions.results as PrescriptionRead[]}
          selectedPrescriptionId={selectedPrescriptionId}
          onSelectPrescription={onSelectPrescription}
        />
      </div>
      <div className="lg:hidden">
        <Drawer open={openDrawer} onOpenChange={setOpenDrawer}>
          <DrawerTrigger asChild>
            {selectedPrescription ? (
              <Button
                variant="outline"
                className="w-full flex justify-between items-center py-6"
              >
                <div className="flex gap-3">
                  <ReceiptTextIcon className="size-5 text-primary-600" />
                  <div className="flex flex-col -mt-1 text-left">
                    <span className="text-sm font-medium whitespace-nowrap">
                      {formatDateTime(
                        selectedPrescription.created_date,
                        "DD/MM/YYYY hh:mm A",
                      )}
                    </span>

                    <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                      {t("prescribed_by")}:{" "}
                      {formatName(selectedPrescription.prescribed_by)}
                    </span>
                  </div>
                </div>
                <ChevronDown className="size-5 text-gray-500 shrink-0 ml-2" />
              </Button>
            ) : (
              <Button variant="outline" className="w-full">
                {t("select_prescription")}
              </Button>
            )}
          </DrawerTrigger>

          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader>
              <DrawerTitle>{t("prescription")}</DrawerTitle>
            </DrawerHeader>
            <div className="overflow-y-auto pr-2">
              <PrescriptionList
                prescriptions={prescriptions.results as PrescriptionRead[]}
                selectedPrescriptionId={selectedPrescriptionId}
                onSelectPrescription={handleSelectPrescription}
              />
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </>
  );
}
function PrescriptionList({
  prescriptions,
  selectedPrescriptionId,
  onSelectPrescription,
}: {
  prescriptions: PrescriptionRead[];
  selectedPrescriptionId: string | undefined;
  onSelectPrescription: (prescription: PrescriptionRead | undefined) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-2 p-2">
      {prescriptions.map((prescription) => {
        const isSelected = selectedPrescriptionId === prescription.id;
        return (
          <Card
            key={prescription.id}
            className={cn(
              "rounded-md relative cursor-pointer transition-colors w-full",
              isSelected
                ? "bg-white border-primary-600 shadow-md"
                : "bg-gray-100 hover:bg-gray-100 shadow-none",
            )}
            onClick={() => onSelectPrescription(prescription)}
          >
            {isSelected && (
              <div className="absolute right-0 h-8 w-1 bg-primary-600 rounded-l inset-y-1/2 -translate-y-1/2" />
            )}
            <CardContent className="flex flex-col px-4 py-3 gap-2">
              <div className="flex gap-3">
                <ReceiptTextIcon
                  className={cn(
                    "size-5",
                    isSelected ? "text-primary-600" : "text-gray-500",
                  )}
                />
                <div className="flex flex-col -mt-1">
                  <span className="text-sm font-medium whitespace-nowrap">
                    {formatDateTime(
                      prescription.created_date,
                      "DD/MM/YYYY hh:mm A",
                    )}
                  </span>

                  <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    {t("prescribed_by")}:{" "}
                    {formatName(prescription.prescribed_by)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
