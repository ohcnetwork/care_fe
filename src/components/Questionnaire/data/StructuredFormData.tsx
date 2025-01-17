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

export const FIXED_QUESTIONNAIRES: Record<string, QuestionnaireDetail> = {
  encounter: encounterQuestionnaire,
  medication_request: medication_request_questionnaire,
};
