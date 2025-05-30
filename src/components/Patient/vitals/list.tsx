import { useQuery } from "@tanstack/react-query";

import { Skeleton } from "@/components/ui/skeleton";

import { EncounterAccordionLayout } from "@/components/Patient/EncounterAccordionLayout";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { Observation } from "@/types/emr/observation";

import { VitalsTable } from "./VitalsTable";

interface VitalsListProps {
  patientId: string;
  encounterId: string;
  className?: string;
}

interface GroupedObservations {
  [key: string]: Observation[];
}

function extractVitals(observations: Observation[]) {
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
  const orderedGroupedObservations = Object.keys(groupedObservations)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    .map((date) => groupedObservations[date]);

  const vitals = orderedGroupedObservations.map((ob) => ({
    bodyTemperature: ob.find(
      (fields) => fields.main_code.display === "Body temperature",
    )?.value.value,
    heartRate: ob.find((fields) => fields.main_code.display === "Heart rate")
      ?.value.value,
    diastolicBloodPressure: ob.find(
      (fields) => fields.main_code.display === "Diastolic blood pressure",
    )?.value.value,
    systolicBloodPressure: ob.find(
      (fields) => fields.main_code.display === "Systolic blood pressure",
    )?.value.value,
    oxygenSaturation: ob.find(
      (fields) => fields.main_code.display === "Oxygen saturation in Blood",
    )?.value.value,
    respiratoryRate: ob.find(
      (fields) => fields.main_code.display === "Respiratory rate",
    )?.value.value,
  }));
  return vitals;
}
export const VitalsList = ({
  patientId,
  encounterId,
  className,
}: VitalsListProps) => {
  const { data: vitals, isLoading } = useQuery({
    queryKey: ["vitals", patientId, encounterId],
    queryFn: query(routes.listObservations, {
      pathParams: { patientId },
      queryParams: encounterId ? { encounter: encounterId } : undefined,
    }),
    select: (data: PaginatedResponse<Observation>) =>
      extractVitals(data.results),
  });

  if (isLoading) {
    return (
      <EncounterAccordionLayout
        title="symptoms"
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
      <VitalsTable vitals={vitals} />
    </EncounterAccordionLayout>
  );
};
