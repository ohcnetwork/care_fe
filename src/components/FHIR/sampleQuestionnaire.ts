import { SavedQuestionnaire } from "./types";

export const sampleQuestionnaire: SavedQuestionnaire = {
  resourceType: "Questionnaire",
  id: "sample-questionnaire",
  status: "active",
  title: "Sample Health Questionnaire",
  careVersion: "1.0.0",
  item: [
    {
      id: "name",
      linkId: "1",
      text: "What is your name?",
      type: "string",
      required: true,
    },
    {
      id: "age",
      linkId: "2",
      text: "What is your age?",
      type: "integer",
      required: true,
    },
    {
      id: "gender",
      linkId: "3",
      text: "What is your gender?",
      type: "coding",
      answerOption: [
        { valueCoding: { code: "male", display: "Male" } },
        { valueCoding: { code: "female", display: "Female" } },
        { valueCoding: { code: "other", display: "Other" } },
      ],
    },
    {
      id: "symptoms",
      linkId: "4",
      text: "Are you experiencing any of the following symptoms?",
      type: "coding",
      repeats: true,
      answerOption: [
        { valueCoding: { code: "fever", display: "Fever" } },
        { valueCoding: { code: "cough", display: "Cough" } },
        { valueCoding: { code: "fatigue", display: "Fatigue" } },
        { valueCoding: { code: "none", display: "None of the above" } },
      ],
    },
    {
      id: "notes",
      linkId: "5",
      text: "Any additional notes?",
      type: "text",
    },
  ],
};
