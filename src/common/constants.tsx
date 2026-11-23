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

export const NAME_PREFIXES = ["Dr.", "Mr.", "Mrs.", "Ms.", "Miss", "Prof."];
