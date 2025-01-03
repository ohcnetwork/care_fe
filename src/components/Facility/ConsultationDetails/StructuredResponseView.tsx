import { useQuery } from "@tanstack/react-query";

import { AllergyTable } from "@/components/Patient/allergy/AllergyTable";
import { DiagnosisTable } from "@/components/Patient/diagnosis/DiagnosisTable";
import { SymptomTable } from "@/components/Patient/symptoms/SymptomTable";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { AllergyIntolerance } from "@/types/emr/allergyIntolerance";
import { Diagnosis } from "@/types/questionnaire/diagnosis";
import { Symptom } from "@/types/questionnaire/symptom";

interface Props {
  type: string;
  id: string;
  patientId: string;
}

export function StructuredResponseView({ type, id, patientId }: Props) {
  const getRouteAndParams = () => {
    const params: Record<string, string> = { patientId };
    switch (type) {
      case "symptom":
        return {
          route: routes.getSymptomById,
          pathParams: { ...params, symptomId: id },
        };
      case "diagnosis":
        return {
          route: routes.getDiagnosisById,
          pathParams: { ...params, diagnosisId: id },
        };
      case "allergy_intolerance":
        return {
          route: routes.getAllergyById,
          pathParams: { ...params, allergyId: id },
        };
      default:
        return null;
    }
  };

  const routeConfig = getRouteAndParams();

  const { data, isLoading, error } = useQuery({
    queryKey: [type, id],
    queryFn: query(routeConfig?.route as any, {
      pathParams: routeConfig?.pathParams || { patientId },
    }),
    enabled: !!id && !!routeConfig,
  });

  if (!routeConfig) return null;

  if (isLoading) {
    return <div className="animate-pulse h-20 bg-muted rounded-md" />;
  }

  if (error) {
    console.error(`Error loading ${type}:`, error);
    return <div>Error loading {type}</div>;
  }

  switch (type) {
    case "symptom":
      return (
        <SymptomTable
          symptoms={[data as unknown as Symptom]}
          showHeader={true}
        />
      );
    case "diagnosis":
      return (
        <DiagnosisTable
          diagnoses={[data as unknown as Diagnosis]}
          showHeader={true}
        />
      );
    case "allergy_intolerance":
      return (
        <AllergyTable
          allergies={[data as unknown as AllergyIntolerance]}
          showHeader={true}
        />
      );
    default:
      return null;
  }
}
