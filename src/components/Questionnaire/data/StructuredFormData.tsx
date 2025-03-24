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
  subject_type: "patient",
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
  subject_type: "patient",
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
  subject_type: "patient",
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

const diagnosis_questionnaire: QuestionnaireDetail = {
  id: "diagnosis",
  slug: "diagnosis",
  version: "0.0.1",
  title: "Diagnosis",
  status: "active",
  subject_type: "patient",
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
  subject_type: "patient",
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
  subject_type: "patient",
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

export const FIXED_QUESTIONNAIRES: Record<string, QuestionnaireDetail> = {
  encounter: encounterQuestionnaire,
  medication_request: medication_request_questionnaire,
  allergy_intolerance: allergy_intolerance_questionnaire,
  medication_statement: medication_statement_questionnaire,
  diagnosis: diagnosis_questionnaire,
  symptom: symptom_questionnaire,
  files: files_questionnaire,
};
