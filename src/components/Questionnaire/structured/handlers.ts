import {
  DataTypeFor,
  RequestTypeFor,
} from "@/components/Questionnaire/structured/types";

import { StructuredQuestionType } from "@/types/questionnaire/question";

interface StructuredHandlerContext {
  resourceId: string;
  encounterId: string;
}

type StructuredHandler<T extends StructuredQuestionType> = {
  getRequests: (
    data: DataTypeFor<T>[],
    context: StructuredHandlerContext,
  ) => Array<{
    url: string;
    method: string;
    body: RequestTypeFor<T>;
    reference_id: string;
  }>;
};

const handlers: {
  [K in StructuredQuestionType]: StructuredHandler<K>;
} = {
  allergy_intolerance: {
    getRequests: (allergies, { resourceId, encounterId }) =>
      allergies.map((allergy) => {
        // Ensure all required fields have default values
        const body: RequestTypeFor<"allergy_intolerance"> = {
          clinical_status: allergy.clinical_status ?? "active",
          verification_status: allergy.verification_status ?? "unconfirmed",
          category: allergy.category ?? "medication",
          criticality: allergy.criticality ?? "low",
          code: allergy.code,
          last_occurrence: allergy.last_occurrence,
          note: allergy.note,
          encounter: encounterId,
        };

        return {
          url: `/api/v1/patient/${resourceId}/allergy_intolerance/`,
          method: "POST",
          body,
          reference_id: "allergy_intolerance",
        };
      }),
  },
  medication_request: {
    getRequests: (medications, { encounterId }) => {
      return [
        {
          url: `/api/v1/consultation/${encounterId}/medication/request/upsert/`,
          method: "POST",
          body: { datapoints: medications },
          reference_id: "medication_request",
        },
      ];
    },
  },
  symptom: {
    getRequests: (symptoms, { resourceId, encounterId }) =>
      symptoms.map((symptom) => {
        const body: RequestTypeFor<"symptom"> = {
          clinical_status: symptom.clinical_status,
          verification_status: symptom.verification_status,
          code: symptom.code,
          severity: symptom.severity,
          onset: symptom.onset,
          recorded_date: symptom.recorded_date,
          note: symptom.note,
          encounter: encounterId,
        };

        return {
          url: `/api/v1/patient/${resourceId}/symptom/`,
          method: "POST",
          body,
          reference_id: "symptom",
        };
      }),
  },
  diagnosis: {
    getRequests: (diagnoses, { resourceId, encounterId }) =>
      diagnoses.map((diagnosis) => {
        const body: RequestTypeFor<"diagnosis"> = {
          clinical_status: diagnosis.clinical_status,
          verification_status: diagnosis.verification_status,
          code: diagnosis.code,
          onset: diagnosis.onset,
          recorded_date: diagnosis.recorded_date,
          note: diagnosis.note,
          encounter: encounterId,
        };

        return {
          url: `/api/v1/patient/${resourceId}/diagnosis/`,
          method: "POST",
          body,
          reference_id: "diagnosis",
        };
      }),
  },
};

export const getStructuredRequests = <T extends StructuredQuestionType>(
  type: T,
  data: DataTypeFor<T>[],
  context: StructuredHandlerContext,
) => handlers[type].getRequests(data, context);
