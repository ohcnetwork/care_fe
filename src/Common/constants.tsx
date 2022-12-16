import { PatientCategory } from "../Components/Facility/models";

export const KeralaLogo = "images/kerala-logo.png";

export const RESULTS_PER_PAGE_LIMIT = 14;
export const PAGINATION_LIMIT = 36;
export interface OptionsType {
  id: number;
  text: string;
  desc?: string;
  disabled?: boolean;
}

export const KASP_STRING = process.env.REACT_APP_KASP_STRING ?? "";
export const KASP_FULL_STRING = process.env.REACT_APP_KASP_FULL_STRING ?? "";
export const KASP_ENABLED = process.env.REACT_APP_KASP_ENABLED === "true";

export type UserRole =
  | "Pharmacist"
  | "Volunteer"
  | "StaffReadOnly"
  | "Staff"
  | "Doctor"
  | "WardAdmin"
  | "LocalBodyAdmin"
  | "DistrictLabAdmin"
  | "DistrictReadOnlyAdmin"
  | "DistrictAdmin"
  | "StateLabAdmin"
  | "StateReadOnlyAdmin"
  | "StateAdmin";

const readOnly = true;
export const USER_TYPE_OPTIONS: {
  id: UserRole;
  role: string;
  readOnly?: true | undefined;
}[] = [
  { id: "Pharmacist", role: "Pharmacist" },
  { id: "Volunteer", role: "Volunteer" },
  { id: "StaffReadOnly", role: "Staff", readOnly },
  { id: "Staff", role: "Staff" },
  { id: "Doctor", role: "Doctor" },
  { id: "WardAdmin", role: "Ward Admin" },
  { id: "LocalBodyAdmin", role: "Local Body Admin" },
  { id: "DistrictLabAdmin", role: "District Lab Admin" },
  { id: "DistrictReadOnlyAdmin", role: "District Admin", readOnly },
  { id: "DistrictAdmin", role: "District Admin" },
  { id: "StateLabAdmin", role: "State Lab Admin" },
  { id: "StateReadOnlyAdmin", role: "State Admin", readOnly },
  { id: "StateAdmin", role: "State Admin" },
];

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
  { id: 2, text: "Private Hospital" },
  { id: 3, text: "Other" },
  // { id: 4, text: "Hostel" },
  // { id: 5, text: "Hotel" },
  // { id: 6, text: "Lodge" },
  { id: 7, text: "TeleMedicine" },
  { id: 8, text: "Govt Hospital" },
  { id: 9, text: "Labs" },
  { id: 800, text: "Primary Health Centres" },
  { id: 801, text: "24x7 Public Health Centres" },
  { id: 802, text: "Family Health Centres" },
  { id: 803, text: "Community Health Centres" },
  { id: 820, text: "Urban Primary Health Center" },
  { id: 830, text: "Taluk Hospitals" },
  { id: 831, text: "Taluk Headquarters Hospitals" },
  { id: 840, text: "Women and Child Health Centres" },
  { id: 850, text: "General hospitals" },
  { id: 860, text: "District Hospitals" },
  { id: 870, text: "Govt Medical College Hospitals" },
  { id: 950, text: "Corona Testing Labs" },
  { id: 1000, text: "Corona Care Centre" },
  // { id: 1010, text: "COVID-19 Domiciliary Care Center" },
  // { id: 1100, text: "First Line Treatment Centre" },
  // { id: 1200, text: "Second Line Treatment Center" },
  { id: 1300, text: "Shifting Centre" },
  // { id: 1400, text: "Covid Management Center" },
  { id: 1500, text: "Request Approving Center" },
  { id: 1510, text: "Request Fulfilment Center" },
  // { id: 1600, text: "District War Room" },
];

