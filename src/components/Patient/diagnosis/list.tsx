import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { PatientListSkeleton } from "@/components/Common/SkeletonComponents.tsx";

import query from "@/Utils/request/query";
import diagnosisApi from "@/types/emr/diagnosis/diagnosisApi";

import { DiagnosisTable } from "./DiagnosisTable";

interface DiagnosisListProps {
  patientId: string;
  encounterId?: string;
}

export function DiagnosisList({ patientId, encounterId }: DiagnosisListProps) {
  const { t } = useTranslation();

  const { data: diagnoses, isLoading } = useQuery({
    queryKey: ["diagnosis", patientId, encounterId],
    queryFn: query(diagnosisApi.listDiagnosis, {
      pathParams: { patientId },
      queryParams: encounterId ? { encounter: encounterId } : undefined,
    }),
  });

  if (isLoading) {
    return <PatientListSkeleton title={t("diagnosis")} />;
  }

  if (!diagnoses?.results?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("diagnosis")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {t("diagnosis_empty_message")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="p-0">
      <CardHeader className="px-4 py-0 pt-4">
        <CardTitle>{t("diagnosis")}</CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <DiagnosisTable diagnoses={diagnoses.results} />
      </CardContent>
    </Card>
  );
}
