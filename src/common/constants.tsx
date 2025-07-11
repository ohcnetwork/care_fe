import {
  Ambulance,
  BedDouble,
  Building2,
  Home,
  MonitorSmartphone,
  Stethoscope,
} from "lucide-react";

import { IconName } from "@/CAREUI/icons/CareIcon";

import { EncounterClass } from "@/types/emr/encounter/encounter";

export const RESULTS_PER_PAGE_LIMIT = 14;

/**
 * Contains local storage keys that are potentially used in multiple places.
 */
export const LocalStorageKeys = {
  accessToken: "care_access_token",
  refreshToken: "care_refresh_token",
  patientTokenKey: "care_patient_token",
  loginPreference: "care_login_preference",
};

export interface OptionsType {
  id: number | string;
  text: string;
  label?: string;
  desc?: string;
  disabled?: boolean;
}

export const FACILITY_TYPES: Array<OptionsType> = [
  // { id: 1, text: "Educational Inst" },
  // { id: 4, text: "Hostel" },
  // { id: 5, text: "Hotel" },
  // { id: 6, text: "Lodge" },
  { id: 800, text: "Primary Health Centres" },
  { id: 802, text: "Family Health Centres" },
  { id: 803, text: "Community Health Centres" },
  { id: 840, text: "Women and Child Health Centres" },
  { id: 830, text: "Taluk Hospitals" },
  { id: 860, text: "District Hospitals" },
  { id: 870, text: "Govt Medical College Hospitals" },
  { id: 9, text: "Govt Labs" },
  { id: 10, text: "Private Labs" },
  { id: 7, text: "TeleMedicine" },
  { id: 2, text: "Private Hospital" },
  { id: 910, text: "Autonomous healthcare facility" },
  { id: 1300, text: "Shifting Centre" },
  { id: 1500, text: "Request Approving Center" },
  { id: 1510, text: "Request Fulfilment Center" },
  { id: 3, text: "Other" },

  // { id: 8, text: "Govt Hospital" },
  // { id: 801, text: "24x7 Public Health Centres" },
  // { id: 820, text: "Urban Primary Health Center" },
  // { id: 831, text: "Taluk Headquarters Hospitals" },
  // { id: 850, text: "General hospitals" },

  // { id: 900, text: "Co-operative hospitals" },

  // { id: 950, text: "Corona Testing Labs" },
  // { id: 1000, text: "Corona Care Centre" },

  // { id: 1010, text: "COVID-19 Domiciliary Care Center" },
  // { id: 1100, text: "First Line Treatment Centre" },
  // { id: 1200, text: "Second Line Treatment Center" },
  // { id: 1400, text: "Covid Management Center" },
  // { id: 1600, text: "District War Room" },
  { id: 3000, text: "Clinical Non Governmental Organization" },
  { id: 3001, text: "Non Clinical Non Governmental Organization" },
  { id: 4000, text: "Community Based Organization" },
];

export const GENDER_TYPES = [
  { id: "male", text: "Male", icon: "M" },
  { id: "female", text: "Female", icon: "F" },
  { id: "transgender", text: "Transgender", icon: "TRANS" },
  { id: "non_binary", text: "Non Binary", icon: "TRANS" },
] as const;

export const GENDERS = GENDER_TYPES.map((gender) => gender.id) as [
  (typeof GENDER_TYPES)[number]["id"],
];

export const BLOOD_GROUP_CHOICES = [
  { id: "unknown", text: "Unknown" },
  { id: "A_positive", text: "A+" },
  { id: "A_negative", text: "A-" },
  { id: "B_positive", text: "B+" },
  { id: "B_negative", text: "B-" },
  { id: "AB_positive", text: "AB+" },
  { id: "AB_negative", text: "AB-" },
  { id: "O_positive", text: "O+" },
  { id: "O_negative", text: "O-" },
];

export const RESOURCE_CATEGORY_CHOICES = [
  { id: "PATIENT_CARE", text: "Clinical Care and Social Support" },
  { id: "COMFORT_DEVICES", text: "Comfort Devices" },
  { id: "MEDICINES", text: "Medicines" },
  { id: "FINANCIAL", text: "Financial" },
  { id: "OTHERS", text: "Other" },
];
export const RESOURCE_STATUS_CHOICES = [
  { icon: "l-clock", text: "pending" },
  { icon: "l-check", text: "approved" },
  { icon: "l-ban", text: "rejected" },
  { icon: "l-file-slash", text: "cancelled" },
  { icon: "l-truck", text: "transportation_to_be_arranged" },
  { icon: "l-spinner", text: "transfer_in_progress" },
  { icon: "l-check-circle", text: "completed" },
] as const;