export const SHIFTING_CHOICES: Array<OptionsType> = [
  { id: 10, text: "PENDING" },
  { id: 15, text: "ON HOLD" },
  { id: 20, text: "APPROVED" },
  { id: 30, text: "REJECTED" },
  { id: 40, text: "DESTINATION APPROVED" },
  { id: 50, text: "DESTINATION REJECTED" },
  { id: 55, text: "TRANSPORTATION TO BE ARRANGED" },
  { id: 60, text: "PATIENT TO BE PICKED UP" },
  { id: 70, text: "TRANSFER IN PROGRESS" },
  { id: 80, text: "COMPLETED" },
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

export const PATIENT_FILTER_ORDER: (OptionsType & { order: string })[] = [
  { id: 1, text: "created_date", desc: "Created Date", order: "Ascending" },
  { id: 2, text: "-created_date", desc: "Created Date", order: "Descending" },
  { id: 3, text: "modified_date", desc: "Modified Date", order: "Ascending" },
  { id: 4, text: "-modified_date", desc: "Modified Date", order: "Descending" },
  { id: 5, text: "review_time", desc: "Review Time", order: "Ascending" },
  { id: 6, text: "-review_time", desc: "Review Time", order: "Descending" },
];

const KASP_BED_TYPES = KASP_ENABLED
  ? [
      { id: 40, text: KASP_STRING + " Ordinary Beds" },
      { id: 60, text: KASP_STRING + " Oxygen beds" },
      { id: 50, text: KASP_STRING + " ICU (ICU without ventilator)" },
      { id: 70, text: KASP_STRING + " ICU (ICU with ventilator)" },
    ]
  : [];

export const BED_TYPES: Array<OptionsType> = [
  { id: 1, text: "Non-Covid Ordinary Beds" },
  { id: 150, text: "Non-Covid Oxygen beds" },
  { id: 10, text: "Non-Covid ICU (ICU without ventilator)" },
  { id: 20, text: "Non-Covid Ventilator (ICU with ventilator)" },
  { id: 30, text: "Covid Ordinary Beds" },
  { id: 120, text: "Covid Oxygen beds" },
  { id: 110, text: "Covid ICU (ICU without ventilator)" },
  { id: 100, text: "Covid Ventilators (ICU with ventilator)" },
  ...KASP_BED_TYPES,
  { id: 2, text: "Hostel" },
  { id: 3, text: "Single Room with Attached Bathroom" },
];

export const DOCTOR_SPECIALIZATION: Array<OptionsType> = [
  { id: 1, text: "General Medicine", desc: "bg-doctors-general" },
  { id: 2, text: "Pulmonology", desc: "bg-doctors-pulmonology" },
  { id: 3, text: "Critical Care", desc: "bg-doctors-critical" },
  { id: 4, text: "Paediatrics", desc: "bg-doctors-paediatrics" },
  { id: 5, text: "Other Speciality", desc: "bg-doctors-other" },
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
  { id: 30, text: "30 minutes" },
  { id: 60, text: "1 hour" },
  { id: 120, text: "2 hours" },
  { id: 180, text: "3 hours" },
  { id: 240, text: "4 hours" },
  { id: 360, text: "6 hours" },
  { id: 480, text: "8 hours" },
  { id: 720, text: "12 hours" },
  { id: 1440, text: "24 hours" },
  { id: 2160, text: "36 hours" },
  { id: 2880, text: "48 hours" },
];

export const SYMPTOM_CHOICES: Array<OptionsType> = [
  { id: 1, text: "ASYMPTOMATIC" },
  { id: 2, text: "FEVER" },
  { id: 3, text: "SORE THROAT" },
  { id: 4, text: "COUGH" },
  { id: 5, text: "BREATHLESSNESS" },
  { id: 6, text: "MYALGIA" },
  { id: 7, text: "ABDOMINAL DISCOMFORT" },
  { id: 8, text: "VOMITING/DIARRHOEA" },
  { id: 10, text: "SARI" },
  { id: 11, text: "SPUTUM" },
  { id: 12, text: "NAUSEA" },
  { id: 13, text: "CHEST PAIN" },
  { id: 14, text: "HEMOPTYSIS" },
  { id: 15, text: "NASAL DISCHARGE" },
  { id: 16, text: "BODY ACHE" },
  { id: 9, text: "OTHERS" },
];

export const DISCHARGE_REASONS = [
  { id: "REC", text: "Recovered" },
  { id: "EXP", text: "Expired" },
  { id: "REF", text: "Referred" },
  { id: "LAMA", text: "LAMA" },
];

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
  { id: 1, text: "Male", icon: <i className="fa-solid fa-person" /> },
  { id: 2, text: "Female", icon: <i className="fa-solid fa-person-dress" /> },
  { id: 3, text: "Non-binary", icon: <i className="fa-solid fa-genderless" /> },
];

