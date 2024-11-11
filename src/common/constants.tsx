import { IconName } from "@/CAREUI/icons/CareIcon";

import { ConsentHIType, ConsentPurpose } from "@/components/ABDM/types/consent";
import { SortOption } from "@/components/Common/SortDropdown";
import {
  PatientCategory,
  SpokeRelationship,
} from "@/components/Facility/models";
import { PhoneNumberValidator } from "@/components/Form/FieldValidators";

import { SchemaType } from "@/common/schemaParser";

import { dateQueryString } from "@/Utils/utils";

export const RESULTS_PER_PAGE_LIMIT = 14;
export const PAGINATION_LIMIT = 36;

/**
 * Contains local storage keys that are potentially used in multiple places.
 */
export const LocalStorageKeys = {
  accessToken: "care_access_token",
  refreshToken: "care_refresh_token",
};
export interface OptionsType {
  id: number | string;
  text: string;
  label?: string;
  desc?: string;
  disabled?: boolean;
}

export const USER_TYPE_OPTIONS = [
  { id: "Pharmacist", role: "Pharmacist", readOnly: false },
  { id: "Volunteer", role: "Volunteer", readOnly: false },
  { id: "StaffReadOnly", role: "Staff", readOnly: true },
  { id: "Staff", role: "Staff", readOnly: false },
  // { id: "NurseReadOnly", role: "Nurse", readOnly: true },
  { id: "Nurse", role: "Nurse", readOnly: false },
  { id: "Doctor", role: "Doctor", readOnly: false },
  { id: "WardAdmin", role: "Ward Admin", readOnly: false },
  { id: "LocalBodyAdmin", role: "Local Body Admin", readOnly: false },
  { id: "DistrictLabAdmin", role: "District Lab Admin", readOnly: false },
  { id: "DistrictReadOnlyAdmin", role: "District Admin", readOnly: true },
  { id: "DistrictAdmin", role: "District Admin", readOnly: false },
  { id: "StateLabAdmin", role: "State Lab Admin", readOnly: false },
  { id: "StateReadOnlyAdmin", role: "State Admin", readOnly: true },
  { id: "StateAdmin", role: "State Admin", readOnly: false },
] as const;

export const USER_LAST_ACTIVE_OPTIONS = [
  { id: 1, text: "24 hours" },
  { id: 7, text: "7 days" },
  { id: 30, text: "30 days" },
  { id: 90, text: "90 days" },
  { id: 365, text: "1 Year" },
  { id: "never", text: "Never" },
];

export type UserRole = (typeof USER_TYPE_OPTIONS)[number]["id"];

export const USER_TYPES = USER_TYPE_OPTIONS.map((o) => o.id);

export const DOWNLOAD_TYPES: Array<string> = [
  "Facility List",
  "Facility Capacity List",
  "Facility Doctors List",
  "Facility Triage Data",
];

export const TEST_TYPE_CHOICES: Array<OptionsType> = [
  { id: 10, text: "UNK" },
  { id: 20, text: "ANTIGEN" },
  { id: 30, text: "RTPCR" },
  { id: 40, text: "CBNAAT" },
  { id: 50, text: "TRUENAT" },
  { id: 60, text: "RTLAMP" },
  { id: 70, text: "POCPCR" },
];

export const DISTRICT_CHOICES: Array<OptionsType> = [
  { id: 1, text: "Thiruvananthapuram" },
  { id: 2, text: "Kollam" },
  { id: 3, text: "Pathanamthitta" },
  { id: 4, text: "Alappuzha" },
  { id: 5, text: "Kottayam" },
  { id: 6, text: "Idukki" },
  { id: 7, text: "Ernakulam" },
  { id: 8, text: "Thrissur" },
  { id: 9, text: "Palakkad" },
  { id: 10, text: "Malappuram" },
  { id: 11, text: "Kozhikode" },
  { id: 12, text: "Wayanad" },
  { id: 13, text: "Kannur" },
  { id: 14, text: "Kasaragod" },
];

export const VEHICLE_TYPES: Array<OptionsType> = [
  { id: 1, text: "Basic" },
  { id: 2, text: "Cardiac" },
  { id: 3, text: "Hearse" },
];

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
];

export const SHIFTING_CHOICES_WARTIME: Array<OptionsType> = [
  { id: 10, text: "PENDING", label: "SHIFTING APPROVAL PENDING" },
  { id: 15, text: "ON HOLD" },
  { id: 20, text: "APPROVED" },
  { id: 30, text: "REJECTED" },
  { id: 40, text: "DESTINATION APPROVED" },
  { id: 50, text: "DESTINATION REJECTED" },
  { id: 55, text: "TRANSPORTATION TO BE ARRANGED" },
  { id: 60, text: "PATIENT TO BE PICKED UP" },
  { id: 70, text: "TRANSFER IN PROGRESS" },
  { id: 80, text: "COMPLETED" },
  { id: 90, text: "PATIENT EXPIRED" },
  { id: 100, text: "CANCELLED" },
];

export const SHIFTING_CHOICES_PEACETIME: Array<OptionsType> = [
  { id: 20, text: "APPROVED", label: "PATIENTS TO BE SHIFTED" },
  { id: 40, text: "DESTINATION APPROVED" },
  // { id: 50, text: "DESTINATION REJECTED" },
  { id: 60, text: "PATIENT TO BE PICKED UP", label: "TRANSPORTATION ARRANGED" },
  { id: 70, text: "TRANSFER IN PROGRESS" },
  { id: 80, text: "COMPLETED" },
  { id: 90, text: "PATIENT EXPIRED" },
  { id: 100, text: "CANCELLED" },
];

export const SHIFTING_VEHICLE_CHOICES: Array<OptionsType> = [
  { id: 10, text: "D Level Ambulance" },
  { id: 20, text: "All double chambered Ambulance with EMT" },
  { id: 30, text: "Ambulance without EMT" },
  { id: 50, text: "Car" },
  { id: 50, text: "Auto-rickshaw" },
];

export const SHIFTING_FILTER_ORDER: Array<OptionsType> = [
  { id: 1, text: "created_date", desc: "ASC Created Date" },
  { id: 2, text: "-created_date", desc: "DESC Created Date" },
  { id: 3, text: "modified_date", desc: "ASC Modified Date" },
  { id: 4, text: "-modified_date", desc: "DESC Modified Date" },
];

export const PATIENT_SORT_OPTIONS: SortOption[] = [
  { isAscending: false, value: "-created_date" },
  { isAscending: true, value: "created_date" },
  { isAscending: false, value: "-category_severity" },
  { isAscending: true, value: "category_severity" },
  { isAscending: false, value: "-modified_date" },
  { isAscending: true, value: "modified_date" },
  {
    isAscending: true,
    value: "facility__name,last_consultation__current_bed__bed__name",
  },
  {
    isAscending: false,
    value: "facility__name,-last_consultation__current_bed__bed__name",
  },
  { isAscending: false, value: "-review_time" },
  { isAscending: true, value: "review_time" },
  { isAscending: true, value: "name" },
  { isAscending: false, value: "-name" },
];

export const EVENTS_SORT_OPTIONS: SortOption[] = [
  { isAscending: false, value: "-created_date" },
  { isAscending: true, value: "created_date" },
  { isAscending: false, value: "-taken_at" },
  { isAscending: true, value: "taken_at" },
];

export const DISCHARGED_PATIENT_SORT_OPTIONS: SortOption[] = [
  { isAscending: false, value: "-created_date" },
  { isAscending: true, value: "created_date" },
  { isAscending: false, value: "-modified_date" },
  { isAscending: true, value: "modified_date" },
  { isAscending: true, value: "name" },
  { isAscending: false, value: "-name" },
];

export const BED_TYPES = [100, 200, 300, 400, 500];