export const FACILITY_FEATURE_TYPES: {
  id: number;
  name: string;
  icon: IconName;
  variant: string;
}[] = [
  {
    id: 1,
    name: "CT Scan",
    icon: "l-compact-disc",
    variant: "blue",
  },
  {
    id: 2,
    name: "Maternity Care",
    icon: "l-baby-carriage",
    variant: "pink",
  },
  {
    id: 3,
    name: "X-Ray",
    icon: "l-clipboard-alt",
    variant: "blue",
  },
  {
    id: 4,
    name: "Neonatal Care",
    icon: "l-baby-carriage",
    variant: "pink",
  },
  {
    id: 5,
    name: "Operation Theater",
    icon: "l-syringe",
    variant: "orange",
  },
  {
    id: 6,
    name: "Blood Bank",
    icon: "l-medical-drip",
    variant: "purple",
  },
  {
    id: 7,
    name: "Emergency Services",
    icon: "l-ambulance",
    variant: "red",
  },
  {
    id: 8,
    name: "Inpatient Services",
    icon: "l-hospital",
    variant: "orange",
  },
  {
    id: 9,
    name: "Outpatient Services",
    icon: "l-hospital",
    variant: "indigo",
  },
  {
    id: 10,
    name: "Intensive Care Units (ICU)",
    icon: "l-hospital",
    variant: "red",
  },
  {
    id: 11,
    name: "Pharmacy",
    icon: "l-hospital",
    variant: "indigo",
  },
  {
    id: 12,
    name: "Rehabilitation Services",
    icon: "l-hospital",
    variant: "teal",
  },
  {
    id: 13,
    name: "Home Care Services",
    icon: "l-hospital",
    variant: "teal",
  },
  {
    id: 14,
    name: "Psychosocial Support",
    icon: "l-hospital",
    variant: "purple",
  },
  {
    id: 15,
    name: "Respite Care",
    icon: "l-hospital",
    variant: "red",
  },
  {
    id: 16,
    name: "Daycare Programs",
    icon: "l-hospital",
    variant: "yellow",
  },
];

export const SOCIOECONOMIC_STATUS_CHOICES = [
  "MIDDLE_CLASS",
  "POOR",
  "VERY_POOR",
  "WELL_OFF",
] as const;

export const DOMESTIC_HEALTHCARE_SUPPORT_CHOICES = [
  "FAMILY_MEMBER",
  "PAID_CAREGIVER",
  "NO_SUPPORT",
] as const;

export const OCCUPATION_TYPES = [
  {
    id: 27,
    text: "Aircraft Pilot or Flight Engineer",
    value: "PILOT_FLIGHT",
  },
  { id: 5, text: "Animal Handler", value: "ANIMAL_HANDLER" },
  {
    id: 9,
    text: "Business or Finance related Occupations",
    value: "BUSINESS_RELATED",
  },
  { id: 2, text: "Businessman", value: "BUSINESSMAN" },
  { id: 14, text: "Chef or Head Cook", value: "CHEF" },
  {
    id: 24,
    text: "Construction and Extraction Worker",
    value: "CONSTRUCTION_EXTRACTION",
  },
  { id: 17, text: "Custodial Occupations", value: "CUSTODIAL" },
  {
    id: 18,
    text: "Customer Service Occupations",
    value: "CUSTOMER_SERVICE",
  },
  { id: 10, text: "Engineer", value: "ENGINEER" },
  {
    id: 25,
    text: "Farming, Fishing and Forestry",
    value: "AGRI_NATURAL",
  },
  {
    id: 4,
    text: "Healthcare Lab Worker",
    value: "HEALTH_CARE_LAB_WORKER",
  },
  {
    id: 7,
    text: "Healthcare Practitioner",
    value: "HEALTHCARE_PRACTITIONER",
  },
  { id: 3, text: "Healthcare Worker", value: "HEALTH_CARE_WORKER" },
  { id: 30, text: "Homemaker", value: "HOMEMAKER" },
  {
    id: 16,
    text: "Hospitality Service Occupations",
    value: "HOSPITALITY",
  },
  {
    id: 21,
    text: "Insurance Sales Agent",
    value: "INSURANCE_SALES_AGENT",
  },
  { id: 29, text: "Military", value: "MILITARY" },
  {
    id: 13,
    text: "Office and Administrative Support Occupations",
    value: "OFFICE_ADMINISTRATIVE",
  },
  {
    id: 12,
    text: "Other Professional Occupations",
    value: "OTHER_PROFESSIONAL_OCCUPATIONS",
  },
  { id: 8, text: "Paramedics", value: "PARADEMICS" },
  {
    id: 26,
    text: "Production Occupations",
    value: "PRODUCTION_OCCUPATION",
  },
  {
    id: 15,
    text: "Protective Service Occupations",
    value: "PROTECTIVE_SERVICE",
  },
  { id: 23, text: "Real Estate Sales Agent", value: "REAL_ESTATE" },
  { id: 20, text: "Retail Sales Worker", value: "RETAIL_SALES_WORKER" },
  {
    id: 22,
    text: "Sales Representative",
    value: "SALES_REPRESENTATIVE",
  },
  { id: 19, text: "Sales Supervisor", value: "SALES_SUPERVISOR" },
  { id: 1, text: "Student", value: "STUDENT" },
  { id: 11, text: "Teacher", value: "TEACHER" },
  { id: 28, text: "Vehicle Driver", value: "VEHICLE_DRIVER" },
  { id: 6, text: "Others", value: "OTHERS" },
  { id: 32, text: "Not Applicable", value: "NOT_APPLICABLE" },
];