export const SAMPLE_TEST_RESULT = [
  { id: 1, text: "POSITIVE" },
  { id: 2, text: "NEGATIVE" },
  { id: 3, text: "AWAITING" },
  { id: 4, text: "INVALID" },
];

export const CONSULTATION_SUGGESTION = [
  { id: "HI", text: "Home Isolation" },
  { id: "A", text: "Admission" },
  { id: "R", text: "Refer to another Hospital" },
  { id: "OP", text: "OP Consultation" },
  { id: "DC", text: "Domiciliary Care" },
];

export const ADMITTED_TO = [
  { id: "1", text: "Isolation" },
  { id: "2", text: "ICU" },
  { id: "6", text: "Bed with oxygen support" },
  { id: "7", text: "Regular" },
];

export const PATIENT_CATEGORIES = [
  { id: "Comfort", text: "Comfort Care" },
  { id: "Stable", text: "Stable" },
  { id: "Moderate", text: "Slightly Abnormal" },
  { id: "Critical", text: "Critical" },
];

export const PatientCategoryTailwindClass: Record<PatientCategory, string> = {
  "Comfort Care": "patient-comfort",
  Stable: "patient-stable",
  "Slightly Abnormal": "patient-abnormal",
  Critical: "patient-critical",
  unknown: "patient-unknown",
};

export const PATIENT_FILTER_CATEGORIES = PATIENT_CATEGORIES;

export const CURRENT_HEALTH_CHANGE = [
  { id: 0, text: "NO DATA", desc: "" },
  { id: 3, text: "STATUS QUO", desc: "No Change" },
  { id: 4, text: "BETTER", desc: "Better" },
  { id: 2, text: "WORSE", desc: "Worse" },
  { id: 1, text: "REQUIRES VENTILATOR", desc: "Requires Ventilator" },
];

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

export const ROLE_STATUS_MAP = {
  Staff: ["SENT_TO_COLLECTON_CENTRE"],
  DistrictAdmin: [
    "APPROVED",
    "DENIED",
    "SENT_TO_COLLECTON_CENTRE",
    "RECEIVED_AND_FORWARED",
  ],
  StateLabAdmin: [
    "APPROVED",
    "DENIED",
    "SENT_TO_COLLECTON_CENTRE",
    "RECEIVED_AND_FORWARED",
    "RECEIVED_AT_LAB",
    "COMPLETED",
  ],
};

export const DISEASE_STATUS = [
  "POSITIVE",
  "SUSPECTED",
  "NEGATIVE",
  "RECOVERED",
  "EXPIRED",
];

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
  { id: 0, text: "UNKNOWN" },
  { id: 1, text: "BA/ETA" },
  { id: 2, text: "TS/NPS/NS" },
  { id: 3, text: "Blood in EDTA" },
  { id: 4, text: "Acute Sera" },
  { id: 5, text: "Covalescent sera" },
  { id: 6, text: "Biopsy" },
  { id: 7, text: "AMR" },
  { id: 8, text: "Communicable Diseases" },
  { id: 9, text: "OTHER TYPE" },
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
  { id: 10, text: "PENDING", desc: "Pending" },
  { id: 30, text: "SPECIALIST_REQUIRED", desc: "Specialist Required" },
  { id: 40, text: "PLAN_FOR_HOME_CARE", desc: "Plan for Home Care" },
  { id: 50, text: "FOLLOW_UP_NOT_REQUIRED", desc: "Follow Up Not Required" },
  { id: 60, text: "COMPLETE", desc: "Complete" },
  { id: 70, text: "REVIEW", desc: "Review" },
  { id: 80, text: "NOT_REACHABLE", desc: "Not Reachable" },
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

