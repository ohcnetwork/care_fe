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
  const getVitalField = (observations: Observation[], displayName: string) => ({
    value: observations.find(
      (fields) => fields.main_code.display === displayName,
    )?.value.value,
    unit: observations.find(
      (fields) => fields.main_code.display === displayName,
    )?.value.unit?.code,
  });
  // Sort the grouped observations by date in descending order
  // so that the most recent observations come first
  const orderedGroupedObservations = Object.keys(groupedObservations)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    .map((date) => groupedObservations[date]);
  // Map the ordered observations to extract vital fields
  // and return an array of vital objects
  const vitals = orderedGroupedObservations.map((ob) => ({
    bodyTemperature: getVitalField(ob, "Body temperature"),
    heartRate: getVitalField(ob, "Heart rate"),
    diastolicBloodPressure: getVitalField(ob, "Diastolic blood pressure"),
    systolicBloodPressure: getVitalField(ob, "Systolic blood pressure"),
    oxygenSaturation: getVitalField(
      ob,
      "Oxygen saturation in arterial blood by pulse oximetry",
    ),
    respiratoryRate: getVitalField(ob, "Respiratory rate"),
  }));
  // Filter out vitals that have no values for all fields
  if (vitals.length === 0) return [];
  const filteredVitals = vitals.filter(
    (vital) =>
      vital.bodyTemperature.value ||
      vital.heartRate.value ||
      vital.diastolicBloodPressure.value ||
      vital.systolicBloodPressure.value ||
      vital.oxygenSaturation.value ||
      vital.respiratoryRate.value,
  );
  return filteredVitals;
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
