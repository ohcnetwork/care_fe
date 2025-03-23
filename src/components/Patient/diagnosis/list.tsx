import { useQuery } from "@tanstack/react-query";
import { t } from "i18next";
import { Link } from "raviger";
import { ReactNode, useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { FullViewDialog } from "@/components/Patient/shared/FullViewDialog";

import query from "@/Utils/request/query";
import {
  ACTIVE_DIAGNOSIS_CLINICAL_STATUS,
  Diagnosis,
  INACTIVE_DIAGNOSIS_CLINICAL_STATUS,
} from "@/types/emr/diagnosis/diagnosis";
import diagnosisApi from "@/types/emr/diagnosis/diagnosisApi";
import { Encounter } from "@/types/emr/encounter";

import { DiagnosisTable } from "./DiagnosisTable";

interface DiagnosisListProps {
  patientId: string;
  className?: string;
  dialogView?: boolean;
  encounter?: Encounter;
  readOnly?: boolean;
}

export function DiagnosisList({
  patientId,
  dialogView = false,
  encounter,
  className = "",
  readOnly = false,
}: DiagnosisListProps) {
  const [allDiagnoses, setAllDiagnoses] = useState<Diagnosis[]>([]);
  const [localDialogView, setLocalDialogView] = useState(dialogView);
  const [page, setPage] = useState(1);
  const limit = 14;

  const {
    data: diagnoses,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: [
      "encounter_diagnosis",
      patientId,
      encounter?.id,
      page,
      localDialogView,
    ],
    queryFn: query(diagnosisApi.listDiagnosis, {
      pathParams: { patientId },
      queryParams: {
        category: ["encounter_diagnosis"],
        limit: limit,
        offset: (page - 1) * limit,
        clinical_status: localDialogView
          ? undefined
          : ACTIVE_DIAGNOSIS_CLINICAL_STATUS.join(","),
        exclude_verification_status: "entered_in_error",
        ...(encounter?.id ? { encounter: encounter?.id } : {}),
      },
    }),
  });

  const { data: chronicConditions, isLoading: isChronicConditionsLoading } =
    useQuery({
      queryKey: ["chronic_condition", patientId, encounter?.id],
      queryFn: query(diagnosisApi.listDiagnosis, {
        pathParams: { patientId },
        queryParams: {
          category: "chronic_condition",
          clinical_status: ACTIVE_DIAGNOSIS_CLINICAL_STATUS.join(","),
          exclude_verification_status: "entered_in_error",
        },
      }),
    });

  const { data: inactiveCheckData } = useQuery({
    queryKey: ["inactiveDiagnosesCheck", patientId, encounter?.id],
    queryFn: query(diagnosisApi.listDiagnosis, {
      pathParams: { patientId },
      queryParams: {
        limit: 1,
        clinical_status: (
          INACTIVE_DIAGNOSIS_CLINICAL_STATUS as unknown as string[]
        ).join(","),
        exclude_verification_status: "entered_in_error",
        ...(encounter?.id ? { encounter: encounter?.id } : {}),
      },
    }),
  });

  useEffect(() => {
    if (diagnoses?.results) {
      setAllDiagnoses((prev) =>
        page === 1 ? diagnoses.results : [...prev, ...diagnoses.results],
      );
    }
  }, [diagnoses, page]);

  const handleLoadMore = () => {
    setPage((prevPage) => prevPage + 1);
  };

  const hasMorePages = (diagnoses?.count || 0) > page * limit;

  if (isLoading) {
    return (
      <DiagnosisListLayout
        className={className}
        readOnly={readOnly}
        dialogView={localDialogView}
      >
        <CardContent className="px-2 pb-2">
          <Skeleton className="h-[100px] w-full" />
        </CardContent>
      </DiagnosisListLayout>
    );
  }

  const hasInActiveRecords =
    inactiveCheckData?.results && inactiveCheckData.results.length > 0;

  if (!allDiagnoses?.length && !chronicConditions?.results.length) {
    return (
      <DiagnosisListLayout
        className={className}
        readOnly={readOnly}
        dialogView={localDialogView}
      >
        <CardContent className="px-2 pb-3 pt-2">
          <p className="text-gray-500">{t("no_diagnoses_recorded")}</p>
        </CardContent>
      </DiagnosisListLayout>
    );
  }

  return (
    <DiagnosisListLayout
      className={className}
      readOnly={readOnly}
      dialogView={localDialogView}
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
        {isLoading && (
          <CardContent className="px-2 pb-2">
            <Skeleton className="h-[100px] w-full" />
            <Skeleton className="h-[100px] w-full" />
          </CardContent>
        )}
        {diagnoses?.results?.length ? (
          <DiagnosisTable diagnoses={allDiagnoses} />
        ) : null}

        {hasInActiveRecords && (
          <>
            {!localDialogView && encounter?.id && (
              <FullViewDialog
                patientId={patientId}
                initialTab="diagnoses"
                encounter={encounter}
                onClose={() => {
                  setLocalDialogView(false);
                }}
              />
            )}
            {localDialogView && hasMorePages && (
              <div>
                <div className="border-b border-dashed border-gray-200 my-2" />
                <div className="flex justify-center">
                  <Button
                    variant="ghost"
                    size="xs"
                    className="text-xs underline text-gray-950"
                    onClick={handleLoadMore}
                    disabled={isFetching}
                  >
                    {isFetching ? t("loading...") : t("load_more")}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
        {chronicConditions?.results.length ? (
          <DiagnosisTable
            diagnoses={chronicConditions?.results}
            title={t("chronic_condition", {
              count: 2,
            })}
          />
        ) : null}
        {isLoading && (
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
  dialogView = false,
  readOnly = false,
}: {
  children: ReactNode;
  className?: string;
  dialogView?: boolean;
  readOnly?: boolean;
}) => {
  return (
    <Card className={cn("rounded-sm ", className)}>
      <CardHeader
        className={cn("px-4 pt-4 pb-2 flex justify-between flex-row")}
      >
        <CardTitle>{t("diagnoses")}</CardTitle>
        {!dialogView && (
          <div className="flex items-center gap-x-2">
            {!readOnly && (
              <Link
                href={`questionnaire/diagnosis`}
                className="flex items-center gap-1 text-sm hover:text-gray-500 text-gray-950"
              >
                <CareIcon icon="l-pen" className="w-4 h-4" />
                {t("edit")}
              </Link>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="px-2 pb-2">{children}</CardContent>
    </Card>
  );
};