export const DOCTOR_SPECIALIZATION: Array<OptionsType> = [
  { id: 1, text: "General Medicine" },
  { id: 2, text: "Pulmonology" },
  { id: 3, text: "Intensivist" },
  { id: 4, text: "Pediatrician" },
  { id: 6, text: "Anesthesiologist" },
  { id: 7, text: "Cardiac Surgeon" },
  { id: 8, text: "Cardiologist" },
  { id: 9, text: "Dentist" },
  { id: 10, text: "Dermatologist" },
  { id: 11, text: "Diabetologist" },
  { id: 12, text: "Emergency Medicine Physician" },
  { id: 13, text: "Endocrinologist" },
  { id: 14, text: "Family Physician" },
  { id: 15, text: "Gastroenterologist" },
  { id: 16, text: "General Surgeon" },
  { id: 17, text: "Geriatrician" },
  { id: 18, text: "Hematologist" },
  { id: 19, text: "Immunologist" },
  { id: 20, text: "Infectious Disease Specialist" },
  { id: 21, text: "MBBS doctor" },
  { id: 22, text: "Medical Officer" },
  { id: 23, text: "Nephrologist" },
  { id: 24, text: "Neuro Surgeon" },
  { id: 25, text: "Neurologist" },
  { id: 26, text: "Obstetrician and Gynecologist" },
  { id: 27, text: "Oncologist" },
  { id: 28, text: "Oncology Surgeon" },
  { id: 29, text: "Ophthalmologist" },
  {
    id: 30,
    text: "Oral and Maxillofacial Surgeon",
  },
  { id: 31, text: "Orthopedic" },
  { id: 32, text: "Orthopedic Surgeon" },
  { id: 33, text: "Otolaryngologist (ENT)" },
  { id: 34, text: "Palliative care Physician" },
  { id: 35, text: "Pathologist" },
  { id: 36, text: "Pediatric Surgeon" },
  { id: 37, text: "Physician" },
  { id: 38, text: "Plastic Surgeon" },
  { id: 39, text: "Psychiatrist" },
  { id: 40, text: "Pulmonologist" },
  { id: 41, text: "Radio technician" },
  { id: 42, text: "Radiologist" },
  { id: 43, text: "Rheumatologist" },
  { id: 44, text: "Sports Medicine Specialist" },
  { id: 45, text: "Thoraco-Vascular Surgeon" },
  {
    id: 46,
    text: "Transfusion Medicine Specialist",
  },
  { id: 47, text: "Urologist" },
  { id: 48, text: "Nurse" },
  { id: 5, text: "Others" },
];

export const MEDICAL_HISTORY_CHOICES: Array<OptionsType> = [
  { id: 1, text: "NO" },
  { id: 2, text: "Diabetes" },
  { id: 3, text: "Heart Disease" },
  { id: 4, text: "HyperTension" },
  { id: 5, text: "Kidney Diseases" },
  { id: 6, text: "Lung Diseases/Asthma" },
  { id: 7, text: "Cancer" },
  { id: 8, text: "OTHER" },
];

export const REVIEW_AT_CHOICES: Array<OptionsType> = [
  { id: -1, text: "No Review" },
  { id: 10, text: "10 mins" },
  { id: 15, text: "15 mins" },
  { id: 30, text: "30 mins" },
  { id: 60, text: "1 hr" },
  { id: 2 * 60, text: "2 hr" },
  { id: 3 * 60, text: "3 hr" },
  { id: 4 * 60, text: "4 hr" },
  { id: 6 * 60, text: "6 hr" },
  { id: 8 * 60, text: "8 hr" },
  { id: 12 * 60, text: "12 hr" },
  { id: 24 * 60, text: "24 hr" },
  { id: 36 * 60, text: "36 hr" },
  { id: 2 * 24 * 60, text: "2 days" },
  { id: 3 * 24 * 60, text: "3 days" },
  { id: 5 * 24 * 60, text: "5 days" },
  { id: 7 * 24 * 60, text: "7 days" },
  { id: 10 * 24 * 60, text: "10 days" },
  { id: 14 * 24 * 60, text: "2 weeks" },
  { id: 21 * 24 * 60, text: "3 weeks" },
  { id: 25 * 24 * 60, text: "25 days" },
  { id: 30 * 24 * 60, text: "1 month" },
];

export const DISCHARGE_REASONS = [
  { id: 1, text: "Recovered" },
  { id: 2, text: "Referred" },
  { id: 3, text: "Expired" },
  { id: 4, text: "LAMA" },
] as const;

export const CONSCIOUSNESS_LEVEL = [
  { id: 20, value: "UNRESPONSIVE" },
  { id: 15, value: "RESPONDS_TO_PAIN" },
  { id: 10, value: "RESPONDS_TO_VOICE" },
  { id: 5, value: "ALERT" },
  { id: 25, value: "AGITATED_OR_CONFUSED" },
  {
    id: 30,
    value: "ONSET_OF_AGITATION_AND_CONFUSION",
  },
] as const;

export const PUPIL_REACTION_OPTIONS = [
  { id: 0, value: "UNKNOWN" },
  { id: 5, value: "BRISK" },
  { id: 10, value: "SLUGGISH" },
  { id: 15, value: "FIXED" },
  { id: 20, value: "CANNOT_BE_ASSESSED" },
] as const;

export const LIMB_RESPONSE_OPTIONS = [
  { id: 0, value: "UNKNOWN" },
  { id: 5, value: "STRONG" },
  { id: 10, value: "MODERATE" },
  { id: 15, value: "WEAK" },
  { id: 20, value: "FLEXION" },
  { id: 25, value: "EXTENSION" },
  { id: 30, value: "NONE" },
] as const;

export const OXYGEN_MODALITY_OPTIONS = [
  { value: "NASAL_PRONGS" },
  { value: "SIMPLE_FACE_MASK" },
  { value: "NON_REBREATHING_MASK" },
  { value: "HIGH_FLOW_NASAL_CANNULA" },
] as const;

export const GENDER_TYPES = [
  { id: 1, text: "Male", icon: "M" },
  { id: 2, text: "Female", icon: "F" },
  { id: 3, text: "Transgender", icon: "TRANS" },
] as const;

export const SAMPLE_TEST_RESULT = [
  { id: 1, text: "POSITIVE" },
  { id: 2, text: "NEGATIVE" },
  { id: 3, text: "AWAITING" },
  { id: 4, text: "INVALID" },
];

export const CONSULTATION_SUGGESTION = [
  { id: "HI", text: "Home Isolation", deprecated: true }, // # Deprecated. Preserving option for backward compatibility (use only for readonly operations)
  { id: "A", text: "Admission" },
  { id: "R", text: "Refer to another Hospital", editDisabled: true },
  { id: "OP", text: "OP Consultation" },
  { id: "DC", text: "Domiciliary Care" },
  { id: "DD", text: "Declare Death", editDisabled: true },
] as const;

export type ConsultationSuggestionValue =
  (typeof CONSULTATION_SUGGESTION)[number]["id"];

export const ADMITTED_TO = [
  { id: "1", text: "Isolation" },
  { id: "2", text: "ICU" },
  { id: "6", text: "Bed with oxygen support" },
  { id: "7", text: "Regular" },
  { id: "None", text: "No bed assigned" },
];

export const RESPIRATORY_SUPPORT = [
  { id: "NIV", value: "NON_INVASIVE" },
  { id: "IV", value: "INVASIVE" },
  { id: "O2", value: "OXYGEN_SUPPORT" },
  { id: "NONE", value: "UNKNOWN" },
] as const;

export const VENTILATOR_MODE_OPTIONS = [
  "VCV",
  "PCV",
  "PRVC",
  "APRV",
  "VC_SIMV",
  "PC_SIMV",
  "PRVC_SIMV",
  "ASV",
  "PSV",
] as const;

export const INSULIN_INTAKE_FREQUENCY_OPTIONS = [
  "UNKNOWN",
  "OD",
  "BD",
  "TD",
] as const;

export type PatientCategoryID =
  | "Comfort"
  | "Stable"
  | "Moderate"
  | "Critical"
  | "ActivelyDying";

export const PATIENT_CATEGORIES: {
  id: PatientCategoryID;
  text: PatientCategory;
  description: string;
  twClass: string;
}[] = [
  {
    id: "Comfort", // Comfort Care is discontinued
    text: "Comfort Care",
    twClass: "patient-comfort",
    description: "End of life care",
  },
  {
    id: "Stable",
    text: "Mild",
    twClass: "patient-stable",
    description: "Urgent: not life-threatening",
  },
  {
    id: "Moderate",
    text: "Moderate",
    twClass: "patient-abnormal",
    description: "Emergency: could be life-threatening",
  },
  {
    id: "Critical",
    text: "Critical",
    twClass: "patient-critical",
    description: "Immediate: life-threatening",
  },
  {
    id: "ActivelyDying",
    text: "Actively Dying",
    twClass: "patient-activelydying",
    description: "",
  },
];

