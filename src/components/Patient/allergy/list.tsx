import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  BeakerIcon,
  CookingPotIcon,
  HeartPulseIcon,
  LeafIcon,
} from "lucide-react";
import { ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";
import { EmptyState } from "@/components/Medicine/MedicationRequestTable";
import { EncounterAccordionLayout } from "@/components/Patient/EncounterAccordionLayout";

import query from "@/Utils/request/query";
import {
  AllergyCategory,
  AllergyIntolerance,
} from "@/types/emr/allergyIntolerance/allergyIntolerance";
import allergyIntoleranceApi from "@/types/emr/allergyIntolerance/allergyIntoleranceApi";
import {
  Encounter,
  completedEncounterStatus,
} from "@/types/emr/encounter/encounter";

import { AllergyTable } from "./AllergyTable";

interface AllergyListProps {
  facilityId?: string;
  patientId: string;
  encounterId?: string;
  className?: string;
  readOnly?: boolean;
  encounterStatus?: Encounter["status"];
  showTimeline?: boolean;
}
interface GroupedAllergies {
  [year: string]: {
    [date: string]: AllergyIntolerance[];
  };
}

export const CATEGORY_ICONS: Record<AllergyCategory, ReactNode> = {
  food: <CookingPotIcon className="size-4" aria-label="Food allergy" />,
  medication: <BeakerIcon className="size-4" aria-label="Medication allergy" />,
  environment: (
    <LeafIcon className="size-4" aria-label="Environmental allergy" />
  ),
  biologic: <HeartPulseIcon className="size-4" aria-label="Biologic allergy" />,
};

export function AllergyList({
  patientId,
  encounterId,
  className = "",
  readOnly = false,
  encounterStatus,
  showTimeline = false,
}: AllergyListProps) {
  const { t } = useTranslation();

  const [showEnteredInError, setShowEnteredInError] = useState(false);

  const { data: allergies, isLoading } = useQuery({
    queryKey: ["allergies", patientId, encounterId, encounterStatus],
    queryFn: query(allergyIntoleranceApi.getAllergy, {
      pathParams: { patientId },
      queryParams: {
        encounter:
          encounterStatus && completedEncounterStatus.includes(encounterStatus)
            ? encounterId
            : undefined,
      },
    }),
  });

  if (isLoading) {
    return <TableSkeleton count={5} />;
  }

  const filteredAllergies = allergies?.results?.filter(
    (allergy) =>
      showEnteredInError || allergy.verification_status !== "entered_in_error",
  );

  const hasEnteredInErrorRecords = allergies?.results?.some(
    (allergy) => allergy.verification_status === "entered_in_error",
  );

  if (!filteredAllergies?.length) {
    if (showTimeline) {
      return (
        <EmptyState
          message={t("no_allergies")}
          description={t("no_allergies_recorded_description")}
        />
      );
    }
    return null;
  }

  const allergiesRows = [
    ...filteredAllergies.filter(
      (allergy) => allergy.verification_status !== "entered_in_error",
    ),
    ...(showEnteredInError
      ? filteredAllergies.filter(
          (allergy) => allergy.verification_status === "entered_in_error",
        )
      : []),
  ];

  if (showTimeline) {
    const groupedByYear = filteredAllergies.reduce((acc, allergy) => {
      const dateStr = format(allergy.created_date, "dd MMMM, yyyy");
      const year = format(allergy.created_date, "yyyy");
      acc[year] ??= {};
      acc[year][dateStr] ??= [];
      if (allergy.verification_status !== "entered_in_error") {
        acc[year][dateStr].push(allergy);
      }
      return acc;
    }, {} as GroupedAllergies);

    return (
      <div className="space-y-8">
        {Object.entries(groupedByYear).map(([year, groupedByDate]) => {
          return (
            <div key={year}>
              <h2 className="text-sm font-medium text-indigo-700 border-y border-gray-300 py-2 w-fit pr-10">
                {year}
              </h2>
              <div className="border-l border-gray-300 pt-5 ml-4">
                {Object.entries(groupedByDate).map(([date, allergies]) => {
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
                          <AllergyTable allergies={allergies} />
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
    <EncounterAccordionLayout
      title="allergies"
      readOnly={readOnly}
      className={className}
      editLink={!readOnly ? "questionnaire/allergy_intolerance" : undefined}
    >
      <AllergyTable allergies={allergiesRows} />
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
    </EncounterAccordionLayout>
  );
}
