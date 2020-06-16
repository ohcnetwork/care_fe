
export interface OptionsType {
  id: number;
  text: string;
  desc?: string;
  disabled?: boolean;
}

export const USER_TYPES: Array<String> = [
  "Staff",
  "DistrictLabAdmin",
  "DistrictAdmin",
  "StateLabAdmin",
  "StateAdmin"
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
  { id: 14, text: "Kasaragod" }
];

export const VEHICLE_TYPES: Array<OptionsType> = [
  { id: 1, text: "Basic" },
  { id: 2, text: "Cardiac" },
  { id: 3, text: "Hearse" }
];

export const FACILITY_TYPES: Array<OptionsType> = [
  { id: 1, text: "Educational Inst" },
  { id: 2, text: "Private Hospital" },
  { id: 3, text: "Other" },
  { id: 4, text: "Hostel" },
  { id: 5, text: "Hotel" },
  { id: 6, text: "Lodge" },
  { id: 7, text: "TeleMedicine" },
  { id: 900, text: "Primary Health Centres" },
  { id: 901, text: "24x7 Public Health Centres" },
  { id: 902, text: "Family Health Centres" },
  { id: 903, text: "Community Health Centres" },
  { id: 920, text: "Urban Primary Health Centre" },
  { id: 930, text: "Taluk Hospitals" },
  { id: 931, text: "Taluk Headquarters Hospitals" },
  { id: 940, text: "Women and Child Health Centres" },
  { id: 950, text: "General hospitals" },
  { id: 960, text: "District Hospitals" },
  {id: 1000, text: "Corona Care Centre"},
  {id: 1100, text: "First Line Treatment Centre"}
];

export const BED_TYPES: Array<OptionsType> = [
  { id: 1, text: "Normal" },
  { id: 2, text: "Hostel" },
  { id: 3, text: "Single Room with Attached Bathroom" },
  { id: 10, text: "ICU" },
  { id: 20, text: "Ventilator" }
];

export const DOCTOR_SPECIALIZATION: Array<OptionsType> = [
  { id: 1, text: "General Medicine" },
  { id: 2, text: "Pulmonology" },
  { id: 3, text: "Critical Care" },
  { id: 4, text: "Paediatrics" },
  { id: 5, text: "Other Speciality" }
];

export const MEDICAL_HISTORY_CHOICES: Array<OptionsType> = [
  { id: 1, text: "NO" },
  { id: 2, text: "Diabetes" },
  { id: 3, text: "Heart Disease" },
  { id: 4, text: "HyperTension" },
  { id: 5, text: "Kidney Diseases" }
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
  { id: 3, text: "Other" }
];

export const AGREE_CONSENT =
  "I / We confirm and agree that the Ambulances enrolled in the Private Voluntary Online Ambulance Network by filling this online form will work under instruction and direction of the State Mission Director, National Health Mission, Kerala or officers / teams duly authorised by the State Mission Director, National Health Mission, Kerala.";

export const AMBULANCE_FREE_SERVICE_CONSENT =
  "I / we will provide services free of any charge.";

export const AMBULANCE_SERVICE_FEE_TEXT =
  "I / we will require fees for providing service";


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
];

export const ADMITTED_TO = [
  "Isolation Room",
  "ICU",
  "ICU with Ventilator",
];

export const PATIENT_CATEGORY = [
  { id: "Category-A", text: "Mild (Category A)" },
  { id: "Category-B", text: "Moderate (Category B)" },
  { id: "Category-C", text: "Severe (Category C)" }
];

export const CURRENT_HEALTH_CHANGE = [
  { id: 0, text: 'NO DATA', desc: '', },
  { id: 3, text: 'STATUS QUO', desc: 'No Change' },
  { id: 4, text: 'BETTER', desc: 'Better' },
  { id: 2, text: 'WORSE', desc: 'Worse' },
  { id: 1, text: 'REQUIRES VENTILATOR', desc: 'Requires Ventilator' },
];

export const SAMPLE_TEST_STATUS = [
  { id: 1, text: "REQUEST_SUBMITTED", desc: "Request Submitted" },
  { id: 2, text: "APPROVED", desc: "Approved for Sample Collection" },
  { id: 3, text: "DENIED", desc: "Request Denied" },
  { id: 4, text: "SENT_TO_COLLECTON_CENTRE", desc: "Sample taken and sent to collection centre" },
  { id: 5, text: "RECEIVED_AND_FORWARED", desc: "Received And Forwarded" },
  { id: 6, text: "RECEIVED_AT_LAB", desc: "Received At Lab" },
  { id: 7, text: "COMPLETED", desc: "Test Completed" },
];

export const SAMPLE_FLOW_RULES = {
  REQUEST_SUBMITTED: ["APPROVED", "DENIED",],
  APPROVED: ["SENT_TO_COLLECTON_CENTRE"],
  DENIED: ["REQUEST_SUBMITTED"],
  SENT_TO_COLLECTON_CENTRE: ["RECEIVED_AND_FORWARED", "RECEIVED_AT_LAB", "COMPLETED"],
  RECEIVED_AND_FORWARED: ["RECEIVED_AT_LAB", "COMPLETED"],
  RECEIVED_AT_LAB: ["COMPLETED"],
};

export const ROLE_STATUS_MAP = {
  Staff: ["SENT_TO_COLLECTON_CENTRE"],
  DistrictAdmin: ["APPROVED", "DENIED", "SENT_TO_COLLECTON_CENTRE", "RECEIVED_AND_FORWARED"],
  StateLabAdmin: ["APPROVED", "DENIED", "SENT_TO_COLLECTON_CENTRE", "RECEIVED_AND_FORWARED", "RECEIVED_AT_LAB", "COMPLETED"],
};

export const DISEASE_STATUS = [
  "SUSPECTED",
  "POSITIVE",
  "NEGATIVE",
  "RECOVERY",
  "RECOVERED",
  "EXPIRED",
];

export const BLOOD_GROUPS = [
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

]