export const PATIENT_FILTER_CATEGORIES = PATIENT_CATEGORIES;

export const SAMPLE_TEST_STATUS = [
  { id: 1, text: "REQUEST_SUBMITTED", desc: "Request Submitted" },
  { id: 2, text: "APPROVED", desc: "Approved for Sample Collection" },
  { id: 3, text: "DENIED", desc: "Request Denied" },
  {
    id: 4,
    text: "SENT_TO_COLLECTON_CENTRE",
    desc: "Sample taken and sent to collection centre",
  },
  { id: 5, text: "RECEIVED_AND_FORWARED", desc: "Received And Forwarded" },
  { id: 6, text: "RECEIVED_AT_LAB", desc: "Received At Lab" },
  { id: 7, text: "COMPLETED", desc: "Test Completed" },
];

export const SAMPLE_FLOW_RULES = {
  REQUEST_SUBMITTED: ["APPROVED", "DENIED"],
  APPROVED: [
    "SENT_TO_COLLECTON_CENTRE",
    "RECEIVED_AND_FORWARED",
    "RECEIVED_AT_LAB",
    "COMPLETED",
  ],
  DENIED: ["REQUEST_SUBMITTED"],
  SENT_TO_COLLECTON_CENTRE: [
    "RECEIVED_AND_FORWARED",
    "RECEIVED_AT_LAB",
    "COMPLETED",
  ],
  RECEIVED_AND_FORWARED: ["RECEIVED_AT_LAB", "COMPLETED"],
  RECEIVED_AT_LAB: ["COMPLETED"],
};

export const TEST_TYPE = [
  "UNK",
  "ANTIGEN",
  "RTPCR",
  "CBNAAT",
  "TRUENAT",
  "RTLAMP",
  "POCPCR",
];

export const VACCINES = [
  "CoviShield",
  "Covaxin",
  "Sputnik",
  "Moderna",
  "Pfizer",
  "Janssen",
  "Sinovac",
];

export const BLOOD_GROUPS = [
  "UNK",
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
];

export const SAMPLE_TYPE_CHOICES = [
  { id: "0", text: "UNKNOWN" },
  { id: "1", text: "BA/ETA" },
  { id: "2", text: "TS/NPS/NS" },
  { id: "3", text: "Blood in EDTA" },
  { id: "4", text: "Acute Sera" },
  { id: "5", text: "Covalescent sera" },
  { id: "6", text: "Biopsy" },
  { id: "7", text: "AMR" },
  { id: "8", text: "Communicable Diseases" },
  { id: "9", text: "OTHER TYPE" },
];

export const ICMR_CATEGORY = [
  "Cat 0",
  "Cat 1",
  "Cat 2",
  "Cat 3",
  "Cat 4",
  "Cat 5a",
  "Cat 5b",
];

export const TELEMEDICINE_ACTIONS = [
  { id: 10, text: "NO_ACTION", desc: "No Action" },
  { id: 20, text: "PENDING", desc: "Pending" },
  { id: 30, text: "SPECIALIST_REQUIRED", desc: "Specialist Required" },
  { id: 40, text: "PLAN_FOR_HOME_CARE", desc: "Plan for Home Care" },
  { id: 50, text: "FOLLOW_UP_NOT_REQUIRED", desc: "Follow Up Not Required" },
  { id: 60, text: "COMPLETE", desc: "Complete" },
  { id: 70, text: "REVIEW", desc: "Review" },
  { id: 80, text: "NOT_REACHABLE", desc: "Not Reachable" },
  { id: 90, text: "DISCHARGE_RECOMMENDED", desc: "Discharge Recommended" },
];

export const FRONTLINE_WORKER = [
  "NOT APPLICABLE",
  "HEALTHCARE WORKER",
  "ELECTED REPRESENTATIVE",
  "POLICE OFFICER",
  "REVENUE OFFICIAL",
  "TEACHER",
  "FIRE FORCE",
  "ANGNAWADI WORKER",
  "KUDUMBASREE",
  "VOLUNTEER",
  "SUPERVISOR",
];

export const DESIGNATION_HEALTH_CARE_WORKER = [
  "AMBULANCE DRIVER",
  "ASHA",
  "ATTENDER",
  "CLEANING STAFF",
  "CSSD STAFF",
  "ANEASTHESIA TECHNICHIAN",
  "DIALYSIS TECHNICIAN",
  "DIETICIAN",
  "DOCTOR",
  "FIELD STAFF",
  "LAB ASSISTANT",
  "LAB TECHNICIAN",
  "NURSING ASSISTANT",
  "OFFICE STAFF",
  "PALLIATIVE NURSE",
  "PHARMACIST",
  "PHYSICIAN ASSISTANT",
  "PHYSIOTHERAPIST",
  "PSYCHOLOGIST",
  "RADIOLOGY TECHNICIAN",
  "SECURITY STAFF",
  "SONOLOGIST",
  "STAFF NURSE",
  "OTHERS",
];

type NotificationEvent = {
  id: string;
  text: string;
  icon: IconName;
};

export const NOTIFICATION_EVENTS: NotificationEvent[] = [
  { id: "MESSAGE", text: "Notice", icon: "l-comment-alt-message" },
  {
    id: "PATIENT_CREATED",
    text: "Patient Created",
    icon: "l-user-plus",
  },
  {
    id: "PATIENT_UPDATED",
    text: "Patient Updated",
    icon: "l-edit",
  },
  {
    id: "PATIENT_CONSULTATION_CREATED",
    text: "Patient Consultation Created",
    icon: "l-heart",
  },
  {
    id: "PATIENT_CONSULTATION_UPDATED",
    text: "Patient Consultation Updated",
    icon: "l-heart-medical",
  },
  {
    id: "INVESTIGATION_SESSION_CREATED",
    text: "Investigation Session Created",
    icon: "l-search",
  },
  {
    id: "INVESTIGATION_UPDATED",
    text: "Investigation Updated",
    icon: "l-search-plus",
  },
  {
    id: "PATIENT_FILE_UPLOAD_CREATED",
    text: "Patient File Upload Created",
    icon: "l-file-medical",
  },
  {
    id: "CONSULTATION_FILE_UPLOAD_CREATED",
    text: "Consultation File Upload Created",
    icon: "l-file-upload",
  },
  {
    id: "PATIENT_CONSULTATION_UPDATE_CREATED",
    text: "Patient Consultation Update Created",
    icon: "l-heart",
  },
  {
    id: "PATIENT_CONSULTATION_UPDATE_UPDATED",
    text: "Patient Consultation Update Updated",
    icon: "l-heart-medical",
  },
  {
    id: "SHIFTING_UPDATED",
    text: "Shifting Updated",
    icon: "l-ambulance",
  },
  {
    id: "PATIENT_NOTE_ADDED",
    text: "Patient Note Added",
    icon: "l-notes",
  },
];

export const BREATHLESSNESS_LEVEL = [
  "NOT BREATHLESS",
  "MILD",
  "MODERATE",
  "SEVERE",
];

export const RESOURCE_CATEGORY_CHOICES = ["OXYGEN"];

export const RESOURCE_CHOICES: Array<OptionsType> = [
  { id: 10, text: "PENDING" },
  { id: 15, text: "ON HOLD" },
  { id: 20, text: "APPROVED" },
  { id: 30, text: "REJECTED" },
  { id: 55, text: "TRANSPORTATION TO BE ARRANGED" },
  { id: 70, text: "TRANSFER IN PROGRESS" },
  { id: 80, text: "COMPLETED" },
];
export const RESOURCE_SUBCATEGORIES: Array<OptionsType> = [
  { id: 110, text: "LMO in KL" },
  { id: 120, text: "B TYPE OXYGEN CYLINDER" },
  { id: 130, text: "C TYPE OXYGEN CYLINDER" },
  { id: 140, text: "JUMBO D TYPE OXYGEN CYLINDER" },
  { id: 1000, text: "UNSPECIFIED" },
];

export const RESOURCE_FILTER_ORDER: Array<OptionsType> = [
  { id: 1, text: "created_date", desc: "ASC Created Date" },
  { id: 2, text: "-created_date", desc: "DESC Created Date" },
  { id: 3, text: "modified_date", desc: "ASC Modified Date" },
  { id: 4, text: "-modified_date", desc: "DESC Modified Date" },
];

