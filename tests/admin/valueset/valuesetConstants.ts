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

export const VALID_UCUM_CODES = [
  "mg",
  "kg",
  "mg/dL",
  "cm",
  "°C",
  "L/min",
  "%",
  "beats/min",
  "g/dL",
];

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
