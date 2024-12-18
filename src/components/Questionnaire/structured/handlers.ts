import {
  DataTypeFor,
  RequestTypeFor,
} from "@/components/Questionnaire/structured/types";

import routes from "@/Utils/request/api";
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

const handlers: {
  [K in StructuredQuestionType]: StructuredHandler<K>;
} = {
  allergy_intolerance: {
    getRequests: (allergies, { patientId, encounterId }) =>
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
          url: `/api/v1/patient/${patientId}/allergy_intolerance/`,
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
    getRequests: (symptoms, { patientId, encounterId }) =>
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
          url: `/api/v1/patient/${patientId}/symptom/`,
          method: "POST",
          body,
          reference_id: "symptom",
        };
      }),
  },
  diagnosis: {
    getRequests: (diagnoses, { patientId, encounterId }) =>
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
          url: `/api/v1/patient/${patientId}/diagnosis/`,
          method: "POST",
          body,
          reference_id: "diagnosis",
        };
      }),
  },
  encounter: {
    getRequests: (encounters, { patientId, facilityId }) => {
      console.log("Encounters", encounters, facilityId);
      if (!encounters.length || !facilityId) return [];

      return encounters.map((encounter) => {
        const body: RequestTypeFor<"encounter"> = {
          suggestion: encounter.suggestion,
          route_to_facility: encounter.route_to_facility,
          patient: patientId,
          facility: facilityId,
          admitted: encounter.suggestion === "A",
          category: encounter.category,
          encounter_date: new Date().toISOString(),
          patient_no: encounter.patient_no,

          // Referral details
          referred_to: encounter.referred_to,
          referred_to_external: encounter.referred_to_external,
          referred_from_facility: encounter.referred_from_facility,
          referred_from_facility_external:
            encounter.referred_from_facility_external,
          referred_by_external: encounter.referred_by_external,
          transferred_from_location: encounter.transferred_from_location,

          // Doctor details
          treating_physician: encounter.treating_physician,

          // Death details
          discharge_notes: encounter.discharge_notes,
          death_datetime: encounter.death_datetime,
          death_confirmed_doctor: encounter.death_confirmed_doctor,
        };

        return {
          url: routes.createConsultation.path,
          method: "POST",
          body,
          reference_id: "encounter",
        };
      });
    },
  },
};

export const getStructuredRequests = <T extends StructuredQuestionType>(
  type: T,
  data: DataTypeFor<T>[],
  context: StructuredHandlerContext,
) => handlers[type].getRequests(data, context);
