// Utility Functions
function getRandomIndex(max: number): number {
  const randomBytes = new Uint8Array(1);
  crypto.getRandomValues(randomBytes);
  return randomBytes[0] % max;
}

// Data Generators
export function generateName(onlyFirstName: boolean = false): string {
  const firstNames = [
    "John",
    "Jane",
    "Alex",
    "Sarah",
    "Michael",
    "Emma",
    "David",
    "Maria",
  ];
  const lastNames = [
    "Smith",
    "Johnson",
    "Williams",
    "Brown",
    "Jones",
    "Garcia",
    "Miller",
  ];

  const randomFirst = firstNames[getRandomIndex(firstNames.length)];
  const randomLast = lastNames[getRandomIndex(lastNames.length)];

  // Return full name by default, or only first name if specified
  return onlyFirstName ? randomFirst : `${randomFirst} ${randomLast}`;
}

export function generatePhoneNumber(): string {
  const validFirstDigits = [6, 7, 8, 9];
  const firstDigit = validFirstDigits[getRandomIndex(validFirstDigits.length)];

  const remainingDigits = new Uint8Array(9);
  crypto.getRandomValues(remainingDigits);
  const remainingDigitsStr = Array.from(remainingDigits)
    .map((byte) => byte % 10)
    .join("");

  return `${firstDigit}${remainingDigitsStr}`;
}

export function generateAddress(multiLine: boolean = false): string {
  const houseNumbers = ["123", "45A", "67B", "89", "234"];
  const apartments = ["Apt 4B", "Unit 12", "Flat 3A", "Suite 7", "#15"];
  const streets = [
    "Main Street",
    "Park Avenue",
    "Oak Road",
    "Church Street",
    "Hill Road",
  ];
  const areas = [
    "Downtown",
    "Westside",
    "North Colony",
    "South Extension",
    "East End",
  ];

  const randomHouse = houseNumbers[getRandomIndex(houseNumbers.length)];
  const randomApt = apartments[getRandomIndex(apartments.length)];
  const randomStreet = streets[getRandomIndex(streets.length)];
  const randomArea = areas[getRandomIndex(areas.length)];

  return multiLine
    ? `${randomHouse} ${randomStreet}\n${randomApt}\n${randomArea}`
    : `${randomHouse}, ${randomStreet}, ${randomArea}`;
}

export function generateUsername(firstName: string): string {
  const digitLength = getRandomIndex(8) + 1; // Random number between 1-8
  const randomDigits = new Uint8Array(digitLength);
  crypto.getRandomValues(randomDigits);
  const randomSuffix = Array.from(randomDigits)
    .map((byte) => byte % 10)
    .join("");

  return `${firstName.toLowerCase()}${randomSuffix}dev`;
}

export const medicineNames = [
  "Estriol",
  "Aspirin",
  "Ibuprofen",
  "Paracetamol",
  "Amoxicillin",
  "Metformin",
  "Lisinopril",
  "Atorvastatin",
  "Omeprazole",
  "Simvastatin",
  "Levothyroxine",
  "Metoprolol",
  "Losartan",
  "Gabapentin",
  "Hydrochlorothiazide",
  "Furosemide",
  "Citalopram",
  "Sertraline",
  "Alprazolam",
  "Clonazepam",
  "Zolpidem",
  "Tramadol",
  "Prednisone",
  "Warfarin",
  "Ciprofloxacin",
  "Azithromycin",
  "Doxycycline",
  "Fluoxetine",
  "Trazodone",
  "Venlafaxine",
];

export function getRandomMedicineName(): string {
  const randomIndex = getRandomIndex(medicineNames.length);
  return medicineNames[randomIndex];
}

export function generateDeviceName(): string {
  const deviceTypes = ["Camera", "Vital", "ABG", "Combined"];
  const randomDeviceType = deviceTypes[getRandomIndex(deviceTypes.length)];
  const randomNumber = (getRandomIndex(900) + 100).toString(); // Ensures 3 digits (100-999)

  return `${randomDeviceType}-${randomNumber}`;
}

export function generateRandomCharacter(
  options: {
    charLimit?: number;
    paragraphCount?: number;
  } = {},
): string {
  const { charLimit = 500, paragraphCount = 1 } = options;

  const patientSymptoms = [
    "fever",
    "headache",
    "cough",
    "sore throat",
    "fatigue",
    "nausea",
    "vomiting",
    "diarrhea",
    "chest pain",
    "shortness of breath",
    "dizziness",
    "joint pain",
    "muscle weakness",
    "rash",
    "abdominal pain",
    "back pain",
    "insomnia",
    "anxiety",
    "depression",
    "weight loss",
    "weight gain",
    "loss of appetite",
    "excessive thirst",
    "frequent urination",
    "blurred vision",
    "hearing loss",
    "memory problems",
    "confusion",
    "seizures",
    "tremors",
    "numbness",
    "tingling",
    "swelling",
    "bruising",
    "bleeding",
    "palpitations",
    "irregular heartbeat",
    "high blood pressure",
    "low blood pressure",
    "allergic reaction",
    "wheezing",
    "congestion",
    "runny nose",
    "sneezing",
    "itchy eyes",
    "red eyes",
    "dry mouth",
    "mouth sores",
    "tooth pain",
    "ear pain",
    "neck stiffness",
    "shoulder pain",
    "knee pain",
    "hip pain",
    "foot pain",
    "hand pain",
    "wrist pain",
    "elbow pain",
  ];

  const medicalTerms = [
    "hypertension",
    "diabetes",
    "asthma",
    "arthritis",
    "migraine",
    "anemia",
    "infection",
    "inflammation",
    "allergy",
    "fracture",
    "sprain",
    "strain",
    "contusion",
    "laceration",
    "abrasion",
    "burn",
    "wound",
    "ulcer",
    "tumor",
    "cancer",
    "benign",
    "malignant",
    "chronic",
    "acute",
    "severe",
    "mild",
    "moderate",
    "progressive",
    "recurrent",
    "remission",
    "relapse",
    "complication",
    "side effect",
    "medication",
    "treatment",
    "therapy",
    "surgery",
    "procedure",
    "diagnosis",
    "prognosis",
    "recovery",
    "rehabilitation",
    "physical therapy",
    "occupational therapy",
    "prescription",
    "dosage",
    "frequency",
    "duration",
    "contraindication",
    "allergy",
    "interaction",
    "monitoring",
  ];

  const generateParagraph = (): string => {
    let paragraph = "";
    const targetLength = charLimit / paragraphCount;
    const sentences = [];

    while (paragraph.length < targetLength) {
      const symptom = patientSymptoms[getRandomIndex(patientSymptoms.length)];
      const term = medicalTerms[getRandomIndex(medicalTerms.length)];
      const severity = ["mild", "moderate", "severe"][getRandomIndex(3)];
      const duration = [
        "for a few days",
        "for a week",
        "for several weeks",
        "for months",
      ][getRandomIndex(4)];

      const sentence = `Patient reports ${severity} ${symptom} ${duration}. ${term} noted during examination.`;
      sentences.push(sentence);
      paragraph = sentences.join(" ");
    }

    return paragraph.trim();
  };

  const paragraphs: string[] = [];
  for (let i = 0; i < paragraphCount; i++) {
    paragraphs.push(generateParagraph());
  }

  return paragraphs.join("\n\n");
}
