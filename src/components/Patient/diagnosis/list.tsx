import { useQuery } from "@tanstack/react-query";
import { t } from "i18next";
import { PencilIcon } from "lucide-react";
import { Link } from "raviger";
import { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import query from "@/Utils/request/query";
import diagnosisApi from "@/types/emr/diagnosis/diagnosisApi";

import { DiagnosisTable } from "./DiagnosisTable";

interface DiagnosisListProps {
  patientId: string;
  encounterId?: string;
  facilityId?: string;
}

export function DiagnosisList({
  patientId,
  encounterId,
  facilityId,
}: DiagnosisListProps) {
  const { data: diagnoses, isLoading } = useQuery({
    queryKey: ["diagnosis", patientId, encounterId],
    queryFn: query(diagnosisApi.listDiagnosis, {
      pathParams: { patientId },
      queryParams: encounterId ? { encounter: encounterId } : undefined,
    }),
  });

  if (isLoading) {
    return (
      <DiagnosisListLayout
        facilityId={facilityId}
        patientId={patientId}
        encounterId={encounterId}
      >
        <Skeleton className="h-[100px] w-full" />
      </DiagnosisListLayout>
    );
  }

  if (!diagnoses?.results?.length) {
    return (
      <DiagnosisListLayout
        facilityId={facilityId}
        patientId={patientId}
        encounterId={encounterId}
      >
        <p className="text-muted-foreground">No diagnoses recorded</p>
      </DiagnosisListLayout>
    );
  }

  return (
    <DiagnosisListLayout
      facilityId={facilityId}
      patientId={patientId}
      encounterId={encounterId}
    >
      <DiagnosisTable diagnoses={diagnoses.results} />
    </DiagnosisListLayout>
  );
}

const DiagnosisListLayout = ({
  facilityId,
  patientId,
  encounterId,
  children,
}: {
  facilityId?: string;
  patientId: string;
  encounterId?: string;
  children: ReactNode;
}) => {
  return (
    <Card>
      <CardHeader className="px-4 py-0 pt-4 flex justify-between flex-row">
        <CardTitle>{t("diagnoses")}</CardTitle>
        {facilityId && encounterId && (
          <Link
            href={`/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/diagnosis`}
            className="flex items-center gap-1 text-sm hover:text-gray-500"
          >
            <PencilIcon size={12} />
            {t("edit")}
          </Link>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
};
