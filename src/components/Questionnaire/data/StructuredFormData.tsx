import { QuestionnaireRead } from "@/types/questionnaire/questionnaire";
import type { StructuredQuestionType } from "@/types/questionnaire/structured";

const encounterQuestionnaire: QuestionnaireRead = {
  id: "encounter",
  slug: "encounter",
  version: "0.0.1",
  title: "Encounter",
  status: "active",
  // The `encounter` structured type needs an encounter in scope (see its
  // definition's `requires`/`subjects`) — it PUTs to the encounter it is
  // filled against. The only surface that mounts this questionnaire is
  // "Update Encounter", on the encounter route; a `patient` subject_type
  // here made the renderer, the validator and the batch composer all treat
  // the single question as out-of-subject and drop it.
  subject_type: "encounter",
  questions: [
    {
      id: "encounter",
      text: "Encounter",
      type: "structured",
      link_id: "1.1",
      required: true,
      structured_type: "encounter",
    },
  ],
};

const medication_request_questionnaire: QuestionnaireRead = {
  id: "medication_request",
  slug: "medication_request",
  version: "0.0.1",
  title: "Medication Request",
  status: "active",
  subject_type: "encounter",
  questions: [
    {
      id: "medication_request",
      text: "Medication Request",
      type: "structured",
      structured_type: "medication_request",
      link_id: "1.1",
      required: true,
    },
  ],
};

const allergy_intolerance_questionnaire: QuestionnaireRead = {
  id: "allergy_intolerance",
  slug: "allergy_intolerance",
  version: "0.0.1",
  title: "Allergy Intolerance",
  status: "active",
  subject_type: "encounter",
  questions: [
    {
      id: "allergy_intolerance",
      text: "Allergy Intolerance",
      type: "structured",
      structured_type: "allergy_intolerance",
      link_id: "1.1",
      required: true,
    },
  ],
};

const medication_statement_questionnaire: QuestionnaireRead = {
  id: "medication_statement",
  slug: "medication_statement",
  version: "0.0.1",
  title: "Medication Statement",
  status: "active",
  subject_type: "encounter",
  questions: [
    {
      id: "medication_statement",
      text: "Medication Statement",
      type: "structured",
      structured_type: "medication_statement",
      link_id: "1.1",
      required: true,
    },
  ],
};

const service_request_questionnaire: QuestionnaireRead = {
  id: "service_request",
  slug: "service_request",
  version: "0.0.1",
  title: "Service Request",
  status: "active",
  subject_type: "encounter",
  questions: [
    {
      id: "service_request",
      text: "Service Request",
      type: "structured",
      structured_type: "service_request",
      link_id: "1.1",
      required: true,
    },
  ],
};

const diagnosis_questionnaire: QuestionnaireRead = {
  id: "diagnosis",
  slug: "diagnosis",
  version: "0.0.1",
  title: "Diagnosis",
  status: "active",
  subject_type: "encounter",
  questions: [
    {
      id: "diagnosis",
      text: "Diagnosis",
      type: "structured",
      structured_type: "diagnosis",
      link_id: "1.1",
      required: true,
    },
  ],
};

const symptom_questionnaire: QuestionnaireRead = {
  id: "symptom",
  slug: "symptom",
  version: "0.0.1",
  title: "Symptom",
  status: "active",
  subject_type: "encounter",
  questions: [
    {
      id: "symptom",
      text: "Symptom",
      type: "structured",
      structured_type: "symptom",
      link_id: "1.1",
      required: true,
    },
  ],
};

const files_questionnaire: QuestionnaireRead = {
  id: "files",
  slug: "files",
  version: "0.0.1",
  title: "Files",
  status: "active",
  subject_type: "encounter",
  questions: [
    {
      id: "files",
      text: "Files",
      type: "structured",
      structured_type: "files",
      link_id: "1.1",
      required: true,
    },
  ],
};

const time_of_death_questionnaire: QuestionnaireRead = {
  id: "time_of_death",
  slug: "time_of_death",
  version: "0.0.1",
  title: "Time of Death",
  status: "active",
  subject_type: "patient",
  questions: [
    {
      id: "time_of_death",
      text: "Time of Death",
      type: "structured",
      structured_type: "time_of_death",
      link_id: "1.1",
      required: true,
    },
  ],
};

const charge_item_questionnaire: QuestionnaireRead = {
  id: "charge_item",
  slug: "charge_item",
  version: "0.0.1",
  title: "Charge Item",
  status: "active",
  subject_type: "encounter",
  questions: [
    {
      id: "charge_item",
      text: "Charge Item",
      type: "structured",
      structured_type: "charge_item",
      link_id: "1.1",
      required: true,
    },
  ],
};

const appointment_questionnaire: QuestionnaireRead = {
  id: "appointment",
  slug: "appointment",
  version: "0.0.1",
  title: "Appointment",
  status: "active",
  subject_type: "encounter",
  questions: [
    {
      id: "appointment",
      text: "Appointment",
      type: "structured",
      structured_type: "appointment",
      link_id: "1.1",
      required: true,
    },
  ],
};

const structuredQuestionEntries = [
  {
    value: "allergy_intolerance",
    label: "Allergy Intolerance",
    questionnaire: allergy_intolerance_questionnaire,
  },
  {
    value: "medication_request",
    label: "Medication Request",
    questionnaire: medication_request_questionnaire,
  },
  {
    value: "medication_statement",
    label: "Medication Statement",
    questionnaire: medication_statement_questionnaire,
  },
  { value: "symptom", label: "Symptom", questionnaire: symptom_questionnaire },
  {
    value: "diagnosis",
    label: "Diagnosis",
    questionnaire: diagnosis_questionnaire,
  },
  {
    value: "encounter",
    label: "Encounter",
    questionnaire: encounterQuestionnaire,
  },
  {
    value: "time_of_death",
    label: "Time of Death",
    questionnaire: time_of_death_questionnaire,
  },
  { value: "files", label: "Files", questionnaire: files_questionnaire },
  {
    value: "service_request",
    label: "Service Request",
    questionnaire: service_request_questionnaire,
  },
  {
    value: "charge_item",
    label: "Charge Item",
    questionnaire: charge_item_questionnaire,
  },
  {
    value: "appointment",
    label: "Appointment",
    questionnaire: appointment_questionnaire,
  },
] as const;

/** Typed against the canonical union so a value here that isn't a real
 *  `StructuredQuestionType` (or a typo) fails to compile. */
export const STRUCTURED_QUESTIONS: readonly {
  value: StructuredQuestionType;
  label: string;
  questionnaire: QuestionnaireRead;
}[] = structuredQuestionEntries;

export const FIXED_QUESTIONNAIRES: Record<string, QuestionnaireRead> =
  STRUCTURED_QUESTIONS.reduce(
    (acc, question) => {
      if ("questionnaire" in question) {
        acc[question.questionnaire.slug] = question.questionnaire;
      }
      return acc;
    },
    {} as Record<string, QuestionnaireRead>,
  );

export type { StructuredQuestionType } from "@/types/questionnaire/structured";

export function filterStructuredQuestionnaireSlugs(slug?: string) {
  return slug &&
    STRUCTURED_QUESTIONS.map(
      (question) => question.questionnaire.slug,
    ).includes(slug)
    ? undefined
    : slug;
}
