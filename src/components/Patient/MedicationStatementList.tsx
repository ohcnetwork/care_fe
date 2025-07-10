import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";
import { EmptyState } from "@/components/Medicine/MedicationRequestTable";

import query from "@/Utils/request/query";
import { MedicationStatementRead } from "@/types/emr/medicationStatement";
import medicationStatementApi from "@/types/emr/medicationStatement/medicationStatementApi";

import { MedicationStatementTable } from "./MedicationStatementTable";

interface MedicationStatementListProps {
  patientId: string;
  canAccess: boolean;
  className?: string;
  showTimeLine?: boolean;
  encounterId?: string;
}
interface GroupedMedications {
  [year: string]: {
    [date: string]: MedicationStatementRead[];
  };
}

export function MedicationStatementList({
  patientId,
  canAccess,
  className = "",
  showTimeLine = false,
  encounterId,
}: MedicationStatementListProps) {
  const { t } = useTranslation();
  const [showEnteredInError, setShowEnteredInError] = useState(false);

  const { data: medications, isLoading } = useQuery({
    queryKey: ["medication_statements", patientId, encounterId],
    queryFn: query(medicationStatementApi.list, {
      pathParams: { patientId },
    }),
    enabled: canAccess,
  });

  if (isLoading) {
    return (
      <MedicationStatementListLayout className={className}>
        <TableSkeleton count={5} />
      </MedicationStatementListLayout>
    );
  }

  const filteredMedications = medications?.results?.filter(
    (medication) =>
      showEnteredInError || medication.status !== "entered_in_error",
  );

  const hasEnteredInErrorRecords = medications?.results?.some(
    (medication) => medication.status === "entered_in_error",
  );

  if (!filteredMedications?.length) {
    if (showTimeLine) {
      return (
        <EmptyState
          message={t("no_medication_statements")}
          description={t("no_medication_statements_recorded_description")}
        />
      );
    }
    return (
      <MedicationStatementListLayout className={className}>
        <p className="text-gray-500">{t("no_medication_statements")}</p>
      </MedicationStatementListLayout>
    );
  }

  const statments = [
    ...filteredMedications.filter(
      (medication) => medication.status !== "entered_in_error",
    ),
    ...(showEnteredInError
      ? filteredMedications.filter(
          (medication) => medication.status === "entered_in_error",
        )
      : []),
  ];

  if (showTimeLine) {
    const groupedByYear = filteredMedications.reduce((acc, medication) => {
      const dateStr = format(medication.created_date, "dd MMMM, yyyy");
      const year = format(medication.created_date, "yyyy");
      acc[year] ??= {};
      acc[year][dateStr] ??= [];
      acc[year][dateStr].push(medication);
      return acc;
    }, {} as GroupedMedications);

    return (
      <div className="space-y-8">
        {Object.entries(groupedByYear).map(([year, groupedByDate]) => {
          return (
            <div key={year}>
              <h2 className="text-sm font-medium text-indigo-700 border-y border-gray-300 py-2 w-fit pr-10">
                {year}
              </h2>
              <div className="border-l border-gray-300 pt-5 ml-4">
                {Object.entries(groupedByDate).map(([date, medications]) => {
                  return (
                    <div key={date} className="pb-6">
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center h-full">
                          <div className="size-3 bg-cyan-300 ring-1 ring-cyan-700 rounded-full flex-shrink-0 -ml-1.5 mt-1"></div>
                        </div>

                        <div className="space-y-3 overflow-auto w-full">
                          <h3 className="text-sm font-medium text-indigo-700">
                            {format(date, "dd MMMM, yyyy")}
                          </h3>
                          <MedicationStatementTable
                            statements={medications}
                            isEnteredInError={showEnteredInError}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <MedicationStatementListLayout
      medicationsCount={filteredMedications.length}
      className={className}
    >
      <MedicationStatementTable
        statements={statments}
        isEnteredInError={showEnteredInError}
      />
      <>
        {hasEnteredInErrorRecords && !showEnteredInError && (
          <>
            <div className="border-b border-dashed border-gray-200 my-2" />
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setShowEnteredInError(true)}
                className="text-xs underline text-gray-500"
              >
                {t("view_all")}
              </Button>
            </div>
          </>
        )}
      </>
    </MedicationStatementListLayout>
  );
}

const MedicationStatementListLayout = ({
  children,
  className,
  medicationsCount,
}: {
  children: React.ReactNode;
  className?: string;
  medicationsCount?: number | undefined;
}) => {
  const { t } = useTranslation();

  return (
    <Card className={cn("rounded-sm ", className)}>
      <CardHeader className="px-4 pt-4 pb-2">
        <CardTitle>
          {t("medication_statements")}{" "}
          {medicationsCount ? `(${medicationsCount})` : ""}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-2">{children}</CardContent>
    </Card>
  );
};