export const HEARTBEAT_RHYTHM_CHOICES = [
  "REGULAR",
  "IRREGULAR",
  "UNKNOWN",
] as const;

export const NURSING_CARE_PROCEDURES = [
  "oral_care",
  "hair_care",
  "bed_bath",
  "eye_care",
  "perineal_care",
  "skin_care",
  "pre_enema",
  "wound_dressing",
  "lymphedema_care",
  "ascitic_tapping",
  "colostomy_care",
  "colostomy_change",
  "personal_hygiene",
  "positioning",
  "suctioning",
  "ryles_tube_care",
  "ryles_tube_change",
  "iv_sitecare",
  "nubulisation",
  "dressing",
  "dvt_pump_stocking",
  "restrain",
  "chest_tube_care",
  "tracheostomy_care",
  "tracheostomy_tube_change",
  "stoma_care",
  "catheter_care",
  "catheter_change",
] as const;

export const EYE_OPEN_SCALE = [
  { value: 1, text: "No Response" },
  { value: 2, text: "To Pain" },
  { value: 3, text: "To Speech" },
  { value: 4, text: "Spontaneous" },
];

export const VERBAL_RESPONSE_SCALE = [
  { value: 1, text: "No Response" },
  { value: 2, text: "Incomprehensible words/Moans to pain" },
  { value: 3, text: "Inappropriate words/Cry to Pain" },
  { value: 4, text: "Confused/Irritable" },
  { value: 5, text: "Oriented to Time, Place and Person" },
];

export const MOTOR_RESPONSE_SCALE = [
  { value: 1, text: "No Response" },
  { value: 2, text: "Abnormal Extension(decerebrate)" },
  { value: 3, text: "Abnormal Flexion(decorticate)" },
  { value: 4, text: "Flexion/Withdrawal from pain" },
  { value: 5, text: "Moves to localized pain" },
  { value: 6, text: "Obeying commands/Normal acrivity" },
];

export const RHYTHM_CHOICES = [
  { id: 5, text: "REGULAR", desc: "Regular" },
  { id: 10, text: "IRREGULAR", desc: "Irregular" },
] as const;

export const BOWEL_ISSUE_CHOICES = [
  "NO_DIFFICULTY",
  "CONSTIPATION",
  "DIARRHOEA",
] as const;

export const BLADDER_DRAINAGE_CHOICES = [
  "NORMAL",
  "CONDOM_CATHETER",
  "DIAPER",
  "INTERMITTENT_CATHETER",
  "CONTINUOUS_INDWELLING_CATHETER",
  "CONTINUOUS_SUPRAPUBIC_CATHETER",
  "UROSTOMY",
] as const;

export const BLADDER_ISSUE_CHOICES = [
  "NO_ISSUES",
  "INCONTINENCE",
  "RETENTION",
  "HESITANCY",
] as const;

export const URINATION_FREQUENCY_CHOICES = [
  "NORMAL",
  "DECREASED",
  "INCREASED",
] as const;

export const SLEEP_CHOICES = [
  "EXCESSIVE",
  "SATISFACTORY",
  "UNSATISFACTORY",
  "NO_SLEEP",
] as const;

export const NUTRITION_ROUTE_CHOICES = [
  "ORAL",
  "RYLES_TUBE",
  "GASTROSTOMY_OR_JEJUNOSTOMY",
  "PEG",
  "PARENTERAL_TUBING_FLUID",
  "PARENTERAL_TUBING_TPN",
] as const;

export const ORAL_ISSUE_CHOICES = [
  "NO_ISSUE",
  "DYSPHAGIA",
  "ODYNOPHAGIA",
] as const;

export const APPETITE_CHOICES = [
  "INCREASED",
  "SATISFACTORY",
  "REDUCED",
  "NO_TASTE_FOR_FOOD",
  "CANNOT_BE_ASSESSED",
] as const;

export const LOCATION_BED_TYPES = [
  { id: "ISOLATION", name: "Isolation" },
  { id: "ICU", name: "ICU" },
  { id: "BED_WITH_OXYGEN_SUPPORT", name: "Bed with oxygen support" },
  { id: "REGULAR", name: "Regular" },
] as const;

export type CameraPTZ = {
  icon?: IconName;
  label: string;
  action: string;
  loadingLabel?: string;
  shortcutKey: string[];
  value?: number;
};

export const CAMERA_STATES = {
  IDLE: "idle",
  MOVING: {
    GENERIC: "Moving",
    UP: "Moving Up",
    DOWN: "Moving Down",
    LEFT: "Moving Left",
    RIGHT: "Moving Right",
  },
  ZOOMING: {
    IN: "Zooming In",
    OUT: "Zooming Out",
  },
  PRECISION: "Setting Precision",
  UPDATING_PRESET: "Updating Preset",
};

export const getCameraPTZ: (precision: number) => CameraPTZ[] = (precision) => [
  {
    icon: "l-angle-up",
    label: "Move Up",
    action: "up",
    loadingLabel: CAMERA_STATES.MOVING.UP,
    shortcutKey: ["Control", "Shift", "ArrowUp"],
  },
  {
    icon: "l-angle-down",
    label: "Move Down",
    action: "down",
    loadingLabel: CAMERA_STATES.MOVING.DOWN,
    shortcutKey: ["Control", "Shift", "ArrowDown"],
  },
  {
    icon: "l-angle-left",
    label: "Move Left",
    action: "left",
    loadingLabel: CAMERA_STATES.MOVING.LEFT,
    shortcutKey: ["Control", "Shift", "ArrowLeft"],
  },
  {
    icon: "l-angle-right",
    label: "Move Right",
    action: "right",
    loadingLabel: CAMERA_STATES.MOVING.RIGHT,
    shortcutKey: ["Control", "Shift", "ArrowRight"],
  },
  {
    value: precision,
    label: "Precision",
    action: "precision",
    loadingLabel: CAMERA_STATES.PRECISION,
    shortcutKey: ["Shift", "P"],
  },
  {
    icon: "l-search-plus",
    label: "Zoom In",
    action: "zoomIn",
    loadingLabel: CAMERA_STATES.ZOOMING.IN,
    shortcutKey: ["Shift", "I"],
  },
  {
    icon: "l-search-minus",
    label: "Zoom Out",
    action: "zoomOut",
    loadingLabel: CAMERA_STATES.ZOOMING.OUT,
    shortcutKey: ["Shift", "O"],
  },
  {
    icon: "l-save",
    label: "Update Preset",
    action: "updatePreset",
    loadingLabel: CAMERA_STATES.UPDATING_PRESET,
    shortcutKey: ["Shift", "S"],
  },
  {
    icon: "l-redo",
    label: "Reset",
    action: "reset",
    shortcutKey: ["Shift", "R"],
  },
  {
    icon: "l-expand-arrows-alt",
    label: "Full Screen",
    action: "fullScreen",
    shortcutKey: ["F"],
  },
];

// in future, if you find Unicon equivalents of all these icons, please replace them. Only use the same iconset throughout.
export const FACILITY_FEATURE_TYPES: {
  id: number;
  name: string;
  icon: IconName;
}[] = [
  {
    id: 1,
    name: "CT Scan",
    icon: "l-compact-disc",
  },
  {
    id: 2,
    name: "Maternity Care",
    icon: "l-baby-carriage",
  },
  {
    id: 3,
    name: "X-Ray",
    icon: "l-clipboard-alt",
  },
  {
    id: 4,
    name: "Neonatal Care",
    icon: "l-baby-carriage",
  },
  {
    id: 5,
    name: "Operation Theater",
    icon: "l-syringe",
  },
  {
    id: 6,
    name: "Blood Bank",
    icon: "l-medical-drip",
  },
];

export const WAVEFORM_VIEWABLE_LENGTH = 400;

