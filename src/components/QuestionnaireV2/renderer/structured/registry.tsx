import { ComponentType } from "react";

import { AllergyQuestion } from "@/components/Questionnaire/QuestionTypes/AllergyQuestion";
import { AppointmentQuestion } from "@/components/Questionnaire/QuestionTypes/AppointmentQuestion";
import { ChargeItemQuestion } from "@/components/Questionnaire/QuestionTypes/ChargeItemQuestion";
import { TimeOfDeathQuestion } from "@/components/Questionnaire/QuestionTypes/DeathQuestion";
import { DiagnosisQuestion } from "@/components/Questionnaire/QuestionTypes/DiagnosisQuestion";
import { EncounterQuestion } from "@/components/Questionnaire/QuestionTypes/EncounterQuestion";
import { FilesQuestion } from "@/components/Questionnaire/QuestionTypes/FileQuestion";
import { MedicationRequestQuestion } from "@/components/Questionnaire/QuestionTypes/MedicationRequestQuestion";
import { MedicationStatementQuestion } from "@/components/Questionnaire/QuestionTypes/MedicationStatementQuestion";
import { ServiceRequestQuestion } from "@/components/Questionnaire/QuestionTypes/ServiceRequestQuestion";
import { SymptomQuestion } from "@/components/Questionnaire/QuestionTypes/SymptomQuestion";
import { StructuredQuestionType } from "@/components/Questionnaire/data/StructuredFormData";

export type StructuredContextKey = "patientId" | "encounterId" | "facilityId";

export interface StructuredEntry {
  /**
   * The old structured components (src/components/Questionnaire/QuestionTypes)
   * predate the renderer's unified prop bag. They are structurally
   * compatible with the bag StructuredQuestionSlot builds (question,
   * questionnaireResponse, updateQuestionnaireResponseCB, disabled, errors,
   * clearError, index, withLabel, patientId, encounterId, facilityId) but
   * were never given a single shared prop type. This is the ONE permitted
   * `any` in the renderer — it disappears once structured types are
   * rebuilt natively instead of adapted from the old components.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: ComponentType<any>;
  requires: StructuredContextKey[];
}

export const STRUCTURED_REGISTRY: Record<
  StructuredQuestionType,
  StructuredEntry
> = {
  medication_request: {
    component: MedicationRequestQuestion,
    requires: ["patientId", "encounterId"],
  },
  medication_statement: {
    component: MedicationStatementQuestion,
    requires: ["patientId", "encounterId"],
  },
  allergy_intolerance: {
    component: AllergyQuestion,
    requires: ["patientId", "encounterId"],
  },
  symptom: {
    component: SymptomQuestion,
    requires: ["patientId", "encounterId"],
  },
  diagnosis: {
    component: DiagnosisQuestion,
    requires: ["patientId", "encounterId"],
  },
  service_request: {
    component: ServiceRequestQuestion,
    requires: ["encounterId", "facilityId"],
  },
  charge_item: {
    component: ChargeItemQuestion,
    requires: ["encounterId", "facilityId"],
  },
  encounter: {
    component: EncounterQuestion,
    requires: ["encounterId", "facilityId"],
  },
  appointment: {
    component: AppointmentQuestion,
    requires: ["facilityId"],
  },
  files: {
    component: FilesQuestion,
    requires: ["encounterId", "facilityId"],
  },
  time_of_death: {
    component: TimeOfDeathQuestion,
    requires: [],
  },
};
