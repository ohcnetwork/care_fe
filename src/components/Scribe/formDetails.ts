import { loadInvestigations } from "@/components/Common/prescription-builder/InvestigationBuilder";
import { Field, ScribeForm } from "@/components/Scribe/Scribe";
import { SYMPTOM_CHOICES } from "@/components/Symptoms/types";

import {
  CONSCIOUSNESS_LEVEL,
  PATIENT_CATEGORIES,
  REVIEW_AT_CHOICES,
  RHYTHM_CHOICES,
  TELEMEDICINE_ACTIONS,
} from "@/common/constants";

const DAILY_ROUND_FORM_SCRIBE_DATA: Field[] = [
  {
    friendlyName: "Additional Symptoms",
    id: "additional_symptoms",
    type: "{symptom: number, other_symptom?: string, onset_date: string, cure_date?: string}[]",
    example:
      "[{symptom: 1, onset_date: '2024-12-03'}, {symptom: 2, onset_date: '2024-12-03', cure_date: '2024-12-05'}, {symptom: 9, other_symptom: 'Other symptom', onset_date: '2024-12-03'}]",
    default: [],
    description: `An array of objects to store the patient's symptoms along with their date of onset and date of cure (if any). The symptom field should be an integer corresponding to the symptom's ID. The onset_date and cure_date fields should be date strings (e.g., '2022-01-01'). If no onset_date has been specified, use todays date which is '${new Date().toISOString().slice(0, 10)}'. If the symptom is ongoing, the cure_date field should not be included. If the user has 'Other Symptom', only then the other_symptom field should be included with a string value describing the symptom.`,
    options: SYMPTOM_CHOICES,
    validator: (value) => {
      if (!Array.isArray(value)) return false;
      value.forEach((s) => {
        if (!s.symptom || !s.onset_date) return false;
      });
      return true;
    },
  },
  {
    friendlyName: "Other Symptoms",
    id: "other_symptoms",
    type: "string",
    example: "",
    default: "",
    description: "Just leave it blank",
    validator: () => {
      return true;
    },
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
    validator: (value) => {
      return typeof value === "string";
    },
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
    validator: (value) => {
      return typeof value === "string";
    },
  },
  {
    friendlyName: "Patient Category",
    id: "patient_category",
    type: "string",
    example: "Mild",
    default: "",
    description: "A string to categorize the patient.",
    options: PATIENT_CATEGORIES.filter((c) => c.id !== "Comfort").map(
      (category) => ({
        id: category.id,
        text: category.text,
      }),
    ),
    validator: (value) => {
      return typeof value === "string";
    },
  },
  {
    friendlyName: "Actions",
    id: "actions",
    type: "null",
    example: "null",
    default: null,
    description: "Leave blank.",
    validator: (value) => {
      return value === null;
    },
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
    validator: (value) => typeof value === "string",
  },
  {
    friendlyName: "Review Interval",
    id: "review_interval",
    type: "number",
    default: 0,
    example: "15",
    description:
      "An integer to represent the interval at which the patient's condition is reviewed.",
    options: REVIEW_AT_CHOICES,
    validator: (value) => typeof value === "number",
  },
  {
    friendlyName: "Admitted To",
    id: "admitted_to",
    type: "string",
    default: "",
    example: "General Ward",
    description:
      "A string to store the department or ward where the patient is admitted.",
    validator: (value) => typeof value === "string",
  },
  {
    friendlyName: "bp",
    id: "bp",
    default: { systolic: null, diastolic: null },
    type: "{ systolic?: number, diastolic?: number }",
    example: "{ systolic: 120, diastolic: 90 }",
    description:
      "An object to store the blood pressure of the patient. It may contain two integers, systolic and diastolic.",
    validator: (value) => {
      if (typeof value !== "object") return false;
      if (value.systolic && typeof value.systolic !== "number") return false;
      if (value.diastolic && typeof value.diastolic !== "number") return false;
      return true;
    },
  },
  {
    friendlyName: "Pulse",
    id: "pulse",
    type: "number",
    default: null,
    example: "72",
    description:
      "An integer to store the pulse rate of the patient. It can be null if the pulse rate is not taken.",
    validator: (value) => typeof value === "number",
  },
  {
    friendlyName: "Respiratory Rate",
    id: "resp",
    type: "number",
    default: null,
    example: "16",
    description:
      "An integer to store the respiratory rate of the patient. It can be null if the respiratory rate is not taken.",
    validator: (value) => typeof value === "number",
  },
  {
    friendlyName: "Temperature",
    id: "temperature",
    type: "number",
    default: null,
    example: "98.6",
    description:
      "A float to store the temperature of the patient. It can be null if the temperature is not taken.",
    validator: (value) => typeof value === "number",
  },
  {
    friendlyName: "SPO2",
    id: "ventilator_spo2",
    type: "number",
    default: null,
    example: "98",
    description:
      "An integer to store the SPO2 level of the patient. It can be null if the SPO2 level is not taken.",
    validator: (value) => typeof value === "number",
  },
  {
    friendlyName: "Rhythm",
    id: "rhythm",
    type: "number",
    example: "5",
    default: 0,
    description: "An option to store the rhythm of the patient.",
    options: RHYTHM_CHOICES.map((rhythm) => ({
      id: rhythm.id,
      text: rhythm.desc ?? "",
    })),
    validator: (value) => typeof value === "number",
  },
  {
    friendlyName: "Rhythm Detail",
    id: "rhythm_detail",
    type: "string",
    default: "",
    example: "Just minor irregularities.",
    description:
      "A string to store the details about the rhythm of the patient.",
    validator: (value) => typeof value === "string",
  },
  {
    friendlyName: "Level Of Consciousness",
    id: "consciousness_level",
    type: "string",
    default: "UNKNOWN",
    example: "ALERT",
    description:
      "An option to store the level of consciousness of the patient.",
    options: CONSCIOUSNESS_LEVEL.map((loc) => ({
      id: loc.id,
      text: loc.value,
    })),
    validator: (value) => typeof value === "string",
  },
  {
    friendlyName: "Diagnosis",
    id: "icd11_diagnosis",
    type: '{diagnosis: string, verification_status: "unconfirmed" | "provisional" | "differential" | "confirmed", is_principal: boolean}[]',
    default: [],
    example:
      "[{diagnosis: '4A42.0 Paediatric onset systemic sclerosis', verification_status: 'confirmed', is_principal: true}, {diagnosis: 2, verification_status: 'provisional', is_principal: false}]",
    description:
      "A list of objects to store the patient's diagnosis along with their verification status and whether it is the principal diagnosis. If not specifically said, set is_principal to false. NOTE: only one principal diagnosis can exist. The diagnosis field should be a string that may contain a corresponding diagnosis ID. The verification_status field should be a string with one of the following values: 'unconfirmed', 'provisional', 'differential', or 'confirmed'.",
    validator: (value) => {
      if (!Array.isArray(value)) return false;
      value.forEach((d) => {
        if (!d.diagnosis || !d.verification_status) return false;
      });
      return true;
    },
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
    default: [],
    example: `[
      {
        type: ["Haemotology (GROUP)"],
        repetitive: false,
        time: "2024-07-31T18:10",
        notes: "Patient is allergic to penicillin."      
      },
      {
        type: ["ECG", "X-Ray"],
        repetitive: true,
        frequency: "24 hrs",
        notes: "Patient is going nuts"
      }
    ]`,
    description:
      "A list of objects to store the patient's investigations. The type field should be an array of strings corresponding to the names of the investigations provided in the options. The repetitive field should be a boolean value. The time field should be a string and only be filled if repetitive field is false. The frequency field should be a string with one of the following values: '15 min', '30 min', '1 hr', '6 hrs', '12 hrs', '24 hrs', or '48 hrs' and should be only filled if this is a repititive investigation. The time field should be of the example format if present - (2024-07-31T18:10). The notes field should be a string. If the type is not available in options, DO NOT MAKE IT.",
    validator: (value) => {
      if (!Array.isArray(value)) return false;
      value.forEach((i) => {
        if (!i.type || !i.repetitive) return false;
        if (i.repetitive && !i.frequency) return false;
      });
      return true;
    },
  } /*
  {
    friendlyName: "Prescriptions",
    id: "prescriptions",
    type: `{
      base_dosage: number + " " + ("mg" | "g" | "ml" | "drop(s)" | "ampule(s)" | "tsp" | "mcg" | "unit(s)"),
      days: number,
      dosage_type: "REGULAR" | "TITRATED",
      frequency: "STAT" | "OD" | "HS" | "BD" | "TID" | "QID" | "Q4H" | "QOD" | "QWK",
      medicine: string,
      notes: string,
      route: "ORAL" | "IV" | "IM" | "SC" | "INHALATION" | "NASOGASTRIC" | "INTRATHECAL" | "TRANSDERMAL" | "RECTAL" | "SUBLINGUAL",
      instruction_on_titration: string,
      target_dosage: number + " " + ("mg" | "g" | "ml" | "drop(s)" | "ampule(s)" | "tsp" | "mcg" | "unit(s)"),
    }[]`,
    default: [],
    example: `[
      {base_dosage: "5 ampule(s)", days: 7, dosage_type: "REGULAR", frequency: "STAT", medicine: "DOLO", notes: "Give with water", route: "ORAL"},
      {base_dosage: "7 ml", days: 3, dosage_type: "TITRATED", frequency: "Q4H", medicine: "Albumin", route: "INHALATION", instruction_on_titration: "Example", target_dosage: "40 ml"},
    ]`,
    description: `A list of objects to store the patient's prescriptions. The prescription can be regular or titrated. If titrated, the prescription should also include instruction_on_titration, and a target_dosage. NOTE: target_dosage should have the same unit as base_dosage. 
    The frequency should be any of the mentioned ones. They are short for:
    STAT: Imediately,
    OD: Once daily,
    HS: Night Only,
    BD: Twice Daily,
    TID: 8th Hourly,
    QID: 6th Hourly,
    Q4H: 4th Hourly,
    QOD: Alternate Day,
    QWK: Once a Week
    `,
    validator: (value) => {
      if (!Array.isArray(value)) return false;
      return true;
    },
  },
  {
    friendlyName: "PRN Prescriptions",
    id: "prn_prescriptions",
    type: `{
      base_dosage: number + " " + ("mg" | "g" | "ml" | "drop(s)" | "ampule(s)" | "tsp" | "mcg" | "unit(s)"),
      dosage_type: "PRN",
      medicine: string,
      notes: string,
      route: "ORAL" | "IV" | "IM" | "SC" | "INHALATION" | "NASOGASTRIC" | "INTRATHECAL" | "TRANSDERMAL" | "RECTAL" | "SUBLINGUAL",
      indicator: string,
      min_hours_between_doses: number,
      max_dosage: number + " " + ("mg" | "g" | "ml" | "drop(s)" | "ampule(s)" | "tsp" | "mcg" | "unit(s)"),
    }[]`,
    default: [],
    example: `[
      {base_dosage: "3 drop(s)", dosage_type:"PRN", indicator: "If patient gets fever", max_dosage: "5 drops(s)", min_hours_between_doses: 12, route: "IV", medicine: "Glentona", notes: "Example"}
    ]`,
    description: "A list of objects to store the patient's PRN prescriptions.",
    validator: (value) => {
      if (!Array.isArray(value)) return false;
      return true;
    },
  },
  {
    friendlyName: "Round Type",
    id: "rounds_type",
    type: "string",
    default: "NORMAL",
    example: "TELEMEDICINE",
    description: "A string to store the type of round.",
    options: [
      { id: "NORMAL", text: "Brief Update" },
      { id: "VENTILATOR", text: "Detailed Update" },
      { id: "DOCTORS_LOG", text: "Progress Note" },
      { id: "TELEMEDICINE", text: "Telemedicine" },
    ],
    validator: (value) => typeof value === "string",
  },
  {
    friendlyName: "Measured At",
    id: "taken_at",
    type: "string",
    default: "",
    example: "2024-07-31T18:10",
    description:
      "A string to store the date and time at which the round was taken or measured. 'The round was taken yesterday/today' would amount to yesterday/today's date.",
    validator: (value) => typeof value === "string",
   },
*/,
];

export const SCRIBE_FORMS: { [key: string]: ScribeForm } = {
  daily_round: {
    id: "daily_round",
    name: "Daily Round",
    fields: async () => {
      const investigations = await loadInvestigations();

      return DAILY_ROUND_FORM_SCRIBE_DATA.map((field) => {
        if (field.id === "investigations") {
          return {
            ...field,
            options: investigations.map((investigation, i) => ({
              id: i,
              text: investigation,
              currentData: undefined,
            })),
          };
        }
        return field;
      });
    },
  },
};