//blacklisted paths will not scroll to top
export const BLACKLISTED_PATHS: RegExp[] = [
  /\/facility\/([A-Za-z0-9]+(-[A-Za-z0-9]+)+)\/patient\/([A-Za-z0-9]+(-[A-Za-z0-9]+)+)\/consultation\/([A-Za-z0-9]+(-[A-Za-z0-9]+)+)\/feed+/i,
  /\/facility\/([A-Za-z0-9]+(-[A-Za-z0-9]+)+)\/patient\/([A-Za-z0-9]+(-[A-Za-z0-9]+)+)\/consultation\/([A-Za-z0-9]+(-[A-Za-z0-9]+)+)\/summary+/i,
  /\/facility\/([A-Za-z0-9]+(-[A-Za-z0-9]+)+)\/patient\/([A-Za-z0-9]+(-[A-Za-z0-9]+)+)\/consultation\/([A-Za-z0-9]+(-[A-Za-z0-9]+)+)\/medicines+/i,
  /\/facility\/([A-Za-z0-9]+(-[A-Za-z0-9]+)+)\/patient\/([A-Za-z0-9]+(-[A-Za-z0-9]+)+)\/consultation\/([A-Za-z0-9]+(-[A-Za-z0-9]+)+)\/files+/i,
  /\/facility\/([A-Za-z0-9]+(-[A-Za-z0-9]+)+)\/patient\/([A-Za-z0-9]+(-[A-Za-z0-9]+)+)\/consultation\/([A-Za-z0-9]+(-[A-Za-z0-9]+)+)\/investigations+/i,
  /\/facility\/([A-Za-z0-9]+(-[A-Za-z0-9]+)+)\/patient\/([A-Za-z0-9]+(-[A-Za-z0-9]+)+)\/consultation\/([A-Za-z0-9]+(-[A-Za-z0-9]+)+)\/abg+/i,
  /\/facility\/([A-Za-z0-9]+(-[A-Za-z0-9]+)+)\/patient\/([A-Za-z0-9]+(-[A-Za-z0-9]+)+)\/consultation\/([A-Za-z0-9]+(-[A-Za-z0-9]+)+)\/nursing+/i,
  /\/facility\/([A-Za-z0-9]+(-[A-Za-z0-9]+)+)\/patient\/([A-Za-z0-9]+(-[A-Za-z0-9]+)+)\/consultation\/([A-Za-z0-9]+(-[A-Za-z0-9]+)+)\/neurological_monitoring+/i,
  /\/facility\/([A-Za-z0-9]+(-[A-Za-z0-9]+)+)\/patient\/([A-Za-z0-9]+(-[A-Za-z0-9]+)+)\/consultation\/([A-Za-z0-9]+(-[A-Za-z0-9]+)+)\/ventilator+/i,
  /\/facility\/([A-Za-z0-9]+(-[A-Za-z0-9]+)+)\/patient\/([A-Za-z0-9]+(-[A-Za-z0-9]+)+)\/consultation\/([A-Za-z0-9]+(-[A-Za-z0-9]+)+)\/nutrition+/i,
  /\/facility\/([A-Za-z0-9]+(-[A-Za-z0-9]+)+)\/patient\/([A-Za-z0-9]+(-[A-Za-z0-9]+)+)\/consultation\/([A-Za-z0-9]+(-[A-Za-z0-9]+)+)\/pressure_sore+/i,
  /\/facility\/([A-Za-z0-9]+(-[A-Za-z0-9]+)+)\/patient\/([A-Za-z0-9]+(-[A-Za-z0-9]+)+)\/consultation\/([A-Za-z0-9]+(-[A-Za-z0-9]+)+)\/dialysis+/i,
];

export const AssetImportSchema: SchemaType = {
  Name: { prop: "name", type: "string" },
  Type: {
    prop: "asset_type",
    type: "string",
    oneOf: ["INTERNAL", "EXTERNAL"],
    required: true,
  },
  Class: {
    prop: "asset_class",
    type: "string",
    oneOf: ["HL7MONITOR", "ONVIF", "VENTILATOR", ""],
  },
  Description: { prop: "description", type: "string" },
  "Working Status": {
    prop: "is_working",
    type: "boolean",
    parse: (status: string) => {
      if (status === "WORKING") {
        return true;
      } else if (status === "NOT WORKING") {
        return false;
      } else {
        throw new Error("Invalid Working Status: " + status);
      }
    },
    required: true,
  },
  "Not Working Reason": { prop: "not_working_reason", type: "string" },
  "Serial Number": { prop: "serial_number", type: "string" },
  "QR Code ID": { prop: "qr_code_id", type: "string" },
  Manufacturer: { prop: "manufacturer", type: "string" },
  "Vendor Name": { prop: "vendor_name", type: "string" },
  "Support Name": { prop: "support_name", type: "string" },
  "Support Email": {
    prop: "support_email",
    type: "string",
    parse: (email: string) => {
      if (!email) return null;
      const isValid = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email);

      if (!isValid) {
        throw new Error("Invalid Support Email: " + email);
      }

      return email;
    },
  },
  "Support Phone Number": {
    prop: "support_phone",
    type: "string",
    parse: (phone: number | string) => {
      phone = String(phone);
      if (phone.length === 10 && !phone.startsWith("1800")) {
        phone = "+91" + phone;
      }
      if (phone.startsWith("91") && phone.length === 12) {
        phone = "+" + phone;
      }
      if (phone.startsWith("+911800")) {
        phone = "1800" + phone.slice(6);
      }
      if (
        PhoneNumberValidator(["mobile", "landline", "support"])(phone) !==
        undefined
      ) {
        throw new Error("Invalid Support Phone Number: " + phone);
      }

      return phone ? phone : undefined;
    },
    required: true,
  },
  "Warranty End Date": {
    prop: "warranty_amc_end_of_validity",
    type: "string",
    parse: (date: string) => {
      if (!date) return null;
      //handles both "YYYY-MM-DD" and long date format eg : Wed Oct 14 2020 05:30:00 GMT+0530 (India Standard Time)
      if (isNaN(Date.parse(date))) {
        const parts = date.split("-");
        if (parts.length !== 3) {
          throw new Error("Invalid Date Format: " + date);
        }
        const reformattedDateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
        const parsed = new Date(reformattedDateStr);
        if (String(parsed) === "Invalid Date") {
          throw new Error("Invalid Date: " + date);
        }
        return dateQueryString(parsed);
      } else {
        const parsed = new Date(date);
        if (String(parsed) === "Invalid Date") {
          throw new Error("Invalid Date: " + date);
        }
        return dateQueryString(parsed);
      }
    },
  },
  "Last Service Date": {
    prop: "last_serviced_on",
    type: "string",
    parse: (date: string) => {
      if (!date) return null;
      if (isNaN(Date.parse(date))) {
        const parts = date.split("-");
        if (parts.length !== 3) {
          throw new Error("Invalid Date Format: " + date);
        }
        const reformattedDateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
        const parsed = new Date(reformattedDateStr);
        if (String(parsed) === "Invalid Date") {
          throw new Error("Invalid Date: " + date);
        }
        return dateQueryString(parsed);
      } else {
        const parsed = new Date(date);
        if (String(parsed) === "Invalid Date") {
          throw new Error("Invalid Date: " + date);
        }
        return dateQueryString(parsed);
      }
    },
  },
  Notes: { prop: "note", type: "string" },
  "Config - IP Address": {
    parent: "meta",
    prop: "local_ip_address",
    type: "string",
    parse: (ip: string) => {
      if (!ip) return null;
      const isValid =
        /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
          ip,
        );

      if (!isValid) {
        throw new Error("Invalid Config IP Address: " + ip);
      }

      return ip;
    },
  },
  "Config: Camera Access Key": {
    parent: "meta",
    prop: "camera_access_key",
    type: "string",
  },
};

// ABDM
export const ABDM_CONSENT_PURPOSE = [
  "CAREMGT",
  "BTG",
  "PUBHLTH",
  "HPAYMT",
  "DSRCH",
  "PATRQT",
] as ConsentPurpose[];

export const ABDM_HI_TYPE = [
  "Prescription",
  "DiagnosticReport",
  "OPConsultation",
  "DischargeSummary",
  "ImmunizationRecord",
  "HealthDocumentRecord",
  "WellnessRecord",
] as ConsentHIType[];

export const USER_TYPES_MAP = {
  Pharmacist: "Pharmacist",
  Volunteer: "Volunteer",
  StaffReadOnly: "Staff",
  Staff: "Staff",
  Doctor: "Doctor",
  Nurse: "Nurse",
  NurseReadOnly: "Nurse",
  WardAdmin: "Ward Admin",
  LocalBodyAdmin: "Local Body Admin",
  DistrictLabAdmin: "District Lab Admin",
  DistrictReadOnlyAdmin: "District Admin",
  DistrictAdmin: "District Admin",
  StateLabAdmin: "State Lab Admin",
  StateReadOnlyAdmin: "State Admin",
  StateAdmin: "State Admin",
  RemoteSpecialist: "Remote Specialist",
} as const;

