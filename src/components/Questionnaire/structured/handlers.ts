import {
  DataTypeFor,
  RequestTypeFor,
} from "@/components/Questionnaire/structured/types";

import { StructuredQuestionType } from "@/types/questionnaire/question";

interface StructuredHandlerContext {
  patientId: string;
  encounterId: string;
  facilityId?: string;
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

export const structuredHandlers: {
  [K in StructuredQuestionType]: StructuredHandler<K>;
} = {
  allergy_intolerance: {
    getRequests: (allergies, { patientId, encounterId }) => {
      return [
        {
          url: `/api/v1/patient/${patientId}/allergy_intolerance/upsert/`,
          method: "POST",
          body: {
            datapoints: allergies.map((allergy) => ({
              ...allergy,
              encounter: encounterId,
            })),
          },
          reference_id: "allergy_intolerance",
        },
      ];
    },
  },
  medication_request: {
    getRequests: (medications, { patientId, encounterId }) => {
      return [
        {
          url: `/api/v1/patient/${patientId}/medication/request/upsert/`,
          method: "POST",
          body: {
            datapoints: medications.map((medication) => ({
              ...medication,
              encounter: encounterId,
              patient: patientId,
            })),
          },
          reference_id: "medication_request",
        },
      ];
    },
  },
  medication_statement: {
    getRequests: (medications, { patientId, encounterId }) => {
      return [
        {
          url: `/api/v1/patient/${patientId}/medication/statement/upsert/`,
          method: "POST",
          body: {
            datapoints: medications.map((medication) => ({
              ...medication,
              encounter: encounterId,
              patient: patientId,
            })),
          },
          reference_id: "medication_statement",
        },
      ];
    },
  },
  symptom: {
    getRequests: (symptoms, { patientId, encounterId }) => {
      return [
        {
          url: `/api/v1/patient/${patientId}/symptom/upsert/`,
          method: "POST",
          body: {
            datapoints: symptoms.map((symptom) => ({
              ...symptom,
              encounter: encounterId,
            })),
          },
          reference_id: "symptom",
        },
      ];
    },
  },
  diagnosis: {
    getRequests: (diagnoses, { patientId, encounterId }) => {
      return [
        {
          url: `/api/v1/patient/${patientId}/diagnosis/upsert/`,
          method: "POST",
          body: {
            datapoints: diagnoses
              .filter((diagnosis) => diagnosis.dirty)
              .map((diagnosis) => ({
                ...diagnosis,
                encounter: encounterId,
              })),
          },
          reference_id: "diagnosis",
        },
      ];
    },
  },
  encounter: {
    getRequests: (encounters, { facilityId, patientId, encounterId }) => {
      if (!encounterId) return [];
      if (!facilityId) {
        throw new Error("Cannot create encounter without a facility");
      }
      return encounters.map((encounter) => {
        const body: RequestTypeFor<"encounter"> = {
          organizations: [],
          patient: patientId,
          status: encounter.status,
          encounter_class: encounter.encounter_class,
          period: encounter.period,
          hospitalization: encounter.hospitalization,
          priority: encounter.priority,
          external_identifier: encounter.external_identifier,
          facility: facilityId,
        };

        return {
          url: `/api/v1/encounter/${encounterId}/`,
          method: "PUT",
          body,
          reference_id: "encounter",
        };
      });
    },
  },
  appointment: {
    getRequests: (appointment, { facilityId, patientId }) => {
      const { reason_for_visit, slot_id } = appointment[0];
      return [
        {
          url: `/api/v1/facility/${facilityId}/slots/${slot_id}/create_appointment/`,
          method: "POST",
          body: {
            reason_for_visit,
            patient: patientId,
          },
          reference_id: "appointment",
        },
      ];
    },
  },
};

export const getStructuredRequests = <T extends StructuredQuestionType>(
  type: T,
  data: DataTypeFor<T>[],
  context: StructuredHandlerContext,
) => structuredHandlers[type].getRequests(data, context);
