import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

  const [showEnteredInErrorOfDiagnoses, setShowEnteredInErrorOfDiagnoses] =
    useState(false);
  const [
    showEnteredInErrorOfChronicConditions,
    setShowEnteredInErrorOfChronicConditions,
  ] = useState(false);

  const { data: diagnoses, isLoading: isDiagnosesLoading } = useQuery({
    queryKey: ["encounter_diagnosis", patientId, encounterId],
    queryFn: query(diagnosisApi.listDiagnosis, {
      pathParams: { patientId },
      queryParams: {
        category: ["encounter_diagnosis"],
        clinical_status: ACTIVE_DIAGNOSIS_CLINICAL_STATUS.join(","),
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
        },
      }),
    });

  if (isChronicConditionsLoading || isDiagnosesLoading) {
    return (
      <DiagnosisListLayout readOnly={readOnly} className={className}>
        <CardContent className="px-2 pb-2">
          <Skeleton className="h-[100px] w-full" />
        </CardContent>
      </DiagnosisListLayout>
    );
  }

  const filteredDiagnoses = diagnoses?.results?.filter(
    (diagnose) =>
      showEnteredInErrorOfDiagnoses ||
      diagnose.verification_status !== "entered_in_error",
  );

  const filteredChronicConditions = chronicConditions?.results?.filter(
    (chronicCondition) =>
      showEnteredInErrorOfChronicConditions ||
      chronicCondition.verification_status !== "entered_in_error",
  );

  const hasEnteredInErrorOfDiagnoses = diagnoses?.results?.some(
    (diagnose) => diagnose.verification_status === "entered_in_error",
  );

  const hasEnteredInErrorOfChronicConditions = chronicConditions?.results?.some(
    (chronicCondition) =>
      chronicCondition.verification_status === "entered_in_error",
  );

  if (!filteredDiagnoses?.length && !filteredChronicConditions?.length) {
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
        {isChronicConditionsLoading && (
          <CardContent className="px-2 pb-2">
            <Skeleton className="h-[100px] w-full" />
            <Skeleton className="h-[100px] w-full" />
          </CardContent>
        )}
        {filteredChronicConditions?.length ? (
          <DiagnosisTable
            diagnoses={[
              ...(filteredChronicConditions || []).filter(
                (chronicConditions) =>
                  chronicConditions.verification_status !== "entered_in_error",
              ),
              ...(showEnteredInErrorOfChronicConditions
                ? (filteredChronicConditions || []).filter(
                    (chronicConditions) =>
                      chronicConditions.verification_status ===
                      "entered_in_error",
                  )
                : []),
            ]}
            title={t("chronic_condition", {
              count: 2,
            })}
          />
        ) : null}
        {hasEnteredInErrorOfChronicConditions &&
          (filteredChronicConditions || []).length > 0 &&
          !showEnteredInErrorOfChronicConditions && (
            <>
              <div className="border-b border-dashed border-gray-200 my-2" />
              <div className="flex justify-center ">
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => setShowEnteredInErrorOfChronicConditions(true)}
                  className="text-xs underline text-gray-950"
                >
                  {t("view_all")}
                </Button>
              </div>
            </>
          )}
        {isDiagnosesLoading && (
          <CardContent className="px-2 pb-2">
            <Skeleton className="h-[100px] w-full" />
            <Skeleton className="h-[100px] w-full" />
          </CardContent>
        )}
        {filteredDiagnoses?.length ? (
          <DiagnosisTable
            diagnoses={[
              ...(filteredDiagnoses || []).filter(
                (diagnose) =>
                  diagnose.verification_status !== "entered_in_error",
              ),
              ...(showEnteredInErrorOfDiagnoses
                ? (filteredDiagnoses || []).filter(
                    (diagnose) =>
                      diagnose.verification_status === "entered_in_error",
                  )
                : []),
            ]}
          />
        ) : null}
        {hasEnteredInErrorOfDiagnoses &&
          (filteredDiagnoses || []).length > 0 &&
          !showEnteredInErrorOfDiagnoses && (
            <>
              <div className="border-b border-dashed border-gray-200 my-2" />
              <div className="flex justify-center ">
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => setShowEnteredInErrorOfDiagnoses(true)}
                  className="text-xs underline text-gray-950"
                >
                  {t("view_all")}
                </Button>
              </div>
            </>
          )}
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
