import { MJPJAY } from "./mahakavach";

export interface OptionsType {
  id: number;
  text: string;
  desc?: string;
  disabled?: boolean;
}

export const USER_TYPES: Array<String> = [
  "Volunteer",
  "Pharmacist",
  "StaffReadOnly",
  "Staff",
  "Doctor",
  "WardAdmin",
  "LocalBodyAdmin",
  "DistrictReadOnlyAdmin",
  "DistrictAdmin",
  "DistrictLabAdmin",
  "DivisionReadOnlyAdmin",
  "DivisionAdmin",
  "DivisionLabAdmin",
  "StateLabAdmin",
  "StateAdmin",
  "StateReadOnlyAdmin",
];

export const DOWNLOAD_TYPES: Array<String> = [
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
  { id: 1, text: "Educational Inst" },
  { id: 2, text: "Private Hospital" },
  { id: 3, text: "Other" },
  { id: 4, text: "Hostel" },
  { id: 5, text: "Hotel" },
  { id: 6, text: "Lodge" },
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
  { id: 1010, text: "COVID-19 Domiciliary Care Center" },
  { id: 1100, text: "First Line Treatment Centre" },
  { id: 1200, text: "Second Line Treatment Center" },
  { id: 1300, text: "Shifting Centre" },
  { id: 1400, text: "Covid Management Center" },
  { id: 1500, text: "Request Approving Center" },
  { id: 1510, text: "Request Fulfilment Center" },
  { id: 1600, text: "District War Room" },
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

export const PATIENT_FILTER_ORDER: Array<OptionsType> = [
  { id: 1, text: "created_date", desc: "ASC Created Date" },
  { id: 2, text: "-created_date", desc: "DESC Created Date" },
  { id: 3, text: "modified_date", desc: "ASC Modified Date" },
  { id: 4, text: "-modified_date", desc: "DESC Modified Date" },
  { id: 5, text: "review_time", desc: "ASC Review Time" },
  { id: 6, text: "-review_time", desc: "DESC Review Time" },
];

export const BED_TYPES: Array<OptionsType> = [
  { id: 1, text: "Non-Covid Ordinary Beds" },
  { id: 150, text: "Non-Covid Oxygen beds" },
  { id: 10, text: "Non-Covid ICU (ICU without ventilator)" },
  { id: 20, text: "Non-Covid Ventilator (ICU with ventilator)" },
  { id: 30, text: "Covid Ordinary Beds" },
  { id: 120, text: "Covid Oxygen beds" },
  { id: 110, text: "Covid ICU (ICU without ventilator)" },
  { id: 100, text: "Covid Ventilators (ICU with ventilator)" },
  { id: 40, text: `${MJPJAY} Ordinary Beds` },
  { id: 60, text: `${MJPJAY} Oxygen beds` },
  { id: 50, text: `${MJPJAY} ICU (ICU without ventilator)` },
  { id: 70, text: `${MJPJAY} ICU (ICU with ventilator)` },
  { id: 2, text: "Hostel" },
  { id: 3, text: "Single Room with Attached Bathroom" },
];

export const DOCTOR_SPECIALIZATION: Array<OptionsType> = [
  { id: 1, text: "General Medicine" },
  { id: 2, text: "Pulmonology" },
  { id: 3, text: "Critical Care" },
  { id: 4, text: "Paediatrics" },
  { id: 5, text: "Other Speciality" },
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
  { id: 300, text: "6 hours" },
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

export const GENDER_TYPES: Array<OptionsType> = [
  { id: 1, text: "Male" },
  { id: 2, text: "Female" },
  { id: 3, text: "Other" },
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
  "Home Isolation",
  "Isolation Room",
  "Bed with Oxygen Support",
  "ICU",
  "ICU with Oxygen Support",
  "ICU with Non Invasive Ventilator",
  "ICU with Invasive Ventilator",
  "Gynaecology Ward",
  "Paediatric Ward",
];

export const PATIENT_FILTER_ADMITTED_TO = [
  { id: "0", text: "Not admitted" },
  { id: "20", text: "Home Isolation" },
  { id: "1", text: "Isolation Room" },
  { id: "6", text: "Bed with Oxygen Support" },
  { id: "2", text: "ICU" },
  { id: "4", text: "ICU with Oxygen Support" },
  { id: "3", text: "ICU with Non Invasive Ventilator" },
  { id: "5", text: "ICU with Invasive Ventilator" },
  { id: "30", text: "Gynaecology Ward" },
  { id: "40", text: "Paediatric Ward" },
];

export const PATIENT_CATEGORY = [
  { id: "ASYMPTOMATIC", text: "ASYM (ASYMPTOMATIC) " },
  { id: "Category-A", text: "Mild (Category A)" },
  { id: "Category-B", text: "Moderate (Category B)" },
  { id: "Category-C", text: "Severe (Category C)" },
];

export const PATIENT_FILTER_CATEGORY = [
  { id: "ASYM", text: "ASYM (ASYMPTOMATIC) " },
  { id: "Mild", text: "Mild (Category A)" },
  { id: "Moderate", text: "Moderate (Category B)" },
  { id: "Severe", text: "Severe (Category C)" },
];

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

export const TEST_TYPE = ["UNK", "ANTIGEN", "RTPCR", "CBNAAT", "TRUENAT"];

export const VACCINES = ["CoviShield", "Covaxin"];

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
  "UNKNOWN",
  "BA/ETA",
  "TS/NPS/NS",
  "Blood in EDTA",
  "Acute Sera",
  "Covalescent sera",
  "OTHER TYPE",
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
  { id: "MESSAGE", text: "Message" },
  { id: "PATIENT_CREATED", text: "Patient Created" },
  { id: "PATIENT_UPDATED", text: "Patient Updated" },
  { id: "PATIENT_DELETED", text: "Patient Deleted" },
  { id: "PATIENT_CONSULTATION_CREATED", text: "Patient Consultation Created" },
  { id: "PATIENT_CONSULTATION_UPDATED", text: "Patient Consultation Updated" },
  { id: "PATIENT_CONSULTATION_DELETED", text: "Patient Consultation Deleted" },
  {
    id: "INVESTIGATION_SESSION_CREATED",
    text: "Investigation Session Created",
  },
  { id: "INVESTIGATION_UPDATED", text: "Investigation Updated" },
  { id: "PATIENT_FILE_UPLOAD_CREATED", text: "Patient File Upload Created" },
  {
    id: "CONSULTATION_FILE_UPLOAD_CREATED",
    text: "Consultation File Upload Created",
  },
  {
    id: "PATIENT_CONSULTATION_UPDATE_CREATED",
    text: "Patient Consultation Update Created",
  },
  {
    id: "PATIENT_CONSULTATION_UPDATE_UPDATED",
    text: "Patient Consultation Update Updated",
  },
  { id: "SHIFTING_UPDATED", text: "Shifting Updated" },
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
