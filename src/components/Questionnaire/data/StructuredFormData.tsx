import { QuestionnaireDetail } from "@/types/questionnaire/questionnaire";

const encounterQuestionnaire: QuestionnaireDetail = {
  id: "encounter",
  slug: "encounter",
  version: "0.0.1",
  title: "Encounter",
  status: "active",
  subject_type: "patient",
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
  tags: [],
};

const medication_request_questionnaire: QuestionnaireDetail = {
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
  tags: [],
};

const allergy_intolerance_questionnaire: QuestionnaireDetail = {
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
  tags: [],
};

const medication_statement_questionnaire: QuestionnaireDetail = {
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
  tags: [],
};

const service_request_questionnaire: QuestionnaireDetail = {
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
  tags: [],
};

const diagnosis_questionnaire: QuestionnaireDetail = {
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
  tags: [],
};

const symptom_questionnaire: QuestionnaireDetail = {
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
  tags: [],
};

const files_questionnaire: QuestionnaireDetail = {
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
  tags: [],
};

const time_of_death_questionnaire: QuestionnaireDetail = {
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
  tags: [],
};

const charge_item_questionnaire: QuestionnaireDetail = {
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
  tags: [],
};

const appointment_questionnaire: QuestionnaireDetail = {
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
  tags: [],
};

export const STRUCTURED_QUESTIONS = [
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
  { value: "appointment", label: "Appointment" },
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

export const FIXED_QUESTIONNAIRES: Record<string, QuestionnaireDetail> =
  STRUCTURED_QUESTIONS.reduce(
    (acc, question) => {
      if ("questionnaire" in question) {
        acc[question.questionnaire.id] = question.questionnaire;
      }
      return acc;
    },
    {} as Record<string, QuestionnaireDetail>,
  );

export type StructuredQuestionType =
  (typeof STRUCTURED_QUESTIONS)[number]["value"];
