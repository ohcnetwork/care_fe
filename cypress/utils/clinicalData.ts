function getRandomIndex(max: number): number {
  const randomBytes = new Uint8Array(1);
  crypto.getRandomValues(randomBytes);
  return randomBytes[0] % max;
}

export const allergyNames = [
  "Vomitus",
  "Methylbenzethonium chloride",
  "Iron",
  "Soya bean protein",
  "Carbaryl",
  "Aspartame",
  "Clostridium botulinum toxin",
  "Aluminium",
  "Eucalyptus oil",
  "Nut",
  "Silicone",
  "Wood",
  "Cereal",
];

export const allergyStatus = [
  "Unconfirmed",
  "Confirmed",
  "Refuted",
  "Presumed",
];

export const allergyCriticality = ["Low", "High", "Unable to Assess"];

export const conditionNames = [
  "Adenosine deaminase 2 deficiency",
  "Acquired arteriovenous malformation of vascular structure of gastrointestinal tract",
  "Venous ulcer of left ankle",
  "Chronic respiratory failure due to obstructive sleep apnoea",
  "Malignant melanoma of skin of left wrist",
  "Renal scarring due to vesicoureteral reflux",
];

export const conditionStatus = ["Active", "Recurrence", "Relapse"];

export const symptomSeverity = ["Severe", "Moderate", "Mild"];

export const diagnosisVerification = [
  "Unconfirmed",
  "Provisional",
  "Differential",
  "Confirmed",
  "Refuted",
];

export function getRandomAllergyName(): string {
  const randomIndex = getRandomIndex(allergyNames.length);
  return allergyNames[randomIndex];
}

export function getRandomConditionName(): string {
  const randomIndex = getRandomIndex(conditionNames.length);
  return conditionNames[randomIndex];
}

export function getRandomAllergyStatus(): string {
  const randomIndex = getRandomIndex(allergyStatus.length);
  return allergyStatus[randomIndex];
}

export function getRandomConditionStatus(): string {
  const randomIndex = getRandomIndex(conditionStatus.length);
  return conditionStatus[randomIndex];
}

export function getRandomAllergyCriticality(): string {
  const randomIndex = getRandomIndex(allergyCriticality.length);
  return allergyCriticality[randomIndex];
}

export function getRandomSymptomSeverity(): string {
  const randomIndex = getRandomIndex(symptomSeverity.length);
  return symptomSeverity[randomIndex];
}

export function getRandomDiagnosisVerification(): string {
  const randomIndex = getRandomIndex(diagnosisVerification.length);
  return diagnosisVerification[randomIndex];
}
