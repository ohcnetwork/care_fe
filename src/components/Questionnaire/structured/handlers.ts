import { StructuredQuestionType } from "@/components/Questionnaire/data/StructuredFormData";
import {
  DataTypeFor,
  RequestTypeFor,
} from "@/components/Questionnaire/structured/types";

import { readFileAsDataURL } from "@/Utils/utils";

interface StructuredHandlerContext {
  patientId: string;
  encounterId?: string;
  facilityId?: string;
}

type StructuredHandler<T extends StructuredQuestionType> = {
  getRequests: (
    data: DataTypeFor<T>[],
    context: StructuredHandlerContext,
  ) => Promise<
    Array<{
      url: string;
      method: string;
      body: RequestTypeFor<T>;
      reference_id: string;
    }>
  >;
};

const sanitizeNote = (note?: string | null): string | undefined => {
  return note?.trim() ?? undefined;
};

export const structuredHandlers: {
  [K in StructuredQuestionType]: StructuredHandler<K>;
} = {
  allergy_intolerance: {
    getRequests: async (allergies, { patientId, encounterId }) => {
      if (!encounterId) {
        return [];
      }

      return [
        {
          url: `/api/v1/patient/${patientId}/allergy_intolerance/upsert/`,
          method: "POST",
          body: {
            datapoints: allergies.map((allergy) => ({
              ...allergy,
              note: sanitizeNote(allergy.note),
              encounter: encounterId,
            })),
          },
          reference_id: "allergy_intolerance",
        },
      ];
    },
  },
  medication_request: {
    getRequests: async (medications, { patientId, encounterId }) => {
      return [
        {
          url: `/api/v1/patient/${patientId}/medication/request/upsert/`,
          method: "POST",
          body: {
            datapoints: medications.map((medication) => ({
              ...medication,
              note: sanitizeNote(medication.note),
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
    getRequests: async (medications, { patientId, encounterId }) => {
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
    getRequests: async (symptoms, { patientId, encounterId }) => {
      if (!encounterId) {
        return [];
      }

      return [
        {
          url: `/api/v1/patient/${patientId}/symptom/upsert/`,
          method: "POST",
          body: {
            datapoints: symptoms.map((symptom) => ({
              ...symptom,
              note: sanitizeNote(symptom.note),
              encounter: encounterId,
            })),
          },
          reference_id: "symptom",
        },
      ];
    },
  },
  diagnosis: {
    getRequests: async (diagnoses, { patientId, encounterId }) => {
      if (!encounterId) {
        return [];
      }

      return [
        {
          url: `/api/v1/patient/${patientId}/diagnosis/upsert/`,
          method: "POST",
          body: {
            datapoints: diagnoses
              .filter((diagnosis) => diagnosis.dirty)
              .map((diagnosis) => ({
                ...diagnosis,
                note: sanitizeNote(diagnosis.note),
                encounter: encounterId,
              })),
          },
          reference_id: "diagnosis",
        },
      ];
    },
  },
  encounter: {
    getRequests: async (encounters, { facilityId, patientId, encounterId }) => {
      if (!encounterId) return [];
      if (!facilityId) {
        throw new Error("Cannot create encounter without a facility");
      }
      return encounters.map((encounter) => {
        const body: RequestTypeFor<"encounter"> = {
          patient: patientId,
          status: encounter.status,
          encounter_class: encounter.encounter_class,
          period: encounter.period,
          hospitalization: encounter.hospitalization,
          priority: encounter.priority,
          external_identifier: encounter.external_identifier,
          facility: facilityId,
          discharge_summary_advice: encounter.discharge_summary_advice,
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
    getRequests: async (appointment, { facilityId, patientId }) => {
      const { note, slot_id, tags } = appointment[0];
      return [
        {
          url: `/api/v1/facility/${facilityId}/slots/${slot_id}/create_appointment/`,
          method: "POST",
          body: {
            note,
            patient: patientId,
            tags,
          },
          reference_id: "appointment",
        },
      ];
    },
  },
  files: {
    getRequests: async (files, { encounterId }) =>
      await Promise.all(
        files.map(async (file) => {
          const base64 = (await readFileAsDataURL(file.file_data)).split(
            ",",
          )[1];
          return {
            url: `/api/v1/files/upload-file/`,
            method: "POST",
            body: {
              ...file,
              file_data: base64 as unknown as File,
              encounter: encounterId,
            },
            reference_id: "files",
          };
        }),
      ),
  },
  time_of_death: {
    getRequests: async (timeOfDeaths, { patientId }) => {
      return timeOfDeaths.map((timeOfDeath) => ({
        url: `/api/v1/patient/${patientId}/`,
        method: "PUT",
        body: {
          deceased_datetime: timeOfDeath,
        },
        reference_id: "time_of_death",
      }));
    },
  },
  charge_item: {
    getRequests: async (chargeItems, { facilityId, encounterId }) => {
      if (!encounterId) return [];
      return [
        {
          url: `/api/v1/facility/${facilityId}/charge_item/apply_charge_item_defs/`,
          method: "POST",
          body: {
            requests: chargeItems.map((chargeItem) => ({
              charge_item_definition: chargeItem.charge_item_definition,
              quantity: chargeItem.quantity,
              encounter: encounterId,
            })),
          },
          reference_id: "charge_item",
        },
      ];
    },
  },
  service_request: {
    getRequests: async (serviceRequests, { facilityId }) => {
      return serviceRequests.map((serviceRequest) => ({
        url: `/api/v1/facility/${facilityId}/service_request/apply_activity_definition/`,
        method: "POST",
        body: {
          ...serviceRequest,
        },
        reference_id: "service_request",
      }));
    },
  },
};

export const getStructuredRequests = async <T extends StructuredQuestionType>(
  type: T,
  data: DataTypeFor<T>[],
  context: StructuredHandlerContext,
) => await structuredHandlers[type].getRequests(data, context);
