import { useInfiniteQuery } from "@tanstack/react-query";
import { t } from "i18next";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { EncounterAccordionLayout } from "@/components/Patient/EncounterAccordionLayout";

import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { Code } from "@/types/base/code/code";
import { Observation, ObservationWithUser } from "@/types/emr/observation";
import patientApi from "@/types/emr/patient/patientApi";

import { VitalsObservation, VitalsTable } from "./VitalsTable";

interface CodeGroup {
  codes: Code[];
  title: string;
}
interface VitalsListProps {
  patientId: string;
  encounterId: string;
  className?: string;
  codeGroups?: CodeGroup[];
}

interface GroupedObservations {
  [key: string]: Observation[];
}
const LIMIT = 50;
function extractVitals(observations: Observation[], vitalCodes: Code[]) {
  if (!observations || observations.length === 0) return [];
  // Group observations by effective_datetime
  const groupedObservations = observations.reduce(
    (groups: GroupedObservations, observation) => {
      const dateKey = new Date(observation.effective_datetime).toISOString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(observation);
      return groups;
    },
    {},
  );

  // Sort the grouped observations by date in descending order
  // so that the most recent observations come first
  const orderedGroupedObservations = Object.keys(groupedObservations)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    .map((date) => groupedObservations[date]);

  // Map the ordered observations to extract vital fields
  // and return an array of vital objects
  if (orderedGroupedObservations.length === 0) return [];

  const vitals = orderedGroupedObservations.map((ob) => {
    const vitalsObject: Record<string, VitalsObservation> = {};
    vitalCodes.forEach((code) => {
      if (code.display) {
        const vitalField = ob.find(
          (fields) => fields.main_code.code === code.code,
        );
        vitalsObject[code.display] = {
          value: vitalField?.value.value,
          unit: vitalField?.value.unit?.code,
        };
      }
    });
    return vitalsObject;
  });
  // Remove any vitals that are empty
  if (vitals.length === 0) return [];
  const filteredVitals = vitals.filter((vital) =>
    Object.values(vital).some(
      (field) => field.value !== undefined && field.value !== null,
    ),
  );
  return filteredVitals;
}
export const VitalsList = ({
  patientId,
  encounterId,
  codeGroups,
  className,
}: VitalsListProps) => {
  // Extract only relevant vital codes from the code groups excluding FiO2
  const vitalCodes = codeGroups?.flatMap((group) => group.codes) ?? [];
  const filteredVitalCodes = vitalCodes.filter(
    (code) => code.display && code.code !== "3151-8",
  );
  const { data, isLoading, hasNextPage, fetchNextPage } = useInfiniteQuery<
    PaginatedResponse<ObservationWithUser>
  >({
    queryKey: [
      "infinite-observations",
      patientId,
      filteredVitalCodes.map((c) => c.code).join(","),
    ],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await query(patientApi.listObservations, {
        pathParams: { patientId },
        queryParams: {
          encounter: encounterId,
          limit: String(LIMIT),
          codes: filteredVitalCodes.map((c) => c.code).join(","),
          offset: String(pageParam),
        },
      })({ signal: new AbortController().signal });
      return response as PaginatedResponse<ObservationWithUser>;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const currentOffset = allPages.length * LIMIT;
      return currentOffset < lastPage.count ? currentOffset : null;
    },
  });
  const vitals = extractVitals(
    data?.pages.flatMap((page) => page.results) || [],
    filteredVitalCodes,
  );
  if (isLoading) {
    return (
      <EncounterAccordionLayout
        title="vitals"
        readOnly={true}
        className={className}
      >
        <Skeleton className="h-[100px] w-full" />
      </EncounterAccordionLayout>
    );
  }
  if (!vitals || vitals.length === 0) return null;

  return (
    <EncounterAccordionLayout
      title="vitals"
      readOnly={true}
      className={className}
    >
      <div>
        <VitalsTable vitals={vitals} vitalCodes={filteredVitalCodes} />
      </div>
      {hasNextPage && (
        <div className="flex justify-center">
          <Button variant="ghost" size="xs" onClick={() => fetchNextPage()}>
            {t("view_all")}
          </Button>
        </div>
      )}
    </EncounterAccordionLayout>
  );
};
