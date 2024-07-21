import {
  CONSCIOUSNESS_LEVEL,
  PATIENT_CATEGORIES,
  REVIEW_AT_CHOICES,
  RHYTHM_CHOICES,
  TELEMEDICINE_ACTIONS,
} from "../../Common/constants";
import routes from "../../Redux/api";
import request from "../../Utils/request/request";
import { loadInvestigations } from "../Common/prescription-builder/InvestigationBuilder";
import { ICD11DiagnosisModel } from "../Diagnosis/types";
import { SYMPTOM_CHOICES } from "../Symptoms/types";
import { Field, ScribeForm } from "./Scribe";

const DAILY_ROUND_FORM_SCRIBE_DATA: Field[] = [
  {
    friendlyName: "Additional Symptoms",
    id: "additional_symptoms",
    type: "{symptom: number, other_symptom?: string, onset_date: string, cure_date?: string}[]",
    example:
      "[{symptom: 1, onset_date: '2024-12-03'}, {symptom: 2, onset_date: '2024-12-03', cure_date: '2024-12-05'}, {symptom: 9, other_symptom: 'Other symptom', onset_date: '2024-12-03'}]",
    default: "[]",
    description: `An array of objects to store the patient's symptoms along with their date of onset and date of cure (if any). The symptom field should be an integer corresponding to the symptom's ID. The onset_date and cure_date fields should be date strings (e.g., '2022-01-01'). If no onset_date has been specified, use todays date which is '${new Date().toISOString().slice(0, 10)}'. If the symptom is ongoing, the cure_date field should not be included. If the user has 'Other Symptom', only then the other_symptom field should be included with a string value describing the symptom.`,
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
  {
    friendlyName: "Diagnosis",
    id: "icd11_diagnosis",
    type: "{diagnosis: number, verification_status: \"unconfirmed\" | \"provisional\" | \"differential\" | \"confirmed\", is_principal: boolean}[]",
    default: "[]",
    example:
      "[{diagnosis: 12345678, verification_status: 'confirmed', is_principal: true}, {diagnosis: 2, verification_status: 'provisional', is_principal: false}]",
    description:
      "A list of objects to store the patient's diagnosis along with their verification status and whether it is the principal diagnosis. By default set is_principal to false. NOTE: only one principal diagnosis can exist. The diagnosis field should be an integer corresponding to the diagnosis's ID. The verification_status field should be a string with one of the following values: 'unconfirmed', 'provisional', 'differential', or 'confirmed'. The is_principal field should be a boolean value.",
  },
  {
    friendlyName: "Investigations",
    id: "investigations",
    type: `{
      type: string[], 
      repetitive: boolean, 
      time?: string, 
      frequency?: '15 min' | '30 min' | '1 hr' | '6 hrs' | '12 hrs' | '24 hrs' | '48 hrs', 
      notes?: string
    }[]`,
    default: "[]",
    example: "",
    description:
      "A list of objects to store the patient's investigations. The type field should be an array of strings corresponding to the names of the investigations provided in the options. The repetitive field should be a boolean value. The time field should be a string and only be filled if repetitive field is false. The frequency field should be a string with one of the following values: '15 min', '30 min', '1 hr', '6 hrs', '12 hrs', '24 hrs', or '48 hrs' and should be only filled if this is a repititive investigation . The notes field should be a string. If the type is not available in options, DO NOT MAKE IT.",
  },
];

export const SCRIBE_FORMS: { [key: string]: ScribeForm } = {
  daily_round: {
    id: "daily_round",
    name: "Daily Round",
    fields: async () => {
      const { res, data } = await request(routes.listICD11Diagnosis, {
        silent: true,
      });
      let icd11Diagnoses: ICD11DiagnosisModel[] = [];

      if (res?.ok && data) icd11Diagnoses = data;

      const icd11DiagnosisOptions = icd11Diagnoses?.map((diagnosis) => ({
        id: diagnosis.id,
        text: diagnosis.label,
      }));

      const investigations = await loadInvestigations();

      return DAILY_ROUND_FORM_SCRIBE_DATA.map((field) => {
        if (field.id === "icd11_diagnosis") {
          return {
            ...field,
            options: icd11DiagnosisOptions,
          };
        }
        if (field.id === "investigations") {
          return {
            ...field,
            options: investigations.map((investigation, i) => ({
              id: i,
              text: investigation,
            })),
          };
        }
        return field;
      });
    },
  },
};
