import { useQuery } from "@tanstack/react-query";
import { t } from "i18next";
import { Link } from "raviger";
import { ReactNode, useState } from "react";

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
  facilityId?: string;
  className?: string;
  hideFullViewButton?: boolean;
  encounter?: Encounter;
  readOnly?: boolean;
}

export function DiagnosisList({
  patientId,
  encounterId,
  facilityId,
  hideFullViewButton,
  encounter,
  className = "",
  readOnly = false,
}: DiagnosisListProps) {
  const [showEnteredInError, setShowEnteredInError] = useState(false);

  const { data: diagnoses, isLoading } = useQuery({
    queryKey: ["diagnosis", patientId, encounterId],
    queryFn: query(diagnosisApi.listDiagnosis, {
      pathParams: { patientId },
      queryParams: encounterId
        ? { encounter: encounterId, limit: 100 }
        : { limit: 100 },
    }),
  });

  if (isLoading) {
    return (
      <DiagnosisListLayout
        facilityId={facilityId}
        patientId={patientId}
        encounterId={encounterId}
        className={className}
        hideFullViewButton={hideFullViewButton}
        encounter={encounter}
      >
      <DiagnosisListLayout className={className} readOnly={readOnly}>
        <CardContent className="px-2 pb-2">
          <Skeleton className="h-[100px] w-full" />
        </CardContent>
      </DiagnosisListLayout>
    );
  }

  const filteredDiagnoses = diagnoses?.results?.filter(
    (diagnosis) =>
      showEnteredInError ||
      diagnosis.verification_status !== "entered_in_error",
  );

  const hasEnteredInErrorRecords = diagnoses?.results?.some(
    (diagnosis) => diagnosis.verification_status === "entered_in_error",
  );

  if (!filteredDiagnoses?.length) {
    return (
      <DiagnosisListLayout
        facilityId={facilityId}
        patientId={patientId}
        encounterId={encounterId}
        className={className}
        hideFullViewButton={hideFullViewButton}
      >
      <DiagnosisListLayout className={className} readOnly={readOnly}>
        <CardContent className="px-2 pb-3 pt-2">
          <p className="text-gray-500">{t("no_diagnoses_recorded")}</p>
        </CardContent>
      </DiagnosisListLayout>
    );
  }

  return (
    <DiagnosisListLayout
      facilityId={facilityId}
      patientId={patientId}
      encounterId={encounterId}
      className={className}
      hideFullViewButton={hideFullViewButton}
    >
    <DiagnosisListLayout className={className} readOnly={readOnly}>
      <>
        <DiagnosisTable
          diagnoses={[
            ...filteredDiagnoses.filter(
              (diagnosis) =>
                diagnosis.verification_status !== "entered_in_error",
            ),
            ...(showEnteredInError
              ? filteredDiagnoses.filter(
                  (diagnosis) =>
                    diagnosis.verification_status === "entered_in_error",
                )
              : []),
          ]}
        />

        {hasEnteredInErrorRecords && !showEnteredInError && (
          <>
            <div className="border-b border-dashed border-gray-200 my-2" />
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setShowEnteredInError(true)}
                className="text-xs underline text-gray-950"
              >
                {t("view_all")}
              </Button>
            </div>
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
  encounter,
  readOnly = false,
}: {
  children: ReactNode;
  className?: string;
  hideFullViewButton?: boolean;
  encounter?: Encounter;
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
            {!hideFullViewButton && encounterId && (
              <FullViewDialog
                patientId={patientId}
                encounterId={encounterId}
                facilityId={facilityId}
                initialTab="diagnoses"
                encounter={encounter}
              />
            )}
          </div>
      </CardHeader>
      <CardContent className="px-2 pb-2">{children}</CardContent>
    </Card>
  );
};
