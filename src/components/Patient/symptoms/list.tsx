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
import { Encounter, completedEncounterStatus } from "@/types/emr/encounter";
import { Symptom } from "@/types/emr/symptom/symptom";
import symptomApi from "@/types/emr/symptom/symptomApi";

import { SymptomTable } from "./SymptomTable";

interface SymptomsListProps {
  patientId: string;
  className?: string;
  dialogView?: boolean;
  encounter?: Encounter;
  readOnly?: boolean;
}

export function SymptomsList({
  patientId,
  className,
  encounter,
  dialogView = false,
  readOnly = false,
}: SymptomsListProps) {
  const [allSymptoms, setAllSymptoms] = useState<Symptom[]>([]);
  const [localDialogView, setLocalDialogView] = useState(dialogView);
  const [page, setPage] = useState(1);
  const limit = 14;

  const {
    data: symptoms,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["symptoms", patientId, encounter?.id, page, localDialogView],
    queryFn: query(symptomApi.listSymptoms, {
      pathParams: { patientId },
      queryParams: {
        encounter: completedEncounterStatus.includes(
          encounter?.status as string,
        )
          ? encounter?.id
          : undefined,
        limit: limit,
        offset: (page - 1) * limit,
        clinical_status: localDialogView ? undefined : "active",
      },
    }),
  });

  const filteredSymptoms = allSymptoms?.filter(
    (symptom) => symptom.verification_status !== "entered_in_error",
  );

  const hasEnteredInErrorEntry = allSymptoms.some(
    (symptom) => symptom.verification_status === "entered_in_error",
  );

  const { data: inactiveCheckData } = useQuery({
    queryKey: ["inactiveSymptomsCheck", patientId, encounter?.id],
    queryFn: query(symptomApi.listSymptoms, {
      pathParams: { patientId },
      queryParams: {
        encounter: completedEncounterStatus.includes(
          encounter?.status as string,
        )
          ? encounter?.id
          : undefined,
        limit: 1,
        clinical_status: "inactive",
      },
    }),
  });

  const { data: resolvedCheckData } = useQuery({
    queryKey: ["resolvedSymptomsCheck", patientId, encounter?.id],
    queryFn: query(symptomApi.listSymptoms, {
      pathParams: { patientId },
      queryParams: {
        encounter: completedEncounterStatus.includes(
          encounter?.status as string,
        )
          ? encounter?.id
          : undefined,
        limit: 1,
        clinical_status: "resolved",
      },
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
        className={className}
        dialogView={localDialogView}
      >
        <CardContent className="px-2 pb-2">
          <Skeleton className="h-[100px] w-full" />
        </CardContent>
      </SymptomListLayout>
    );
  }

  const hasInActiveRecords =
    (inactiveCheckData?.results && inactiveCheckData.results.length > 0) ||
    (resolvedCheckData?.results && resolvedCheckData.results.length > 0) ||
    hasEnteredInErrorEntry;

  if (!filteredSymptoms?.length) {
    return (
      <SymptomListLayout
        dialogView={localDialogView}
        className={className}
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
      dialogView={localDialogView}
      readOnly={readOnly}
    >
      <SymptomTable
        symptoms={[
          ...filteredSymptoms.filter((symptom) => {
            if (symptom.verification_status === "entered_in_error") {
              return false;
            }

            return true;
          }),
        ]}
      />

      {hasInActiveRecords && (
        <>
          {!localDialogView && encounter?.id && (
            <FullViewDialog
              patientId={patientId}
              initialTab="symptoms"
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
    </SymptomListLayout>
  );
}

const SymptomListLayout = ({
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
    <Card className={cn("border-none rounded-sm", className)}>
      <CardHeader className="flex justify-between flex-row px-4 pt-4 pb-2">
        <CardTitle>{t("symptoms")}</CardTitle>
        {!dialogView && (
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