export const NOTIFICATION_EVENTS = [
  { id: "MESSAGE", text: "Notice", icon: "fa-regular fa-message" },
  {
    id: "PATIENT_CREATED",
    text: "Patient Created",
    icon: "fa-solid fa-user-plus",
  },
  {
    id: "PATIENT_UPDATED",
    text: "Patient Updated",
    icon: "fa-solid fa-user-pen",
  },
  {
    id: "PATIENT_DELETED",
    text: "Patient Deleted",
    icon: "fa-solid fa-user-minus",
  },
  {
    id: "PATIENT_CONSULTATION_CREATED",
    text: "Patient Consultation Created",
    icon: "fa-solid fa-heart-circle-check",
  },
  {
    id: "PATIENT_CONSULTATION_UPDATED",
    text: "Patient Consultation Updated",
    icon: "fa-solid fa-heart-circle-plus",
  },
  {
    id: "PATIENT_CONSULTATION_DELETED",
    text: "Patient Consultation Deleted",
    icon: "fa-solid fa-heart-circle-minus",
  },
  {
    id: "INVESTIGATION_SESSION_CREATED",
    text: "Investigation Session Created",
    icon: "fa-solid fa-magnifying-glass",
  },
  {
    id: "INVESTIGATION_UPDATED",
    text: "Investigation Updated",
    icon: "fa-solid fa-magnifying-glass-plus",
  },
  {
    id: "PATIENT_FILE_UPLOAD_CREATED",
    text: "Patient File Upload Created",
    icon: "fa-solid fa-file-medical",
  },
  {
    id: "CONSULTATION_FILE_UPLOAD_CREATED",
    text: "Consultation File Upload Created",
    icon: "fa-solid fa-file-waveform",
  },
  {
    id: "PATIENT_CONSULTATION_UPDATE_CREATED",
    text: "Patient Consultation Update Created",
    icon: "fa-solid fa-file-circle-check",
  },
  {
    id: "PATIENT_CONSULTATION_UPDATE_UPDATED",
    text: "Patient Consultation Update Updated",
    icon: "fa-solid fa-file-circle-plus",
  },
  {
    id: "SHIFTING_UPDATED",
    text: "Shifting Updated",
    icon: "fa-solid fa-truck-medical",
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
];

export const EYE_OPEN_SCALE = [
  { value: 4, text: "Spontaneous" },
  { value: 3, text: "To Speech" },
  { value: 2, text: "Pain" },
  { value: 1, text: "None" },
];

export const VERBAL_RESPONSE_SCALE = [
  { value: 5, text: "Oriented/Coos/Babbles" },
  { value: 4, text: "Confused/Irritable" },
  { value: 3, text: "Inappropriate words/Cry to Pain" },
  { value: 2, text: "Incomprehensible words/Moans to pain" },
  { value: 1, text: "None" },
];

export const MOTOR_RESPONSE_SCALE = [
  { value: 6, text: "Obeying commands" },
  { value: 5, text: "Moves to localised pain" },
  { value: 4, text: "Flexion withdrawal from pain" },
  { value: 3, text: "Abnormal Flexion(decorticate)" },
  { value: 2, text: "Abnormal Extension(decerebrate)" },
  { value: 1, text: "No Response" },
];
export const CONSULTATION_TABS: Array<OptionsType> = [
  { id: 1, text: "UPDATES", desc: "Updates" },
  { id: 13, text: "FEED", desc: "Feed" },
  { id: 2, text: "SUMMARY", desc: "Summary" },
  { id: 3, text: "MEDICINES", desc: "Medicines" },
  { id: 4, text: "FILES", desc: "Files" },
  { id: 5, text: "INVESTIGATIONS", desc: "Investigations" },
  { id: 6, text: "ABG", desc: "ABG" },
  { id: 7, text: "NURSING", desc: "Nursing" },
  { id: 8, text: "NEUROLOGICAL_MONITORING", desc: "Neurological Monitoring" },
  { id: 9, text: "VENTILATOR", desc: "Ventilator" },
  { id: 10, text: "NUTRITION", desc: "Nutrition" },
  { id: 11, text: "PRESSURE_SORE", desc: "Pressure Sore" },
  { id: 12, text: "DIALYSIS", desc: "Dialysis" },
];

export const RHYTHM_CHOICES: Array<OptionsType> = [
  { id: 0, text: "Unknown" },
  { id: 5, text: "Regular" },
  { id: 10, text: "Irregular" },
];

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
  {}
);

