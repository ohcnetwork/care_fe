import { Button } from "@/components/ui/button";
import {
  PrescriptionStatus,
  PrescritionList,
} from "@/types/emr/prescription/prescription";
import prescriptionApi from "@/types/emr/prescription/prescriptionApi";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { useQuery } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Props {
  included: string[];
  onChangeIncluded: (prescriptionIds: string[]) => void;
  patientId: string;
  facilityId?: string;
}

export default function UnbilledPrescriptionsCard({
  included,
  onChangeIncluded,
  facilityId,
  patientId,
}: Props) {
  const { t } = useTranslation();

  const { data: unbilledPrescriptionIds } = useQuery({
    queryKey: ["unbilled-prescription-ids", patientId, facilityId, included],
    queryFn: query(prescriptionApi.list, {
      pathParams: { patientId },
      queryParams: {
        status: PrescriptionStatus.active,
        facility: facilityId,
        limit: 100,
      },
    }),
    select: ({ results }: PaginatedResponse<PrescritionList>) =>
      results
        .filter((prescription) => !included.includes(prescription.id))
        .map((prescription) => prescription.id),
  });

  if (!unbilledPrescriptionIds || unbilledPrescriptionIds.length === 0) {
    return null;
  }

  return (
    <div className="p-1 bg-indigo-100 rounded-md">
      <div className="bg-white border border-indigo-400 py-3 px-4 rounded-md">
        <div className="flex items-center gap-4 text-sm">
          {t("patient_has_unbilled_prescriptions_count", {
            count: unbilledPrescriptionIds.length,
          })}
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              onChangeIncluded([
                ...new Set([...included, ...unbilledPrescriptionIds]),
              ])
            }
          >
            <PlusIcon className="size-4" />
            {t("include_all")}
          </Button>
        </div>
      </div>
    </div>
  );
}
