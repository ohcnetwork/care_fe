export const VALID_SNOMED_CODES = [
  "38341003",
  "73211009",
  "233604007",
  "195967001",
  "22298006",
  "44054006",
  "13645005",
  "161891005",
  "386661006",
  "84229001",
];

export const SNOMED_CODE_NAME: { [key: string]: string } = {
  "38341003": "Hypertensive",
  "73211009": "Diabetes",
  "233604007": "Pneumonia",
  "195967001": "Asthma",
  "22298006": "Myocardial",
  "44054006": "Type 2 diabetes",
  "13645005": "pulmonary disease",
  "161891005": "Backache",
  "386661006": "Fever",
  "84229001": "Fatigue",
};

export const VALID_LOINC_CODES = [
  "8480-6",
  "8462-4",
  "8310-5",
  "8867-4",
  "9279-1",
  "2339-0",
  "718-7",
  "789-8",
  "2160-0",
  "33914-3",
];

export const LOINC_CODE_NAME: { [key: string]: string } = {
  "8480-6": "Systolic",
  "8462-4": "Diastolic",
  "8310-5": "Body temperature",
  "8867-4": "Heart rate",
  "9279-1": "Respiratory rate",
  "2339-0": "Glucose",
  "718-7": "Hemoglobin",
  "789-8": "Erythrocytes",
  "2160-0": "Creatinine",
  "33914-3": "Glomerular",
};

export const VALID_UCUM_CODES = [
  "mg",
  "kg",
  "mg/dL",
  "cm",
  "L/min",
  "%",
  "L",
  "mL",
  "g/dL",
];

export const UCUM_CODE_NAME: { [key: string]: string } = {
  mg: "milligram",
  kg: "kilogram",
  "mg/dL": "milligram per deciliter",
  cm: "centimeter",
  "L/min": "liter per minute",
  "%": "percent",
  L: "liter",
  mL: "milliliter",
  "g/dL": "gram per deciliter",
};

export const VALID_OPERATORS = [
  "=",
  "is-a",
  "descendent-of",
  "is-not-a",
  "regex",
  "in",
  "not-in",
  "generalizes",
  "child-of",
  "descendent-leaf",
  "exists",
];

export const SYSTEM_OPTIONS = ["LOINC", "SNOMED", "UCUM"];

export const STATUS_OPTIONS = ["Active", "Draft", "Retired", "Unknown"];

export const MIN_SLUG_LENGTH = 5;
export const MAX_SLUG_LENGTH = 25;