export type CameraPTZ = {
  icon?: string;
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
    icon: "chevron-up",
    label: "Move Up",
    action: "up",
    loadingLabel: CAMERA_STATES.MOVING.UP,
    shortcutKey: ["Control", "Shift", "ArrowUp"],
  },
  {
    icon: "chevron-down",
    label: "Move Down",
    action: "down",
    loadingLabel: CAMERA_STATES.MOVING.DOWN,
    shortcutKey: ["Control", "Shift", "ArrowDown"],
  },
  {
    icon: "chevron-left",
    label: "Move Left",
    action: "left",
    loadingLabel: CAMERA_STATES.MOVING.LEFT,
    shortcutKey: ["Control", "Shift", "ArrowLeft"],
  },
  {
    icon: "chevron-right",
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
    icon: "search-plus",
    label: "Zoom In",
    action: "zoomIn",
    loadingLabel: CAMERA_STATES.ZOOMING.IN,
    shortcutKey: ["Shift", "I"],
  },
  {
    icon: "search-minus",
    label: "Zoom Out",
    action: "zoomOut",
    loadingLabel: CAMERA_STATES.ZOOMING.OUT,
    shortcutKey: ["Shift", "O"],
  },
  {
    icon: "save",
    label: "Update Preset",
    action: "updatePreset",
    loadingLabel: CAMERA_STATES.UPDATING_PRESET,
    shortcutKey: ["Shift", "S"],
  },
  {
    icon: "undo",
    label: "Reset",
    action: "reset",
    shortcutKey: ["Shift", "R"],
  },
  {
    icon: "expand",
    label: "Full Screen",
    action: "fullScreen",
    shortcutKey: ["F"],
  },
];

