import { useQuery } from "@tanstack/react-query";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { EncounterAccordionLayout } from "@/src/components/Patient/EncounterAccordionLayout";
import { Observation } from "@/types/emr/observation";

import { VitalsTable } from "./VitalsTable";

interface VitalsListProps {
  patientId: string;
  encounterId: string;
  className?: string;
  readOnly?: boolean;
}

interface GroupedObservations {
  [key: string]: Observation[];
}

export const VitalsList = ({ patientId, encounterId }: VitalsListProps) => {
  function groupObservationsByDate(
    observations: Observation[],
  ): GroupedObservations {
    return observations.reduce((groups: GroupedObservations, observation) => {
      const dateKey = new Date(observation.effective_datetime).toISOString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(observation);
      return groups;
    }, {});
  }
  function extractVitals(observations: Observation[]) {
    const groupedObservations = groupObservationsByDate(observations);
    return Object.entries(groupedObservations).map(([date, observations]) => ({
      date,
      observations,
    }));
  }
  console.log(extractVitals);
  const { data: vitals } = useQuery({
    queryKey: ["vitals", patientId, encounterId],
    queryFn: query(routes.listObservations, {
      pathParams: { patientId },
      queryParams: encounterId ? { encounter: encounterId } : undefined,
    }),
    select: (data: PaginatedResponse<Observation>) => {
      const grouped = groupObservationsByDate(data.results);
      const orderedGroupedObservations = Object.keys(grouped)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
        .map((date) => grouped[date]);
      console.log(orderedGroupedObservations);
      return orderedGroupedObservations;
    },
  });
  console.log(vitals);
  return (
    <EncounterAccordionLayout title="vitals" readOnly={true}>
      <VitalsTable />
    </EncounterAccordionLayout>
  );
};
