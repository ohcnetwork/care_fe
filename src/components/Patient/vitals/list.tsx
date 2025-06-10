import { useQuery } from "@tanstack/react-query";

import { Skeleton } from "@/components/ui/skeleton";

import { EncounterAccordionLayout } from "@/components/Patient/EncounterAccordionLayout";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { Observation } from "@/types/emr/observation";
import { Code } from "@/types/questionnaire/code";

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
const LIMIT = 100;
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
  const vitalCodes =
    codeGroups
      ?.flatMap((group) => group.codes)
      .filter((code) => code.display && code.display !== "FiO2") || [];
  const { data: vitals, isLoading } = useQuery({
    queryKey: ["vitals", patientId, encounterId],
    queryFn: query(routes.listObservations, {
      pathParams: { patientId },
      queryParams: { encounter: encounterId, limit: LIMIT },
    }),
    select: (data: PaginatedResponse<Observation>) =>
      extractVitals(data.results, vitalCodes),
  });

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
      <VitalsTable vitals={vitals} vitalCodes={vitalCodes} />
    </EncounterAccordionLayout>
  );
};
