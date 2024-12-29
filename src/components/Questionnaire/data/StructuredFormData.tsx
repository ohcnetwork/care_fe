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
};

export const FIXED_QUESTIONNAIRES: Record<string, QuestionnaireDetail> = {
  encounter: encounterQuestionnaire,
};