export const PATIENT_NOTES_THREADS = {
  Doctors: 10,
  Nurses: 20,
} as const;

export const RATION_CARD_CATEGORY = ["BPL", "APL", "NO_CARD"] as const;

export const DEFAULT_ALLOWED_EXTENSIONS = [
  "image/*",
  "video/*",
  "audio/*",
  "text/plain",
  "text/csv",
  "application/rtf",
  "application/msword",
  "application/vnd.oasis.opendocument.text",
  "application/pdf",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.oasis.opendocument.spreadsheet,application/pdf",
];

export const BACKEND_ALLOWED_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "bmp",
  "tiff",
  "mp4",
  "mov",
  "avi",
  "wmv",
  "mp3",
  "wav",
  "ogg",
  "txt",
  "csv",
  "rtf",
  "doc",
  "odt",
  "pdf",
  "xls",
  "xlsx",
  "ods",
];

export const FILE_EXTENSIONS = {
  IMAGE: ["jpeg", "jpg", "png", "gif", "svg", "bmp", "webp", "jfif"],
  AUDIO: ["mp3", "wav"],
  VIDEO: [
    "webm",
    "mpg",
    "mp2",
    "mpeg",
    "mpe",
    "mpv",
    "ogg",
    "mp4",
    "m4v",
    "avi",
    "wmv",
    "mov",
    "qt",
    "flv",
    "swf",
    "mkv",
  ],
  PRESENTATION: ["pptx"],
  DOCUMENT: ["pdf", "docx"],
} as const;

export const getVideoMimeType = (extension: string): string => {
  const mimeTypes: Record<string, string> = {
    mp4: "video/mp4",
    webm: "video/webm",
    avi: "video/x-msvideo",
    mov: "video/quicktime",
    mkv: "video/x-matroska",
    flv: "video/x-flv",
    mpg: "video/mpeg",
    mp2: "video/mpeg",
    mpeg: "video/mpeg",
    mpe: "video/mpeg",
    mpv: "video/mpeg",
    ogg: "video/ogg",
    swf: "video/x-shockwave-flash",
    wmv: "video/x-ms-wmv",
    m4v: "video/mp4",
    m4a: "audio/mp4",
    m4b: "audio/mp4",
    m4p: "audio/mp4",
  };

  return mimeTypes[extension] || `video/${extension}`;
};

export const encounterIcons = {
  imp: <BedDouble />,
  amb: <Ambulance />,
  obsenc: <Stethoscope />,
  emer: <Building2 />,
  vr: <MonitorSmartphone />,
  hh: <Home />,
} as const satisfies Record<EncounterClass, React.ReactNode>;

export const PREVIEWABLE_FILE_EXTENSIONS = [
  "html",
  "htm",
  "pdf",
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  ...FILE_EXTENSIONS.VIDEO,
] as const;

export const NAME_PREFIXES = ["Dr.", "Mr.", "Mrs.", "Ms.", "Miss", "Prof."];
