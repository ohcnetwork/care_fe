import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PrescriptionList,
  PrescriptionStatus,
} from "@/types/emr/prescription/prescription";
import prescriptionApi from "@/types/emr/prescription/prescriptionApi";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { useQuery } from "@tanstack/react-query";
import { ListPlus } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

interface Props {
  included: string[];
  patientId: string;
  facilityId: string;
  encounterId?: string;
  allButton?: (props: { prescriptionIds: string[] }) => React.ReactNode;
}

export default function UnbilledPrescriptionsCard({
  included,
  facilityId,
  patientId,
  encounterId,
  allButton,
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
    select: ({ results }: PaginatedResponse<PrescriptionList>) =>
      results
        .filter((prescription) => !included.includes(prescription.id))
        .map((prescription) => prescription.id),
  });

  if (!unbilledPrescriptionIds) {
    return <Skeleton className="w-full h-16" />;
  }

  if (unbilledPrescriptionIds.length === 0) {
    return null;
  }

  const allPrescriptionIds = [
    ...new Set([...included, ...unbilledPrescriptionIds]),
  ];

  return (
    <div className="p-1 bg-indigo-100 rounded-md">
      <div className="bg-white border border-indigo-400 py-3 px-4 rounded-md">
        <div className="flex items-center gap-4 text-sm">
          {t("patient_has_unbilled_prescriptions_count", {
            count: unbilledPrescriptionIds.length,
          })}
          {allButton ? (
            allButton({ prescriptionIds: allPrescriptionIds })
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link
                href={`/medication_requests/patient/${patientId}/bill/prescriptions/${allPrescriptionIds.join(",")}?encounterId=${encounterId}`}
                replace
              >
                <ListPlus className="size-4" />
                {t("include_all")}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
