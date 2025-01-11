// Utility Functions
function getRandomIndex(max: number): number {
  const randomBytes = new Uint8Array(1);
  crypto.getRandomValues(randomBytes);
  return randomBytes[0] % max;
}

// Data Generators
export function generatePatientName(): string {
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

  return `${randomFirst} ${randomLast}`;
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

export function generateAddress(): string {
  const houseNumbers = ["123", "45A", "67B", "89", "234"];
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
  const randomStreet = streets[getRandomIndex(streets.length)];
  const randomArea = areas[getRandomIndex(areas.length)];

  return `${randomHouse}, ${randomStreet}, ${randomArea}`;
}
