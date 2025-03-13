import { useQuery } from "@tanstack/react-query";
import { t } from "i18next";
import { Link } from "raviger";
import { ReactNode } from "react";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { FullViewDialog } from "@/components/Patient/shared/FullViewDialog";

import query from "@/Utils/request/query";
import diagnosisApi from "@/types/emr/diagnosis/diagnosisApi";
import { Encounter } from "@/types/emr/encounter";

import { DiagnosisTable } from "./DiagnosisTable";

interface DiagnosisListProps {
  patientId: string;
  encounterId?: string;
  className?: string;
  hideFullViewButton?: boolean;
  encounter?: Encounter;
  readOnly?: boolean;
  overviewSection?: boolean;
}

export function DiagnosisList({
  patientId,
  encounterId,
  hideFullViewButton = false,
  encounter,
  className = "",
  readOnly = false,
  overviewSection = true,
}: DiagnosisListProps) {
  let limit;
  overviewSection ? (limit = 14) : (limit = 100);

  const { data: diagnoses, isLoading } = useQuery({
    queryKey: ["diagnosis", patientId, encounterId],
    queryFn: query(diagnosisApi.listDiagnosis, {
      pathParams: { patientId },
      queryParams: encounterId
        ? { encounter: encounterId, limit: limit }
        : { limit: limit },
    }),
  });

  if (isLoading) {
    return (
      <DiagnosisListLayout
        className={className}
        readOnly={readOnly}
        hideFullViewButton={hideFullViewButton}
      >
        <CardContent className="px-2 pb-2">
          <Skeleton className="h-[100px] w-full" />
        </CardContent>
      </DiagnosisListLayout>
    );
  }

  const filteredDiagnoses = diagnoses?.results?.filter(
    (diagnosis) => diagnosis.verification_status !== "entered_in_error",
  );

  const hasInActiveRecords = diagnoses?.results?.some(
    (diagnose) =>
      diagnose.verification_status === "entered_in_error" ||
      diagnose.clinical_status === "inactive" ||
      diagnose.clinical_status === "resolved",
  );

  if (!filteredDiagnoses?.length) {
    return (
      <DiagnosisListLayout
        className={className}
        readOnly={readOnly}
        hideFullViewButton={hideFullViewButton}
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
      hideFullViewButton={hideFullViewButton}
    >
      <>
        <DiagnosisTable
          diagnoses={[
            ...filteredDiagnoses.filter((diagnosis) => {
              if (diagnosis.verification_status === "entered_in_error") {
                return false;
              }

              if (!hideFullViewButton) {
                return (
                  diagnosis.clinical_status !== "inactive" &&
                  diagnosis.clinical_status !== "resolved"
                );
              }

              return true;
            }),
          ]}
        />

        {hasInActiveRecords && (
          <>
            {!hideFullViewButton && encounterId && (
              <FullViewDialog
                patientId={patientId}
                encounterId={encounterId}
                initialTab="diagnoses"
                encounter={encounter}
              />
            )}
            {hideFullViewButton && (
              <div>
                <div className="border-b border-dashed border-gray-200 my-2" />
                <div className="flex justify-center">
                  <Button
                    variant="ghost"
                    size="xs"
                    className="text-xs underline text-gray-950"
                  >
                    {t("load_more")}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </>
    </DiagnosisListLayout>
  );
}

const DiagnosisListLayout = ({
  children,
  className,
  hideFullViewButton = false,
  readOnly = false,
}: {
  children: ReactNode;
  className?: string;
  hideFullViewButton?: boolean;
  readOnly?: boolean;
}) => {
  return (
    <Card className={cn("rounded-sm ", className)}>
      <CardHeader
        className={cn("px-4 pt-4 pb-2 flex justify-between flex-row")}
      >
        <CardTitle>{t("diagnoses")}</CardTitle>
        {!hideFullViewButton && (
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
