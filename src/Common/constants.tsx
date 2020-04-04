
export interface OptionsType {
  id: number;
  text: string;
  disabled?: boolean;
}

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
  { id: 2, text: "Hospital" },
  { id: 3, text: "Other" },
  { id: 4, text: "Hostel" },
  { id: 5, text: "Hotel" },
  { id: 6, text: "Lodge" }
];

export const FACILITY_ID = {
  educational: 1,
  hospital: 2,
  other: 3,
  hostel: 4,
  hotel: 5,
  lodge: 6,
};

export const BED_TYPES: Array<OptionsType> = [
  { id: 1, text: "Normal" },
  { id: 2, text: "Hostel" },
  { id: 3, text: "Single Room with Attached Bathroom"},
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

export const SAMPLE_TEST_STATUS = [
  { id: 1, text: "REQUEST_SUBMITTED" },
  { id: 2, text: "APPROVED" },
  { id: 3, text: "DENIED" },
  { id: 4, text: "SENT_TO_COLLECTON_CENTRE" },
  { id: 5, text: "RECEIVED_AND_FORWARED" },
  { id: 6, text: "RECEIVED_AT_LAB" },
  { id: 7, text: "COMPLETED" },
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