export const FACILITY_FEATURE_TYPES = [
  {
    id: 1,
    name: "CT Scan",
    icon: "compact-disc",
  },
  {
    id: 2,
    name: "Maternity Care",
    icon: (
      <svg
        viewBox="0 0 14 18"
        xmlns="http://www.w3.org/2000/svg"
        className="text-primary-500 w-[14px] h-[18px] fill-current"
      >
        <path d="M7.00005 0.666626C7.66309 0.666626 8.29897 0.930018 8.76782 1.39886C9.23666 1.8677 9.50005 2.50358 9.50005 3.16663C9.50005 3.82967 9.23666 4.46555 8.76782 4.93439C8.29897 5.40323 7.66309 5.66663 7.00005 5.66663C6.33701 5.66663 5.70112 5.40323 5.23228 4.93439C4.76344 4.46555 4.50005 3.82967 4.50005 3.16663C4.50005 2.50358 4.76344 1.8677 5.23228 1.39886C5.70112 0.930018 6.33701 0.666626 7.00005 0.666626ZM13.6667 14L12 9.46663C11.7084 8.64163 11.45 7.92496 10.3334 7.33329C9.18338 6.74996 8.35005 6.49996 7.00005 6.49996C5.64172 6.49996 4.81671 6.74996 3.66671 7.33329C2.55005 7.92496 2.29171 8.64163 2.00005 9.46663L0.333382 14C0.066715 15.125 2.30005 16.0333 3.75838 16.6583V14.8333C3.75838 14.0416 4.47505 13.4833 5.90838 13.1416C6.04171 13.1083 6.16671 13.0916 6.26671 13.075C5.81671 12.3916 5.63338 11.7833 5.61671 11.7333L7.09171 11.2333C7.10005 11.25 7.52505 12.5583 8.53338 13.2166C8.70838 13.275 8.88338 13.3416 9.05005 13.4166C9.69172 13.7 10.075 14.0666 10.2 14.5083C9.08338 14.95 8.01672 15.175 7.00005 15.175L6.16671 15.0916V17.2833L7.00005 17.3333C8.14171 17.3333 9.22505 17.1 10.2417 16.6583C11.7 16.0333 13.875 14.9416 13.6667 14ZM9.91671 13.1666C9.58519 13.1666 9.26725 13.0349 9.03283 12.8005C8.79841 12.5661 8.66671 12.2481 8.66671 11.9166C8.66671 11.5851 8.79841 11.2672 9.03283 11.0327C9.26725 10.7983 9.58519 10.6666 9.91671 10.6666C10.2482 10.6666 10.5662 10.7983 10.8006 11.0327C11.035 11.2672 11.1667 11.5851 11.1667 11.9166C11.1667 12.2481 11.035 12.5661 10.8006 12.8005C10.5662 13.0349 10.2482 13.1666 9.91671 13.1666Z" />
      </svg>
    ),
  },
  {
    id: 3,
    name: "X-Ray",
    icon: (
      <svg
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
        className="fill-current text-primary-500 w-4 h-4"
      >
        <path d="M0 1.5C0 .8.6.2 1.3.2h17.4a1.2 1.2 0 1 1 0 2.5v12.6a1.2 1.2 0 1 1 0 2.4H1.4a1.2 1.2 0 1 1 0-2.4V2.7C.6 2.8 0 2.3 0 1.6Zm10 1.3c-.3 0-.6.2-.6.6V4H5.6c-.3 0-.6.3-.6.6 0 .4.3.7.6.7h3.8v1.2h-5c-.4 0-.7.3-.7.6 0 .4.3.7.7.7h5V9H5.6c-.3 0-.6.3-.6.6 0 .4.3.7.6.7h3.8v1.2H5.9a1 1 0 0 0-.7 1.5l1.2 1.8c.2.3.5.4.8.4h5.6c.3 0 .6-.1.8-.4l1.2-1.8a1 1 0 0 0-.7-1.5h-3.5v-1.3h3.8c.3 0 .6-.2.6-.6 0-.3-.3-.6-.6-.6h-3.8V7.7h5c.4 0 .7-.2.7-.6 0-.3-.3-.6-.7-.6h-5V5.2h3.8c.3 0 .6-.2.6-.6 0-.3-.3-.6-.6-.6h-3.8v-.6c0-.4-.3-.6-.6-.6ZM8.1 14a.6.6 0 0 1-.6-.6c0-.4.3-.7.6-.7.4 0 .7.3.7.7 0 .3-.3.6-.7.6Zm4.4-.6c0 .3-.3.6-.6.6a.6.6 0 0 1-.7-.6c0-.4.3-.7.7-.7.3 0 .6.3.6.7Z" />
      </svg>
    ),
  },
  {
    id: 4,
    name: "Neonatal Care",
    icon: "baby-carriage",
  },
  {
    id: 5,
    name: "Operation Theater",
    icon: "syringe",
  },
  {
    id: 6,
    name: "Blood Bank",
    icon: "tear",
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
