import { useQuery } from "@tanstack/react-query";

import { AllergyTable } from "@/components/Patient/allergy/AllergyTable";
import { DiagnosisTable } from "@/components/Patient/diagnosis/DiagnosisTable";
import { SymptomTable } from "@/components/Patient/symptoms/SymptomTable";

import query from "@/Utils/request/query";
import allergyApi from "@/types/emr/allergyIntolerance/allergyIntoleranceApi";
import diagnosisApi from "@/types/emr/diagnosis/diagnosisApi";
import symptomApi from "@/types/emr/symptom/symptomApi";
import { StructuredQuestionType } from "@/types/questionnaire/question";

type SupportedType = "symptom" | "diagnosis" | "allergy_intolerance";
type Props = {
  type: StructuredQuestionType;
  id: string;
  patientId: string;
  encounterId: string;
};

export function StructuredResponseView({
  type,
  id,
  patientId,
  encounterId,
}: Props) {
  const isSupportedType = (t: StructuredQuestionType): t is SupportedType => {
    return ["symptom", "diagnosis", "allergy_intolerance"].includes(t);
  };

  const basePathParams = { patientId };
  const queryParams = { encounter: encounterId };

  const getParams = (idKey: string) => ({
    pathParams: { ...basePathParams, [idKey]: id },
    queryParams,
  });

  const symptomQuery = useQuery({
    queryKey: ["symptom"],
    queryFn: query(symptomApi.retrieveSymptom, getParams("symptomId")),
    enabled: type === "symptom" && !!id,
  });

  const diagnosisQuery = useQuery({
    queryKey: ["diagnosis"],
    queryFn: query(diagnosisApi.retrieveDiagnosis, getParams("diagnosisId")),
    enabled: type === "diagnosis" && !!id,
  });

  const allergyQuery = useQuery({
    queryKey: ["allergy_intolerance"],
    queryFn: query(allergyApi.retrieveAllergy, getParams("allergyId")),
    enabled: type === "allergy_intolerance" && !!id,
  });

  if (!isSupportedType(type)) return null;

  const currentQuery = {
    symptom: symptomQuery,
    diagnosis: diagnosisQuery,
    allergy_intolerance: allergyQuery,
  }[type];

  if (currentQuery.error) {
    console.error(`Error loading ${type}:`, currentQuery.error);
    return <div>Error loading {type}</div>;
  }

  switch (type) {
    case "symptom":
      return (
        symptomQuery.data && <SymptomTable symptoms={[symptomQuery.data]} />
      );
    case "diagnosis":
      return (
        diagnosisQuery.data && (
          <DiagnosisTable diagnoses={[diagnosisQuery.data]} />
        )
      );
    case "allergy_intolerance":
      return (
        allergyQuery.data && <AllergyTable allergies={[allergyQuery.data]} />
      );
    default:
      return null;
  }
}
