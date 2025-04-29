import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { EncounterAccordionLayout } from "@/components/Patient/EncounterAccordionLayout";

import query from "@/Utils/request/query";
import symptomApi from "@/types/emr/symptom/symptomApi";

import { SymptomTable } from "./SymptomTable";

interface SymptomsListProps {
  patientId: string;
  encounterId?: string;
  className?: string;
  readOnly?: boolean;
}

export function SymptomsList({
  patientId,
  encounterId,
  className,
  readOnly = false,
}: SymptomsListProps) {
  const { t } = useTranslation();

  const [showEnteredInError, setShowEnteredInError] = useState(false);
  const { data: symptoms, isLoading } = useQuery({
    queryKey: ["symptoms", patientId, encounterId],
    queryFn: query(symptomApi.listSymptoms, {
      pathParams: { patientId },
      queryParams: encounterId ? { encounter: encounterId } : undefined,
    }),
  });

  if (isLoading) {
    return (
      <EncounterAccordionLayout
        title="symptoms"
        readOnly={readOnly}
        className={className}
        editLink={!readOnly ? "questionnaire/symptom" : undefined}
      >
        <Skeleton className="h-[100px] w-full" />
      </EncounterAccordionLayout>
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
    return null;
  }

  return (
    <EncounterAccordionLayout
      title="symptoms"
      readOnly={readOnly}
      className={className}
      editLink={!readOnly ? "questionnaire/symptom" : undefined}
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
    </EncounterAccordionLayout>
  );
}
