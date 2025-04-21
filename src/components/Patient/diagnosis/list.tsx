import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import query from "@/Utils/request/query";
import { ACTIVE_DIAGNOSIS_CLINICAL_STATUS } from "@/types/emr/diagnosis/diagnosis";
import diagnosisApi from "@/types/emr/diagnosis/diagnosisApi";

import { DiagnosisTable } from "./DiagnosisTable";

interface DiagnosisListProps {
  patientId: string;
  encounterId?: string;
  className?: string;
  readOnly?: boolean;
}

export function DiagnosisList({
  patientId,
  encounterId,
  className = "",
  readOnly = false,
}: DiagnosisListProps) {
  const { t } = useTranslation();

  const { data: diagnoses, isLoading: isDiagnosesLoading } = useQuery({
    queryKey: ["encounter_diagnosis", patientId, encounterId],
    queryFn: query(diagnosisApi.listDiagnosis, {
      pathParams: { patientId },
      queryParams: {
        category: "encounter_diagnosis,chronic_condition",
        clinical_status: ACTIVE_DIAGNOSIS_CLINICAL_STATUS.join(","),
        exclude_verification_status: "entered_in_error",
        ...(encounterId ? { encounter: encounterId } : {}),
      },
    }),
  });

  if (!diagnoses?.results.length) {
    return (
      <DiagnosisListLayout className={className} readOnly={readOnly}>
        <CardContent className="px-2 pb-3 pt-2">
          <p className="text-gray-500">{t("no_diagnoses_recorded")}</p>
        </CardContent>
      </DiagnosisListLayout>
    );
  }

  return (
    <DiagnosisListLayout className={className} readOnly={readOnly}>
      <div className="space-y-2">
        {isDiagnosesLoading && (
          <CardContent className="px-2 pb-2">
            <Skeleton className="h-[100px] w-full" />
            <Skeleton className="h-[100px] w-full" />
          </CardContent>
        )}
        {diagnoses?.results?.length ? (
          <DiagnosisTable diagnoses={diagnoses.results} />
        ) : null}
      </div>
    </DiagnosisListLayout>
  );
}

const DiagnosisListLayout = ({
  children,
  className,
  readOnly = false,
}: {
  children: ReactNode;
  className?: string;
  readOnly?: boolean;
}) => {
  const { t } = useTranslation();

  return (
    <Card className={cn("rounded-sm ", className)}>
      <CardHeader
        className={cn("px-4 pt-4 pb-2 flex justify-between flex-row")}
      >
        <CardTitle>{t("diagnoses")}</CardTitle>
        {!readOnly && (
          <Link
            href={`questionnaire/diagnosis`}
            className="flex items-center gap-1 text-sm hover:text-gray-500 text-gray-950"
          >
            <CareIcon icon="l-pen" className="size-4" />
            {t("edit")}
          </Link>
        )}
      </CardHeader>
      <CardContent className="px-2 pb-2">{children}</CardContent>
    </Card>
  );
};
