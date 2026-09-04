import { StructuredQuestionType } from "@/components/Questionnaire/data/StructuredFormData";
import {
  DataTypeFor,
  RequestTypeFor,
} from "@/components/Questionnaire/structured/types";
import chargeItemApi from "@/types/billing/chargeItem/chargeItemApi";
import allergyIntoleranceApi from "@/types/emr/allergyIntolerance/allergyIntoleranceApi";
import diagnosisApi from "@/types/emr/diagnosis/diagnosisApi";
import encounterApi from "@/types/emr/encounter/encounterApi";
import medicationRequestApi from "@/types/emr/medicationRequest/medicationRequestApi";
import medicationStatementApi from "@/types/emr/medicationStatement/medicationStatementApi";
import patientApi from "@/types/emr/patient/patientApi";
import { PrescriptionStatus } from "@/types/emr/prescription/prescription";
import serviceRequestApi from "@/types/emr/serviceRequest/serviceRequestApi";
import symptomApi from "@/types/emr/symptom/symptomApi";
import fileApi from "@/types/files/fileApi";
import scheduleApis from "@/types/scheduling/scheduleApi";

import { BatchRequestObject } from "@/Utils/request/batch";
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
  ) => Promise<Array<BatchRequestObject<RequestTypeFor<T>>>>;
};

const sanitizeNote = (note?: string | null): string | undefined => {
  return note?.trim() ?? undefined;
};

export const structuredHandlers: {
  [K in StructuredQuestionType]: StructuredHandler<K>;
} = {
  allergy_intolerance: {
    getRequests: async (allergies, { patientId, encounterId }) => {
      if (!encounterId || allergies.length === 0) {
        return [];
      }

      return [
        {
          api: allergyIntoleranceApi.upsertAllergy,
          pathParams: { patientId },
          body: {
            datapoints: allergies.map((allergy) => ({
              ...allergy,
              note: sanitizeNote(allergy.note),
              encounter: encounterId,
            })),
          },
          referenceId: "allergy_intolerance",
        },
      ];
    },
  },
  medication_request: {
    getRequests: async (medications, { patientId, encounterId }) => {
      // Only submit medications that have been modified (dirty)
      const dirtyMedications = medications.filter((m) => m.dirty);

      if (dirtyMedications.length === 0) {
        return [];
      }

      const prescriptionIdentifier = `${encounterId}-${new Date().toISOString().replace(/[:.]/g, "-")}`;

      return [
        {
          api: medicationRequestApi.upsert,
          pathParams: { patientId },
          body: {
            datapoints: dirtyMedications.map((medication) => ({
              ...medication,
              ...(!medication.id && {
                create_prescription: {
                  ...medication.create_prescription,
                  status: PrescriptionStatus.active,
                  alternate_identifier: prescriptionIdentifier,
                },
              }),
              note: sanitizeNote(medication.note),
              encounter: encounterId,
              patient: patientId,
              requester: medication.requester?.id,
            })),
          },
          referenceId: "medication_request",
        },
      ];
    },
  },
  medication_statement: {
    getRequests: async (medications, { patientId, encounterId }) => {
      if (medications.length === 0) {
        return [];
      }

      return [
        {
          api: medicationStatementApi.upsert,
          pathParams: { patientId },
          body: {
            datapoints: medications.map((medication) => ({
              ...medication,
              encounter: encounterId,
              patient: patientId,
            })),
          },
          referenceId: "medication_statement",
        },
      ];
    },
  },
  symptom: {
    getRequests: async (symptoms, { patientId, encounterId }) => {
      if (!encounterId || symptoms.length === 0) {
        return [];
      }

      return [
        {
          api: symptomApi.upsertSymptoms,
          pathParams: { patientId },
          body: {
            datapoints: symptoms.map((symptom) => ({
              ...symptom,
              note: sanitizeNote(symptom.note),
              encounter: encounterId,
            })),
          },
          referenceId: "symptom",
        },
      ];
    },
  },
  diagnosis: {
    getRequests: async (diagnoses, { patientId, encounterId }) => {
      const results = diagnoses.filter((diagnosis) => diagnosis.dirty);

      if (!encounterId || results.length === 0) {
        return [];
      }

      return [
        {
          api: diagnosisApi.upsertDiagnosis,
          pathParams: { patientId },
          body: {
            datapoints: results.map((diagnosis) => ({
              ...diagnosis,
              note: sanitizeNote(diagnosis.note),
              encounter: encounterId,
            })),
          },
          referenceId: "diagnosis",
        },
      ];
    },
  },
  encounter: {
    getRequests: async (encounters, { facilityId, encounterId }) => {
      if (!encounterId) return [];
      if (!facilityId) {
        throw new Error("Cannot create encounter without a facility");
      }
      return encounters.map((encounter) => {
        const body: RequestTypeFor<"encounter"> = {
          status: encounter.status,
          period: encounter.period,
          hospitalization: encounter.hospitalization,
          priority: encounter.priority,
          external_identifier: encounter.external_identifier,
          discharge_summary_advice: encounter.discharge_summary_advice,
        };

        return {
          api: encounterApi.update,
          pathParams: { id: encounterId },
          body,
          referenceId: "encounter",
        };
      });
    },
  },
  appointment: {
    getRequests: async (appointment, { facilityId, patientId }) => {
      const { note, slot_id, tags } = appointment[0];
      return [
        {
          api: scheduleApis.slots.createAppointment,
          pathParams: { facilityId: facilityId!, slotId: slot_id },
          body: {
            note,
            patient: patientId,
            tags,
          },
          referenceId: "appointment",
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
            api: fileApi.uploadFile,
            body: {
              ...file,
              file_data: base64,
              encounter: encounterId,
            },
            referenceId: "files",
          };
        }),
      ),
  },
  time_of_death: {
    getRequests: async (timeOfDeaths, { patientId }) => {
      return timeOfDeaths.map((timeOfDeath) => ({
        api: patientApi.update,
        pathParams: { id: patientId },
        body: {
          deceased_datetime: timeOfDeath,
        },
        referenceId: "time_of_death",
      }));
    },
  },
  charge_item: {
    getRequests: async (chargeItems, { facilityId }) => {
      return [
        {
          api: chargeItemApi.applyChargeItemDefinitions,
          pathParams: { facilityId: facilityId! },
          body: {
            requests: chargeItems,
          },
          referenceId: "charge_item",
        },
      ];
    },
  },
  service_request: {
    getRequests: async (serviceRequests, { facilityId }) => {
      return serviceRequests.map((serviceRequest) => ({
        api: serviceRequestApi.applyActivityDefinition,
        pathParams: { facilityId: facilityId! },
        body: {
          ...serviceRequest,
          service_request: {
            ...serviceRequest.service_request,
            requester: serviceRequest.service_request.requester.id,
          },
        },
        referenceId: "service_request",
      }));
    },
  },
};

export const getStructuredRequests = async <T extends StructuredQuestionType>(
  type: T,
  data: DataTypeFor<T>[],
  context: StructuredHandlerContext,
) => await structuredHandlers[type].getRequests(data, context);