export const AREACODES: Record<string, string[]> = {
  CA: [
    "403",
    "587",
    "250",
    "604",
    "778",
    "204",
    "431",
    "506",
    "709",
    "867",
    "902",
    "226",
    "249",
    "289",
    "343",
    "365",
    "416",
    "437",
    "519",
    "613",
    "647",
    "705",
    "807",
    "902",
    "418",
    "438",
    "450",
    "514",
    "579",
    "581",
    "819",
    "306",
    "639",
    "867",
  ],
  JM: ["658", "876"],
  PR: ["787", "939"],
  DO: ["809", "829"],
  RE: ["262", "263", "692", "693"],
  YT: ["269", "639"],
  CC: ["89162"],
  CX: ["89164"],
  BQ: ["9"],
  KZ: ["6", "7"],
  SJ: ["79"],
};

export const IN_LANDLINE_AREA_CODES = [
  "11",
  "22",
  "33",
  "44",
  "20",
  "40",
  "79",
  "80",
  "120",
  "124",
  "129",
  "135",
  "141",
  "160",
  "161",
  "172",
  "175",
  "181",
  "183",
  "233",
  "240",
  "241",
  "250",
  "251",
  "253",
  "257",
  "260",
  "261",
  "265",
  "343",
  "413",
  "422",
  "431",
  "435",
  "452",
  "462",
  "471",
  "474",
  "477",
  "478",
  "481",
  "484",
  "485",
  "487",
  "490",
  "497",
  "512",
  "522",
  "532",
  "542",
  "551",
  "562",
  "581",
  "591",
  "621",
  "612",
  "641",
  "657",
  "712",
  "721",
  "724",
  "751",
  "761",
  "821",
  "824",
  "831",
  "836",
  "866",
  "870",
  "891",
  "4822",
];

export const CONSENT_TYPE_CHOICES = [
  { id: 1, text: "Consent for admission" },
  { id: 2, text: "Patient Code Status" },
  { id: 3, text: "Consent for procedure" },
  { id: 4, text: "High risk consent" },
  { id: 5, text: "Others" },
];

