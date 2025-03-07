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
import { Encounter } from "@/types/emr/encounter";
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
  hideFullViewButton,
  readOnly = false,
  overviewSection = true,
}: SymptomsListProps) {
  const [showEnteredInError, setShowEnteredInError] = useState(false);
  let limit;
  overviewSection ? (limit = 14) : (limit = 100);

  const { data: symptoms, isLoading } = useQuery({
    queryKey: ["symptoms", patientId, encounterId],
    queryFn: query(symptomApi.listSymptoms, {
      pathParams: { patientId },
      queryParams: encounterId
        ? { encounter: encounterId, limit: limit }
        : { limit: limit },
    }),
  });

  if (isLoading) {
    return (
      <SymptomListLayout
        patientId={patientId}
        encounterId={encounterId}
        readOnly={readOnly}
        hideFullViewButton={hideFullViewButton}
      >
        <CardContent className="px-2 pb-2">
          <Skeleton className="h-[100px] w-full" />
        </CardContent>
      </SymptomListLayout>
    );
  }

  const filteredSymptoms = symptoms?.results?.filter(
    (symptom) =>
      showEnteredInError || symptom.verification_status !== "entered_in_error",
  );

  const hasEnteredInErrorRecords = symptoms?.results?.some(
    (symptom) => symptom.verification_status === "entered_in_error",
  );

  if (!filteredSymptoms?.length) {
    return (
      <SymptomListLayout
        patientId={patientId}
        encounterId={encounterId}
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
      patientId={patientId}
      encounterId={encounterId}
      className={className}
      hideFullViewButton={hideFullViewButton}
      readOnly={readOnly}
    >
      <SymptomTable
        symptoms={[
          ...filteredSymptoms.filter(
            (symptom) => symptom.verification_status !== "entered_in_error",
          ),
          ...(showEnteredInError
            ? filteredSymptoms.filter(
                (symptom) => symptom.verification_status === "entered_in_error",
              )
            : []),
        ]}
      />

      {hasEnteredInErrorRecords && !showEnteredInError && (
        <>
          <div className="border-b border-dashed border-gray-200 my-2" />
          <div className="flex justify-center ">
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
    </SymptomListLayout>
  );
}

const SymptomListLayout = ({
  children,
  className,
  hideFullViewButton = false,
  encounter,
  encounterId,
  patientId,
  readOnly = false,
}: {
  patientId: string;
  encounterId?: string;
  children: ReactNode;
  className?: string;
  hideFullViewButton?: boolean;
  encounter?: Encounter;
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
            {!hideFullViewButton && encounterId && (
              <FullViewDialog
                patientId={patientId}
                encounterId={encounterId}
                initialTab="symptoms"
                encounter={encounter}
              />
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="px-2 pb-2">{children}</CardContent>
    </Card>
  );
};
