import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";

import Loading from "@/components/Common/Loading";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

import { PrescriptionRead } from "@/types/emr/prescription/prescription";
import prescriptionApi from "@/types/emr/prescription/prescriptionApi";
import query from "@/Utils/request/query";
import { formatDateTime, formatName } from "@/Utils/utils";
import { ReceiptTextIcon } from "lucide-react";

interface PrescriptionListProps {
  patientId: string;
  encounterId: string;
  facilityId?: string;
  selectedPrescriptionId?: string;
  onSelectPrescription: (prescription: PrescriptionRead | undefined) => void;
}

export default function PrescriptionList({
  patientId,
  encounterId,
  facilityId,
  selectedPrescriptionId,
  onSelectPrescription,
}: PrescriptionListProps) {
  const { data: prescriptions, isLoading } = useQuery({
    queryKey: ["prescriptions", patientId, encounterId],
    queryFn: query(prescriptionApi.list, {
      pathParams: { patientId },
      queryParams: {
        encounter: encounterId,
        facility: facilityId,
      },
    }),
    enabled: !!patientId && !!encounterId,
  });

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
      <div className="flex h-full items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (!prescriptions?.results?.length) {
    return null;
  }

  return (
    <ScrollArea className="h-[calc(100vh-300px)] border-r">
      <div className="space-y-1 p-2">
        {prescriptions.results.map((prescription) => {
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
              onClick={() =>
                onSelectPrescription(prescription as PrescriptionRead)
              }
            >
              {isSelected && (
                <div className="absolute right-0 h-8 w-1 bg-primary-600 rounded-l inset-y-1/2 -translate-y-1/2" />
              )}
              <CardContent className="flex flex-col px-4 py-3 gap-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-start gap-3">
                    <ReceiptTextIcon
                      className={cn(
                        "size-5",
                        isSelected ? "text-primary-600" : "text-gray-500",
                      )}
                    />
                    <div className="flex flex-col items-start">
                      <span className="text-base font-medium">
                        {formatDateTime(
                          prescription.created_date,
                          "DD/MM/YYYY hh:mm A",
                        )}
                      </span>
                      <span className="text-sm font-medium text-gray-700">
                        {formatName(prescription.prescribed_by)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
}
