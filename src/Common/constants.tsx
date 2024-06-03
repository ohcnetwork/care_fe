import { IConfig } from "./hooks/useConfig";
import { PatientCategory } from "../Components/Facility/models";
import { SortOption } from "../Components/Common/SortDropdown";
import { dateQueryString } from "../Utils/utils";
import { IconName } from "../CAREUI/icons/CareIcon";
import { PhoneNumberValidator } from "../Components/Form/FieldValidators";
import { SchemaType } from "./schemaParser";
import {
  ConsentHIType,
  ConsentPurpose,
} from "../Components/ABDM/types/consent";

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

export const DISCHARGED_PATIENT_SORT_OPTIONS: SortOption[] = [
  { isAscending: false, value: "-created_date" },
  { isAscending: true, value: "created_date" },
  { isAscending: false, value: "-modified_date" },
  { isAscending: true, value: "modified_date" },
  { isAscending: true, value: "name" },
  { isAscending: false, value: "-name" },
];

export const getBedTypes = ({
  kasp_enabled,
  kasp_string,
}: Pick<IConfig, "kasp_enabled" | "kasp_string">) => {
  const kaspBedTypes = kasp_enabled
    ? [
        { id: 40, text: kasp_string + " Ordinary Beds" },
        { id: 60, text: kasp_string + " Oxygen beds" },
        { id: 50, text: kasp_string + " ICU (ICU without ventilator)" },
        { id: 70, text: kasp_string + " ICU (ICU with ventilator)" },
      ]
    : [];

  return [
    { id: 1, text: "Ordinary Beds" },
    { id: 150, text: "Oxygen beds" },
    { id: 10, text: "ICU (ICU without ventilator)" },
    { id: 20, text: "Ventilator (ICU with ventilator)" },
    { id: 30, text: "Covid Ordinary Beds" },
    { id: 120, text: "Covid Oxygen beds" },
    { id: 110, text: "Covid ICU (ICU without ventilator)" },
    { id: 100, text: "Covid Ventilators (ICU with ventilator)" },
    ...kaspBedTypes,
    { id: 2, text: "Hostel" },
    { id: 3, text: "Single Room with Attached Bathroom" },
  ];
};

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
  { id: 29, text: "Immunologist" },
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
  { id: 7 * 24 * 60, text: "7 days" },
  { id: 14 * 24 * 60, text: "2 weeks" },
  { id: 30 * 24 * 60, text: "1 month" },
];

export const DISCHARGE_REASONS = [
  { id: 1, text: "Recovered" },
  { id: 2, text: "Referred" },
  { id: 3, text: "Expired" },
  { id: 4, text: "LAMA" },
] as const;

export const CONSCIOUSNESS_LEVEL = [
  { id: "UNRESPONSIVE", text: "Unresponsive" },
  { id: "RESPONDS_TO_PAIN", text: "Responds to Pain" },
  { id: "RESPONDS_TO_VOICE", text: "Responds to Voice" },
  { id: "ALERT", text: "Alert" },
  { id: "AGITATED_OR_CONFUSED", text: "Agitated or Confused" },
  {
    id: "ONSET_OF_AGITATION_AND_CONFUSION",
    text: "Onset of Agitation and Confusion",
  },
] as const;

export const LINES_CATHETER_CHOICES: Array<OptionsType> = [
  { id: 1, text: "CVP catheter " },
  { id: 2, text: "Arterial Line" },
  { id: 3, text: "Quinton catheter" },
  { id: 4, text: "Chest Tubes (ICD)" },
  { id: 5, text: "NG Tube/GT" },
  { id: 6, text: "Urine Catheters" },
  { id: 7, text: "Other" },
];

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
  { id: "NIV", text: "NON_INVASIVE" },
  { id: "IV", text: "INVASIVE" },
  { id: "O2", text: "OXYGEN_SUPPORT" },
  { id: "NONE", text: "UNKNOWN" },
];

export type PatientCategoryID = "Comfort" | "Stable" | "Moderate" | "Critical";

