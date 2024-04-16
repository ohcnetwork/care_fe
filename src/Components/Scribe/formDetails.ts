import {
  CONSCIOUSNESS_LEVEL,
  PATIENT_CATEGORIES,
  REVIEW_AT_CHOICES,
  RHYTHM_CHOICES,
  SYMPTOM_CHOICES,
  TELEMEDICINE_ACTIONS,
} from "../../Common/constants";
import { Field } from "./Scribe";

export const DAILY_ROUND_FORM_SCRIBE_DATA: Field[] = [
  {
    friendlyName: "Additional Symptoms",
    id: "additional_symptoms",
    type: "number[]",
    example: "[1,2,3]",
    default: "[]",
    description:
      "A numeric array of option IDs to store symptoms of the patient.",
    options: SYMPTOM_CHOICES,
  },
  {
    friendlyName: "Other Symptoms",
    id: "other_symptoms",
    type: "string",
    example: "",
    default: "",
    description: "Just leave it blank",
  },
  {
    friendlyName: "Physical Examination Info",
    id: "physical_examination_info",
    type: "string",
    example:
      "Patient presents with red burn marks over the chest and swollen arms. Examination reveals no additional external injuries or abnormalities.",
    default: "",
    description:
      "This field is designated for storing detailed findings from the physical examination of the patient. It should include all observable physical attributes, conditions, or symptoms noted during the examination. When processing a doctor's transcript, identify and extract descriptions that pertain directly to the patient's physical state, such as visible conditions, physical symptoms, or any abnormalities noted by touch, sight, or measurement. This can include, but is not limited to, descriptions of skin conditions, swellings, lacerations, posture, mobility issues, and any other physically observable traits.",
  },
  {
    friendlyName: "Other Details",
    id: "other_details",
    type: "string",
    default: "",
    example:
      "Patient reports trouble sleeping and a decreased appetite. Additionally, the patient is allergic to penicillin and has a history of asthma.",
    description:
      "This field is for capturing any supplementary details about the patient that are mentioned in the doctor's transcript but do not directly pertain to the physical examination findings. This includes, but is not limited to, behavioral observations, medical history, patient complaints, lifestyle factors, allergies, or any other non-physical observations that are relevant to the patient's overall health and well-being. When processing a transcript, extract information that describes the patient's health, habits, or conditions in a broader sense than what is observed through physical examination alone.",
  },
  {
    friendlyName: "Patient Category",
    id: "patient_category",
    type: "string",
    example: "Comfort Care",
    default: "",
    description: "A string to categorize the patient.",
    options: PATIENT_CATEGORIES.map((category) => ({
      id: category.id,
      text: category.text,
    })),
  },
  {
    friendlyName: "Current Health",
    id: "current_health",
    type: "number",
    example: "0",
    default: "0",
    description:
      "An integer to represent the current health status of the patient. 0 represents no health issues.",
  },
  {
    friendlyName: "Actions",
    id: "actions",
    type: "null",
    example: "null",
    default: "null",
    description: "Leave blank.",
  },
  {
    friendlyName: "Action",
    id: "action",
    type: "string",
    default: "",
    example: "40",
    description: "An option to store the last action taken for the patient.",
    options: TELEMEDICINE_ACTIONS.map((action) => ({
      id: action.text,
      text: action.desc,
    })),
  },
  {
    friendlyName: "Review Interval",
    id: "review_interval",
    type: "number",
    default: "0",
    example: "15",
    description:
      "An integer to represent the interval at which the patient's condition is reviewed.",
    options: REVIEW_AT_CHOICES,
  },
  {
    friendlyName: "Admitted To",
    id: "admitted_to",
    type: "string",
    default: "",
    example: "General Ward",
    description:
      "A string to store the department or ward where the patient is admitted.",
  },
  {
    friendlyName: "bp",
    id: "bp",
    default: "{ systolic: undefined, diastolic: undefined, mean: undefined }",
    type: "{ systolic: number, diastolic: number, mean: number }",
    example: "{ systolic: 120, diastolic: 80, mean: 100 }",
    description:
      "An object to store the blood pressure of the patient. It contains two integers, systolic and diastolic. Output mean is calculated from these two.",
  },
  {
    friendlyName: "Pulse",
    id: "pulse",
    type: "number",
    default: "null",
    example: "72",
    description:
      "An integer to store the pulse rate of the patient. It can be null if the pulse rate is not taken.",
  },
  {
    friendlyName: "Respiratory Rate",
    id: "resp",
    type: "number",
    default: "null",
    example: "16",
    description:
      "An integer to store the respiratory rate of the patient. It can be null if the respiratory rate is not taken.",
  },
  {
    friendlyName: "Temperature",
    id: "temperature",
    type: "number",
    default: "null",
    example: "98.6",
    description:
      "A float to store the temperature of the patient. It can be null if the temperature is not taken.",
  },
  {
    friendlyName: "SPO2",
    id: "ventilator_spo2",
    type: "number",
    default: "null",
    example: "98",
    description:
      "An integer to store the SPO2 level of the patient. It can be null if the SPO2 level is not taken.",
  },
  {
    friendlyName: "Rhythm",
    id: "rhythm",
    type: "string",
    example: "5",
    default: "0",
    description: "An option to store the rhythm of the patient.",
    options: RHYTHM_CHOICES.map((rhythm) => ({
      id: rhythm.id,
      text: rhythm.desc ?? "",
    })),
  },
  {
    friendlyName: "Rhythm Detail",
    id: "rhythm_detail",
    type: "string",
    default: "",
    example: "Just minor irregularities.",
    description:
      "A string to store the details about the rhythm of the patient.",
  },
  {
    friendlyName: "Level Of Consciousness",
    id: "consciousness_level",
    type: "string",
    default: "UNKNOWN",
    example: "ALERT",
    description:
      "An option to store the level of consciousness of the patient.",
    options: CONSCIOUSNESS_LEVEL,
  },
];

export const SCRIBE_FORMS = [
  {
    id: "daily_round",
    name: "Daily Round",
    fields: DAILY_ROUND_FORM_SCRIBE_DATA,
  },
];
