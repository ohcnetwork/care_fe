import { useQuery } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import query from "@/Utils/request/query";
import symptomApi from "@/types/emr/symptom/symptomApi";

import { SymptomTable } from "./SymptomTable";

interface SymptomsListProps {
  patientId: string;
  encounterId?: string;
}

export function SymptomsList({ patientId, encounterId }: SymptomsListProps) {
  const { data: symptoms, isLoading } = useQuery({
    queryKey: ["symptoms", patientId, encounterId],
    queryFn: query(symptomApi.listSymptoms, {
      pathParams: { patientId },
      queryParams: encounterId ? { encounter: encounterId } : undefined,
    }),
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Symptoms</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[100px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!symptoms?.results?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Symptoms</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No symptoms recorded</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="p-0">
      <CardHeader className="px-4 py-0 pt-4">
        <CardTitle>Symptoms</CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <SymptomTable symptoms={symptoms.results} />
      </CardContent>
    </Card>
  );
}