export const CONSENT_PATIENT_CODE_STATUS_CHOICES = [
  { id: 1, text: "Do Not Hospitalise (DNH)" },
  { id: 2, text: "Do Not Resuscitate (DNR)" },
  { id: 3, text: "Comfort Care Only" },
  { id: 4, text: "Active treatment" },
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

export const SPOKE_RELATION_TYPES = [
  {
    text: "Regular",
    value: SpokeRelationship.REGULAR,
  },
  {
    text: "Tele ICU",
    value: SpokeRelationship.TELE_ICU,
  },
];

export const HumanBodyPaths = {
  anterior: [
    {
      d: "M535.244,212.572c32.253.43,32.684-31.823,32.684-31.823,9.891-.215,14.191-19.783,13.331-23.653s-7.526-1.5-7.526-1.5c3.656-30.1-9.676-48.38-17.847-53.756S535.244,95.6,535.244,95.6h.43s-12.472.86-20.643,6.236-21.5,23.653-17.846,53.756c0,0-6.666-2.365-7.526,1.5s3.44,23.438,13.331,23.653c0,0,.43,32.253,32.684,31.823Z",
      transform: "translate(-362.967 -95.599)",
      region: "AnteriorHead",
    },
    {
      d: "M512.129,213.97s31.608,4.954,47.574-1.394v14.456s-26.287,4.355-47.574,0Z",
      transform: "translate(-362.967 -95.599)",
      region: "AnteriorNeck",
    },
    {
      d: "M505.355,231.279s-56.766,25.8-69.452,34.4c0,0,15.7,20.857,21.072,66.872C456.975,332.555,469.417,246.838,505.355,231.279Z",
      transform: "translate(-362.967 -95.599)",
      region: "AnteriorRightShoulder",
    },
    {
      d: "M526.482,232.838l.806,137.346s-46.607-22.2-67.745,18.762C459.543,388.946,455.685,234.612,526.482,232.838Z",
      transform: "translate(-362.967 -95.599)",
      region: "AnteriorRightChest",
    },
    {
      d: "M433.108,269.768s34.728,55.552,18.279,141.992c0,0-19.57-9.107-33.761-7.333,0,0-1.613-106.276,0-110.952S429.721,271.058,433.108,269.768Z",
      transform: "translate(-362.967 -95.599)",
      region: "AnteriorRightArm",
    },
    {
      d: "M415.207,408.781s27.254-.968,35.963,11.45c0,0-7.58,59.024-13.547,77.57s-19.03,56.766-19.03,56.766l-22.254-2.742s1.451-34.672,1.29-45.477,5-49.993,9.514-62.249S415.207,408.781,415.207,408.781Z",
      transform: "translate(-362.967 -95.599)",
      region: "AnteriorRightForearm",
    },
    {
      d: "M396.6,556.524l18.245,2.606a1.808,1.808,0,0,1,1.565,1.776c.049,6.373.053,30.692-2.6,41.987-2.568,10.951-16.244,28.022-26.205,35.726a4.126,4.126,0,0,1-6.575-2.7c-.192-1.322-.39-2.923-.584-4.855a1.828,1.828,0,0,0-2.054-1.637l-4.174.551a1.818,1.818,0,0,1-2.026-2.171c.631-3.043,1.887-8.187,3.72-11.529,2.591-4.724,5.9-18.948,5.442-26.76a1.79,1.79,0,0,0-1.514-1.635,7.118,7.118,0,0,0-5.448,1c-1.364,1.043-3.83,4.558-5.963,7.825-1.941,2.973-6.715.452-5.152-2.736.018-.037.037-.074.056-.111,1.936-3.71,13.063-18.708,16.288-24.513,2.9-5.221,13.627-8.747,15.171-11.984A1.706,1.706,0,0,1,396.6,556.524Z",
      transform: "translate(-362.967 -95.599)",
      region: "AnteriorRightHand",
    },
    {
      d: "M674.037,556.2l-18.244,2.606a1.808,1.808,0,0,0-1.566,1.776c-.049,6.373-.052,30.692,2.6,41.988,2.569,10.951,16.244,28.021,26.205,35.726a4.126,4.126,0,0,0,6.576-2.7c.191-1.322.389-2.922.584-4.855a1.827,1.827,0,0,1,2.053-1.637l4.174.551a1.818,1.818,0,0,0,2.027-2.17c-.632-3.043-1.888-8.188-3.721-11.53-2.59-4.723-5.9-18.948-5.442-26.76a1.79,1.79,0,0,1,1.515-1.634,7.114,7.114,0,0,1,5.447,1c1.364,1.043,3.83,4.558,5.964,7.826,1.94,2.973,6.715.451,5.151-2.736-.018-.038-.037-.075-.056-.112-1.935-3.709-13.063-18.707-16.288-24.513-2.9-5.221-13.627-8.746-15.171-11.984A1.707,1.707,0,0,0,674.037,556.2Z",
      transform: "translate(-362.967 -95.599)",
      region: "AnteriorLeftHand",
    },
    {
      d: "M544.705,232.838h19.137s18.062,15.643,20,19.513,29.888,42.79,26.878,128.154c0,0-16.557-16.556-31.178-15.051,0,0,2.365-33.114-34.834-34.619Z",
      transform: "translate(-362.967 -95.599)",
      region: "AnteriorLeftChest",
    },
    {
      d: "M569.432,231.279s61.927,31.824,65.153,35.694c0,0-12.9,9.752-18.707,73.791C615.878,340.764,610.072,268.048,569.432,231.279Z",
      transform: "translate(-362.967 -95.599)",
      region: "AnteriorLeftShoulder",
    },
    {
      d: "M638.455,271.058s14.407,18.923,14.837,23.223-1.291,105.362.86,108.8c0,0-26.233,1.29-34.834,9.891,0,0-4.3-51.176.86-78.484S633.079,279.659,638.455,271.058Z",
      transform: "translate(-362.967 -95.599)",
      region: "AnteriorLeftArm",
    },
    {
      d: "M621.038,419s16.342-12.257,33.974-10.537c0,0,7.741,26.233,8.816,34.189s10.321,49.241,9.246,66.658.087,41.069.087,41.069-16.214,3.44-20.084,4.731c0,0-17.2-46.661-18.062-52.036S620.982,426.52,621.038,419Z",
      transform: "translate(-362.967 -95.599)",
      region: "AnteriorLeftForearm",
    },
    {
      d: "M510.758,934.272s-20.723,1.451-24.973,1.5a56.32,56.32,0,0,0-1.556,10.672c0,4.355.484,25.481-.645,28.061s-21.771,27.254-23.383,30.641.645,8.386,1.935,9.192,2.1,4.757,4.193,5.644c1.807.765,3.064,3.709,5.644,4.032s10.482-.645,12.418.726c0,0,.887,3.144,2.58,3.306.864.082,5.644,1.774,10.644-5.967s13.04-35.019,13.439-37.791c.249-1.732-1.183-2.125-1.506-5.189a112.484,112.484,0,0,1,1.855-20.64C513.419,948.3,510.758,934.272,510.758,934.272Z",
      transform: "translate(-362.967 -95.599)",
      region: "AnteriorRightFoot",
    },
    {
      d: "M563.251,934.191s20.756.564,25.006.616c0,0,.151,7.125.151,11.479s.162,24.351,1.29,26.932,22.531,27.576,24.144,30.963-.645,8.386-1.935,9.192-2.1,4.758-4.193,5.645c-1.807.764-3.064,3.709-5.645,4.031s-10.482-.645-12.417.726c0,0-.887,3.145-2.581,3.306-.864.082-5.644,1.774-10.643-5.967s-13.04-35.018-13.439-37.79c-.25-1.733,1.182-2.126,1.5-5.19a112.484,112.484,0,0,0-1.855-20.64C560.623,947.334,563.251,934.191,563.251,934.191Z",
      transform: "translate(-362.967 -95.599)",
      region: "AnteriorLeftFoot",
    },
    {
      d: "M485.2,932.363l24.513-1.4s1.666-37.2,2.526-41.285,4.731-85.149,4.086-99.771c0,0-30,2.527-49.348-3.924,0,0-6.451,44.026-1.828,62.841C467.775,859.527,484.874,929.6,485.2,932.363Z",
      transform: "translate(-362.967 -95.599)",
      region: "AnteriorRightLeg",
    },
    {
      d: "M469.231,420.715s-5.966-30.318-4.515-34.834a115.141,115.141,0,0,1,16.772-10.966c10.428-5.483,29.727-6.773,36.339-3.548,5.81,2.834,4.972,2.548,13.439,4.73l.054-142.13h9.192V334.92s32.415,1.291,31.931,33.06a72.9,72.9,0,0,0,8.869,2.419c5.322,1.129,23.062,9.031,25.642,19.675,0,0-4.945,22.2-3.655,32.684,0,0-39.4-29.835-47.306-31.609s-12.959,2.31-16.933,2.8c-4.483.547-11.71-.628-18.142-2.9C514.306,388.7,475.2,414.909,469.231,420.715Z",
      transform: "translate(-362.967 -95.599)",
      region: "AnteriorLowerChest",
    },
    {
      d: "M461.813,481.665c2.43-11.313,8.042-43.207,7.1-55.467,0,0,48.3-30.56,50.88-30.4s12.122,5.564,23.841,2.338c0,0,6.719-3.225,13.331.162s34.874,24.149,46.324,28.987c0,0-.524,28.746,1.573,37.777s10.159,42.091,10.966,46.123,0,.806,0,.806-58.057,50.155-59.669,52.574c0,0-6.451-6.29-20.481-6.774s-20.643,6.774-20.643,6.774l-60.152-51.122S460.965,485.617,461.813,481.665Z",
      transform: "translate(-362.967 -95.599)",
      region: "AnteriorAbdomen",
    },
    {
      d: "M554.381,790.77s30.748,3.226,51.39-4.945c0,0,3.441,40.424,0,63.432s-16.449,76.871-17.094,81.816c0,0-23.33.108-25.91-1.4,0,0-3.011-33.328-3.871-43S550.08,810.982,554.381,790.77Z",
      transform: "translate(-362.967 -95.599)",
      region: "AnteriorLeftLeg",
    },
    {
      d: "M454.072,520.056s-4.515,29.35-6.128,48.7.323,59.346,6.128,81.278,21.288,89.343,14.514,131.272c0,0,20.464,8.064,47.808,4.516,0,0,7.2-74.822,6.7-87.73,0,0,3.333-50.745,3.333-58.7s1.72-27.738,1.72-27.738-20.642-10.106-14.837-44.08C513.311,567.576,462.351,524.571,454.072,520.056Z",
      transform: "translate(-362.967 -95.599)",
      region: "AnteriorRightThigh",
    },
    {
      d: "M553.114,785.825s37.713,2.741,50.615-3.548c0,0-6.451-35.8-1.129-63.325s19.943-77.408,20.8-92.03,2.33-87.3-7.221-108.371l-56.426,49.455s3.441,37.629-18.922,44.725c0,0,7.741,68.807,7.741,78.913S554.857,777.654,553.114,785.825Z",
      transform: "translate(-362.967 -95.599)",
      region: "AnteriorLeftThigh",
    },
    {
      d: "M535.624,610.466s16.722-10.1,18.818-27.355-3.386-17.578-5.805-18.545-13.063-1.291-13.063-1.291h.1s-10.644.323-13.063,1.291-7.9,1.29-5.806,18.545S535.624,610.466,535.624,610.466Z",
      transform: "translate(-362.967 -95.599)",
      region: "AnteriorGroin",
    },
  ],

  posterior: [
    {
      d: "M 506.9838 158.0121 C 509.6029 173.1336 512.1258 187.9477 521.5039 184.4407 C 517.7283 191.6346 525.6919 202.9266 528.0919 210.8841 C 544.9623 208.3461 562.3174 208.3461 579.1878 210.8841 C 581.5893 202.9236 589.5363 191.6662 585.7863 184.4511 C 595.6744 187.4586 596.8188 174.3021 600.3813 158.5926 C 600.1173 156.4611 595.9999 158.5806 594.7788 159.0816 C 597.7384 128.3122 591.2088 97.1811 553.7104 97.22 C 516.1444 97.1497 509.5249 128.2116 512.5008 159.0891 C 511.0564 158.4651 508.4914 157.0971 506.9838 158.0121 Z",
      transform: "translate(-390.349 -94.472)",
      region: "PosteriorHead",
    },
    {
      d: "M 503.129 213.97 s 30.871 -1.97 46.871 0.03 v 12.456 s -26 -2.456 -47.574 0 Z",
      transform: "translate(-362.967 -95.599)",
      region: "PosteriorNeck",
    },
    {
      d: "M545.584,228.037V361.6s-13.6,10.828-25.282,13.145c-10.077,2-36.162,3.374-36.766-.857S478.9,239.117,545.584,228.037Z",
      transform: "translate(-390.349 -94.472)",
      region: "PosteriorLeftChest",
    },
    {
      d: "M563.865,228.037V361.6s13.6,10.828,25.282,13.145c10.076,2,36.161,3.374,36.766-.857S630.546,239.117,563.865,228.037Z",
      transform: "translate(-390.349 -94.472)",
      region: "PosteriorRightChest",
    },
    {
      d: "M550.973,228.188h8.914l.151,136.435s20.7,17.828,59.681,16.317c0,0-4.684,38.528-1.057,56.508s9.216,41.248,9.216,41.248-77.812,30.218-145.954-.151c0,0,9.67-35.96,9.972-58.321a167.6,167.6,0,0,0-4.23-39.888s37.924,5.439,62.1-15.713C549.764,364.623,550.52,228.188,550.973,228.188Z",
      transform: "translate(-390.349 -94.472)",
      region: "PosteriorAbdomen",
    },
    {
      d: "M523.223,230.857s-40.694,20.548-50.968,25.182-11.08,5.439-11.08,5.439,15.512,18.735,18.533,70.509C479.708,331.987,489.58,244.354,523.223,230.857Z",
      transform: "translate(-390.349 -94.472)",
      region: "PosteriorLeftShoulder",
    },
    {
      d: "M587.084,230.857s40.693,20.548,50.968,25.182,11.08,5.439,11.08,5.439S633.62,280.213,630.6,331.987C630.6,331.987,620.726,244.354,587.084,230.857Z",
      transform: "translate(-390.349 -94.472)",
      region: "PosteriorRightShoulder",
    },
    {
      d: "M457.951,265.306s-12.49,14.706-13.5,29.613,1.813,82.194.6,95.691c0,0,15.512-1.209,22.16,3.022s9.872,4.23,9.872,4.23,3.223-32.232,1.41-53.385S467.823,277.393,457.951,265.306Z",
      transform: "translate(-390.349 -94.472)",
      region: "PosteriorLeftArm",
    },
    {
      d: "M444.655,394.639s3.627-1.209,8.864,1.612,21.153,4.835,21.153,4.835a241.987,241.987,0,0,1-6.245,50.968c-6.446,27.8-23.167,79.977-22.966,81.992,0,0-17.325-4.03-20.951-3.828,0,0,1.209-21.354,1.612-31.427s.2-42.91,6.648-63.659S444.454,396.049,444.655,394.639Z",
      transform: "translate(-390.349 -94.472)",
      region: "PosteriorLeftForearm",
    },
    {
      d: "M423.5,533.844s-4.029,2.82-7.454,5.036-12.49,13.1-15.311,18.131-11.482,15.915-10.274,16.923,5.44.2,7.454-2.216,7.051-8.663,10.476-7.253c0,0,1.007,12.087-3.224,22.966s-4.633,13.7-4.633,13.7,2.591,2.22,7.063.809q.291-.091.592-.2s1.612,4.835.806,8.864,3.022,3.425,7.655,1.007,21.959-22.562,24.175-35.053,1.611-40.895,1.611-40.895S427.33,534.65,423.5,533.844Z",
      transform: "translate(-390.349 -94.472)",
      region: "PosteriorLeftHand",
    },
    {
      d: "M650.678,265.306s12.49,14.706,13.5,29.613-1.813,82.194-.6,95.691c0,0-15.512-1.209-22.16,3.022s-9.871,4.23-9.871,4.23-3.224-32.232-1.41-53.385S640.807,277.393,650.678,265.306Z",
      transform: "translate(-390.349 -94.472)",
      region: "PosteriorRightArm",
    },
    {
      d: "M663.974,394.639s-3.626-1.209-8.864,1.612-21.153,4.835-21.153,4.835a242.066,242.066,0,0,0,6.245,50.968c6.447,27.8,23.168,79.977,22.966,81.992,0,0,17.325-4.03,20.951-3.828,0,0-1.208-21.354-1.611-31.427s-.2-42.91-6.648-63.659S664.175,396.049,663.974,394.639Z",
      transform: "translate(-390.349 -94.472)",
      region: "PosteriorRightForearm",
    },
    {
      d: "M685.127,533.844s4.029,2.82,7.453,5.036,12.491,13.1,15.311,18.131,11.483,15.915,10.274,16.923-5.439.2-7.454-2.216-7.051-8.663-10.475-7.253c0,0-1.008,12.087,3.223,22.966s4.633,13.7,4.633,13.7-2.59,2.22-7.062.809q-.291-.091-.593-.2s-1.612,4.835-.806,8.864-3.022,3.425-7.655,1.007-21.958-22.562-24.174-35.053-1.612-40.895-1.612-40.895S681.3,534.65,685.127,533.844Z",
      transform: "translate(-390.349 -94.472)",
      region: "PosteriorRightHand",
    },
    {
      d: "M552.635,495.366s0,66.279-.6,69.9c-.051.277-.126.982-.2,2.065-5.691,6.673-27.473,28.254-58.673,9.04a10.164,10.164,0,0,1-1.738-1.309c-23.066-21.783-7.076-50.968-6.371-52.2l-2.216-1.234c-.176.327-17.652,32.107,6.849,55.249a14.16,14.16,0,0,0,2.166,1.662c9.519,5.842,18.232,8.033,25.988,8.033,16.116,0,27.977-9.519,33.642-15.235-1.661,20.07-6.144,82.369-6.5,86-.4,4.231-7.605,77.51-7.605,80.935,0,0-36.111-4.785-45.579-2.972,0,0,.2-37.672-2.821-59.63s-14.5-65.473-15.914-101.936-1.411-65.473,7.453-91.46C480.514,482.272,499.048,497.582,552.635,495.366Z",
      transform: "translate(-390.349 -94.472)",
      region: "PosteriorLeftThighAndButtock",
    },
    {
      d: "M555.471,495.366s0,66.279.6,69.9c.051.277.126.982.2,2.065,5.691,6.673,27.473,28.254,58.673,9.04a10.164,10.164,0,0,0,1.738-1.309c23.066-21.783,7.076-50.968,6.371-52.2l2.216-1.234c.176.327,17.652,32.107-6.85,55.249a14.151,14.151,0,0,1-2.165,1.662c-9.519,5.842-18.232,8.033-25.988,8.033-16.116,0-27.977-9.519-33.643-15.235,1.662,20.07,6.145,82.369,6.5,86,.4,4.231,7.605,77.51,7.605,80.935,0,0,36.111-4.785,45.579-2.972,0,0-.2-37.672,2.82-59.63s14.5-65.473,15.915-101.936,1.41-65.473-7.453-91.46C627.592,482.272,609.058,497.582,555.471,495.366Z",
      transform: "translate(-390.349 -94.472)",
      region: "PosteriorRightThighAndButtock",
    },
    {
      d: "M492.2,739.529s21.354-2.418,42.909,3.425c0,0,3.627,43.312,1.612,61.846s-7.655,75.445-6.849,80.078c0,0-19.944.907-25.988,2.518,0,0-2.619-29.009-9.267-49.154S486.961,754.839,492.2,739.529Z",
      transform: "translate(-390.349 -94.472)",
      region: "PosteriorLeftLeg",
    },
    {
      d: "M617.088,739.529s-21.354-2.418-42.909,3.425c0,0-3.626,43.312-1.612,61.846s7.655,75.445,6.85,80.078c0,0,19.944.907,25.987,2.518,0,0,2.619-29.009,9.267-49.154S622.326,754.839,617.088,739.529Z",
      transform: "translate(-390.349 -94.472)",
      region: "PosteriorRightLeg",
    },
    {
      d: "M504.387,891.023s17.728-.806,24.879-2.619c0,0,2.015,6.245,1.209,18.131s-1.007,21.555-.6,23.771,1.813,9.67-1.209,15.512S520,967.172,516.978,972.007s-10.275,5.439-11.886-1.611c0,0-1.813,3.424-7.857,1.41s-9.67-1.209-11.483-5.44-4.835-11.684-1.41-16.922,18.937-18.534,20.145-25.182S505.6,895.455,504.387,891.023Z",
      transform: "translate(-390.349 -94.472)",
      region: "PosteriorLeftFoot",
    },
    {
      d: "M604.752,891.023s-17.728-.806-24.88-2.619c0,0-2.014,6.245-1.209,18.131s1.008,21.555.605,23.771-1.813,9.67,1.209,15.512,8.662,21.354,11.684,26.189,10.274,5.439,11.886-1.611c0,0,1.813,3.424,7.856,1.41s9.67-1.209,11.483-5.44,4.835-11.684,1.41-16.922-18.936-18.534-20.145-25.182S603.543,895.455,604.752,891.023Z",
      transform: "translate(-390.349 -94.472)",
      region: "PosteriorRightFoot",
    },
  ],
} as const;

export type HumanBodyRegion = (typeof HumanBodyPaths)[
  | "anterior"
  | "posterior"][number]["region"];

export const PressureSoreExudateAmountOptions = [
  "None",
  "Light",
  "Moderate",
  "Heavy",
] as const;

export const PressureSoreTissueTypeOptions = [
  "Closed",
  "Epithelial",
  "Granulation",
  "Slough",
  "Necrotic",
] as const;

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
  ],
  PRESENTATION: ["pptx"],
  DOCUMENT: ["pdf", "docx"],
} as const;

export const PREVIEWABLE_FILE_EXTENSIONS = [
  "html",
  "htm",
  "pdf",
  "mp4",
  "webm",
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
] as const;

export const HEADER_CONTENT_TYPES = {
  pdf: "application/pdf",
  txt: "text/plain",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  doc: "application/msword",
  xls: "application/vnd.ms-excel",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  epub: "application/epub+zip",
  gif: "image/gif",
  html: "text/html",
  htm: "text/html",
  mp4: "video/mp4",
  png: "image/png",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  svg: "image/svg+xml",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
} as const;