export const PATIENT_CATEGORIES: {
  id: PatientCategoryID;
  text: PatientCategory;
  twClass: string;
}[] = [
  { id: "Comfort", text: "Comfort Care", twClass: "patient-comfort" },
  { id: "Stable", text: "Mild", twClass: "patient-stable" },
  { id: "Moderate", text: "Moderate", twClass: "patient-abnormal" },
  { id: "Critical", text: "Critical", twClass: "patient-critical" },
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

export const NURSING_CARE_FIELDS: Array<OptionsType> = [
  { id: 1, text: "personal_hygiene", desc: "Personal Hygiene" },
  { id: 2, text: "positioning", desc: "Positioning" },
  { id: 3, text: "suctioning", desc: "Suctioning" },
  { id: 4, text: "ryles_tube_care", desc: "Ryles Tube Care" },
  { id: 5, text: "iv_sitecare", desc: "IV Site Care" },
  { id: 6, text: "nubulisation", desc: "Nubulisation" },
  { id: 7, text: "dressing", desc: "Dressing" },
  { id: 8, text: "dvt_pump_stocking", desc: "DVT Pump Stocking" },
  { id: 9, text: "restrain", desc: "Restrain" },
  { id: 10, text: "chest_tube_care", desc: "Chest Tube Care" },
  { id: 11, text: "tracheostomy_care", desc: "Tracheostomy Care" },
  { id: 12, text: "stoma_care", desc: "Stoma Care" },
  { id: 13, text: "catheter_care", desc: "Catheter Care" },
];

export const EYE_OPEN_SCALE = [
  { value: 4, text: "Spontaneous" },
  { value: 3, text: "To Speech" },
  { value: 2, text: "To Pain" },
  { value: 1, text: "No Response" },
];

export const VERBAL_RESPONSE_SCALE = [
  { value: 5, text: "Oriented to Time, Place and Person" },
  { value: 4, text: "Confused/Irritable" },
  { value: 3, text: "Inappropriate words/Cry to Pain" },
  { value: 2, text: "Incomprehensible words/Moans to pain" },
  { value: 1, text: "No Response" },
];

export const MOTOR_RESPONSE_SCALE = [
  { value: 6, text: "Obeying commands/Normal acrivity" },
  { value: 5, text: "Moves to localized pain" },
  { value: 4, text: "Flexion/Withdrawal from pain" },
  { value: 3, text: "Abnormal Flexion(decorticate)" },
  { value: 2, text: "Abnormal Extension(decerebrate)" },
  { value: 1, text: "No Response" },
];
export const CONSULTATION_TABS = [
  { text: "UPDATES", desc: "Overview" },
  { text: "FEED", desc: "Feed" },
  { text: "SUMMARY", desc: "Vitals" },
  { text: "ABG", desc: "ABG" },
  { text: "MEDICINES", desc: "Medicines" },
  { text: "FILES", desc: "Files" },
  { text: "INVESTIGATIONS", desc: "Investigations" },
  { text: "NEUROLOGICAL_MONITORING", desc: "Neuro" },
  { text: "VENTILATOR", desc: "Ventilation" },
  { text: "NUTRITION", desc: "Nutrition" },
  { text: "PRESSURE_SORE", desc: "Pressure Sore" },
  { text: "NURSING", desc: "Nursing" },
  { text: "DIALYSIS", desc: "Dialysis" },
  { text: "ABDM", desc: "ABDM Records" },
];

export const RHYTHM_CHOICES = [
  { id: 5, text: "REGULAR", desc: "Regular" },
  { id: 10, text: "IRREGULAR", desc: "Irregular" },
] as const;

export const LOCATION_BED_TYPES: Array<any> = [
  { id: "ISOLATION", name: "Isolation" },
  { id: "ICU", name: "ICU" },
  { id: "BED_WITH_OXYGEN_SUPPORT", name: "Bed with oxygen support" },
  { id: "REGULAR", name: "Regular" },
];
// Deprecated Bed Types
// {
//   id: "ICU_WITH_NON_INVASIVE_VENTILATOR",
//   name: "ICU with non invasive ventilator",
// },
// { id: "ICU_WITH_OXYGEN_SUPPORT", name: "ICU with oxygen support" },
// { id: "ICU_WITH_INVASIVE_VENTILATOR", name: "ICU with invasive ventilator" }
export const ASSET_META_TYPE = [
  { id: "CAMERA", text: "Camera(ONVIF)" },
  { id: "HL7MONITOR", text: "Vitals Monitor(HL7)" },
];

export const CAMERA_TYPE = [
  { id: "HIKVISION", text: "ONVIF Camera (HIKVISION)" },
];

export const GENDER: { [key: number]: string } = GENDER_TYPES.reduce(
  (acc, curr) => ({ ...acc, [curr.id]: curr.text }),
  {},
);

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

export const ExternalResultImportSchema: SchemaType = {
  District: { prop: "district", type: "any" },
  "SRF ID": { prop: "srf_id", type: "string" },
  Name: { prop: "name", type: "string" },
  Age: { prop: "age", type: "number" },
  "Age in": { prop: "age_in", type: "string" },
  Gender: { prop: "gender", type: "string" },
  "Mobile Number": { prop: "mobile_number", type: "any" },
  Address: { prop: "address", type: "string" },
  Ward: { prop: "ward", type: "number" },
  "Local Body": { prop: "local_body", type: "string" },
  "Local Body Type": { prop: "local_body_type", type: "string" },
  Source: { prop: "source", type: "string" },
  "Sample Collection Date": {
    prop: "sample_collection_date",
    type: "string",
    parse: (date: string) => {
      if (!date) return null;
      if (isNaN(Date.parse(date))) {
        const parsed = new Date(date);
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
  "Result Date": {
    prop: "result_date",
    type: "string",
    parse: (date: string) => {
      if (!date) return null;
      if (isNaN(Date.parse(date))) {
        const parsed = new Date(date);
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
  "Test Type": { prop: "test_type", type: "string" },
  "Lab Name": { prop: "lab_name", type: "string" },
  "Sample Type": { prop: "sample_type", type: "string" },
  "Patient Status": { prop: "patient_status", type: "string" },
  "Is Repeat": { prop: "is_repeat", type: "string" },
  "Patient Category": { prop: "patient_category", type: "string" },
  Result: { prop: "result", type: "string" },
};

// ABDM
export const ABDM_CONSENT_PURPOSE = [
  { value: "CAREMGT", label: "Care Management" },
  { value: "BTG", label: "Break The Glass" },
  { value: "PUBHLTH", label: "Public Health" },
  { value: "HPAYMT", label: "Healthcare Payment" },
  { value: "DSRCH", label: "Disease Specific Healthcare Research" },
  { value: "PATRQT", label: "Self Requested" },
] as { value: ConsentPurpose; label: string }[];

export const ABDM_HI_TYPE = [
  { value: "Prescription", label: "Prescription" },
  { value: "DiagnosticReport", label: "Diagnostic Report" },
  { value: "OPConsultation", label: "Op Consultation" },
  { value: "DischargeSummary", label: "Discharge Summary" },
  { value: "ImmunizationRecord", label: "Immunization Record" },
  { value: "HealthDocumentRecord", label: "Record Artifact" },
  { value: "WellnessRecord", label: "Wellness Record" },
] as { value: ConsentHIType; label: string }[];

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
