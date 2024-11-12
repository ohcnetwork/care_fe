import { BaseModel } from "@/Utils/types";

export const OTHER_SYMPTOM_CHOICE = { id: 9, text: "Other Symptom" } as const;

export const SYMPTOM_CHOICES = [
  { id: 2, text: "Fever" },
  { id: 3, text: "Sore throat" },
  { id: 4, text: "Cough" },
  { id: 5, text: "Breathlessness" },
  { id: 6, text: "Myalgia" },
  { id: 7, text: "Abdominal discomfort" },
  { id: 8, text: "Vomiting" },
  { id: 11, text: "Sputum" },
  { id: 12, text: "Nausea" },
  { id: 13, text: "Chest pain" },
  { id: 14, text: "Hemoptysis" },
  { id: 15, text: "Nasal discharge" },
  { id: 16, text: "Body ache" },
  { id: 17, text: "Diarrhoea" },
  { id: 18, text: "Pain" },
  { id: 19, text: "Pedal Edema" },
  { id: 20, text: "Wound" },
  { id: 21, text: "Constipation" },
  { id: 22, text: "Head ache" },
  { id: 23, text: "Bleeding" },
  { id: 24, text: "Dizziness" },
  { id: 25, text: "Chills" },
  { id: 26, text: "General weakness" },
  { id: 27, text: "Irritability" },
  { id: 28, text: "Confusion" },
  { id: 29, text: "Abdominal pain" },
  { id: 30, text: "Join pain" },
  { id: 31, text: "Redness of eyes" },
  { id: 32, text: "Anorexia" },
  { id: 33, text: "New loss of taste" },
  { id: 34, text: "New loss of smell" },
  OTHER_SYMPTOM_CHOICE,
] as const;

type ClinicalImpressionStatus =
  | "in-progress"
  | "completed"
  | "entered-in-error";

export interface EncounterSymptom extends BaseModel {
  symptom: (typeof SYMPTOM_CHOICES)[number]["id"];
  other_symptom?: string | null;
  onset_date: string;
  cure_date?: string | null;
  readonly clinical_impression_status: ClinicalImpressionStatus;
  readonly is_migrated: boolean;
}
