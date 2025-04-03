import { useQuery } from "@tanstack/react-query";
import { t } from "i18next";
import { Link } from "raviger";
import { ReactNode, useState } from "react";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
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
  const [isExpanded, setIsExpanded] = useState(true);
  const { data: diagnoses, isLoading: isDiagnosesLoading } = useQuery({
    queryKey: ["encounter_diagnosis", patientId, encounterId],
    queryFn: query(diagnosisApi.listDiagnosis, {
      pathParams: { patientId },
      queryParams: {
        category: ["encounter_diagnosis"],
        clinical_status: ACTIVE_DIAGNOSIS_CLINICAL_STATUS.join(","),
        exclude_verification_status: "entered_in_error",
        ...(encounterId ? { encounter: encounterId } : {}),
      },
    }),
  });

  const { data: chronicConditions, isLoading: isChronicConditionsLoading } =
    useQuery({
      queryKey: ["chronic_condition", patientId, encounterId],
      queryFn: query(diagnosisApi.listDiagnosis, {
        pathParams: { patientId },
        queryParams: {
          category: "chronic_condition",
          clinical_status: ACTIVE_DIAGNOSIS_CLINICAL_STATUS.join(","),
          exclude_verification_status: "entered_in_error",
        },
      }),
    });

  if (!diagnoses?.results.length && !chronicConditions?.results.length) {
    return (
      <DiagnosisListLayout
        className={className}
        readOnly={readOnly}
        count={0}
        isExpanded={false}
        onToggle={() => setIsExpanded(!isExpanded)}
      >
        <></>
      </DiagnosisListLayout>
    );
  }

  return (
    <DiagnosisListLayout
      className={className}
      readOnly={readOnly}
      count={
        (diagnoses?.results?.length ?? 0) +
        (chronicConditions?.results?.length ?? 0)
      }
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
    >
      <div className="space-y-2">
        {isChronicConditionsLoading && (
          <CardContent className="px-2 pb-2">
            <Skeleton className="h-[100px] w-full" />
            <Skeleton className="h-[100px] w-full" />
          </CardContent>
        )}
        {chronicConditions?.results.length ? (
          <DiagnosisTable
            diagnoses={chronicConditions?.results}
            title={t("chronic_condition", {
              count: 2,
            })}
          />
        ) : null}
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
  count,
  isExpanded,
  onToggle,
}: {
  children: ReactNode;
  className?: string;
  readOnly?: boolean;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  return (
    <Card className={cn("rounded-sm ", className)}>
      <CardHeader
        className={cn(
          "px-4 pt-2 pb-2 flex justify-between flex-row space-y-0",
          count != 0 && "cursor-pointer",
        )}
        onClick={onToggle}
      >
        <div className="flex items-center">
          <Button size="icon" variant="link" disabled={count == 0}>
            {count > 0 && isExpanded ? (
              <CareIcon icon="l-angle-down" className="h-6 w-6" />
            ) : (
              <CareIcon icon="l-angle-right" className="h-6 w-6" />
            )}
          </Button>
          <CardTitle>{t("diagnoses_count", { count })}</CardTitle>
        </div>
        {!readOnly && (
          <Link
            href={`questionnaire/diagnosis`}
            className="flex items-center gap-1 text-sm hover:text-gray-500 text-gray-950"
          >
            <CareIcon icon="l-pen" className="w-4 h-4" />
            {t("edit")}
          </Link>
        )}
      </CardHeader>
      {isExpanded && (
        <CardContent className="px-2 pb-2">{children}</CardContent>
      )}
    </Card>
  );
};
