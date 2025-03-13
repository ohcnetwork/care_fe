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
import { Encounter } from "@/types/emr/encounter";
import { Symptom } from "@/types/emr/symptom/symptom";
import symptomApi from "@/types/emr/symptom/symptomApi";

import { SymptomTable } from "./SymptomTable";

interface SymptomsListProps {
  patientId: string;
  encounterId?: string;
  className?: string;
  hideFullViewButton?: boolean;
  encounter?: Encounter;
  readOnly?: boolean;
  overviewSection?: boolean;
}

export function SymptomsList({
  patientId,
  encounterId,
  className,
  encounter,
  hideFullViewButton = false,
  readOnly = false,
}: SymptomsListProps) {
  const [allSymptoms, setAllSymptoms] = useState<Symptom[]>([]);
  const [page, setPage] = useState(1);
  const limit = 14;

  const {
    data: symptoms,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["symptoms", patientId, encounterId],
    queryFn: query(symptomApi.listSymptoms, {
      pathParams: { patientId },
      queryParams: encounterId
        ? { encounter: encounterId, limit: limit }
        : { limit: limit },
    }),
  });

  useEffect(() => {
    if (symptoms?.results) {
      setAllSymptoms((prev) =>
        page === 1 ? symptoms.results : [...prev, ...symptoms.results],
      );
    }
  }, [symptoms, page]);

  const handleLoadMore = () => {
    setPage((prevPage) => prevPage + 1);
  };

  const hasMorePages = (symptoms?.count || 0) > page * limit;

  if (isLoading) {
    return (
      <SymptomListLayout
        readOnly={readOnly}
        hideFullViewButton={hideFullViewButton}
      >
        <CardContent className="px-2 pb-2">
          <Skeleton className="h-[100px] w-full" />
        </CardContent>
      </SymptomListLayout>
    );
  }

  const filteredSymptoms = allSymptoms?.filter(
    (symptom) => symptom.verification_status !== "entered_in_error",
  );

  const hasInActiveRecords = symptoms?.results?.some(
    (symptom) =>
      symptom.verification_status === "entered_in_error" ||
      symptom.clinical_status === "inactive" ||
      symptom.clinical_status === "resolved",
  );

  if (!filteredSymptoms?.length) {
    return (
      <SymptomListLayout
        hideFullViewButton={hideFullViewButton}
        readOnly={readOnly}
      >
        <CardContent className="px-2 pb-3 pt-2">
          <p className="text-gray-500">{t("no_symptoms_recorded")}</p>
        </CardContent>
      </SymptomListLayout>
    );
  }

  return (
    <SymptomListLayout
      className={className}
      hideFullViewButton={hideFullViewButton}
      readOnly={readOnly}
    >
      <SymptomTable
        symptoms={[
          ...filteredSymptoms.filter((symptom) => {
            if (symptom.verification_status === "entered_in_error") {
              return false;
            }

            if (!hideFullViewButton) {
              return (
                symptom.clinical_status !== "inactive" &&
                symptom.clinical_status !== "resolved"
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
              initialTab="symptoms"
              encounter={encounter}
            />
          )}
          {hideFullViewButton && hasMorePages && (
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
    </SymptomListLayout>
  );
}

const SymptomListLayout = ({
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
    <Card className={cn("border-none rounded-sm", className)}>
      <CardHeader className="flex justify-between flex-row px-4 pt-4 pb-2">
        <CardTitle>{t("symptoms")}</CardTitle>
        {!hideFullViewButton && (
          <div className="flex items-center gap-x-2">
            {!readOnly && (
              <Link
                href={`questionnaire/symptom`}
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
