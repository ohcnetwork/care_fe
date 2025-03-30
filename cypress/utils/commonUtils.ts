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
  // Generate a random 4-byte (32-bit) array
  const randomBytes = new Uint32Array(1);
  crypto.getRandomValues(randomBytes);

  // Convert to a 4-digit string, ensuring leading zeros
  const randomSuffix = (randomBytes[0] % 10000).toString().padStart(4, "0");
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
