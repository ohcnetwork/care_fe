function unbiasedRandom(max: number): number {
  const array = new Uint32Array(1);
  let randomValue;

  do {
    window.crypto.getRandomValues(array);
    randomValue = array[0];
  } while (randomValue > Math.floor(0xffffffff / max) * max);

  return randomValue % max;
}

function generatePhoneNumber(): string {
  const randomNum = unbiasedRandom(900000000) + 100000000; // Ensure 9-digit range
  return "9" + randomNum.toString();
}

function generateEmergencyPhoneNumber(): string {
  return generatePhoneNumber();
}

function generateFacilityName(): string {
  const prefixes = [
    "GHC",
    "NHC",
    "SHC",
    "Apollo",
    "General",
    "St. Mary's",
    "Central",
    "Kochi",
  ];
  const locations = [
    "North",
    "South",
    "East",
    "West",
    "Downtown",
    "Metro",
    "Springfield",
    "Ernakulam",
  ];
  const identifiers = [
    () => unbiasedRandom(100), // Numeric IDs
    () => `Zone-${unbiasedRandom(10)}`, // Zone IDs
    () => `Block-${String.fromCharCode(65 + unbiasedRandom(26))}`, // Alphabetic Blocks
  ];
  const suffixes = [
    "Meta",
    "Prime",
    "Care",
    "Wellness",
    "Clinic",
    "Center",
    "Specialists",
    "Hospital",
  ];

  const randomPrefix = prefixes[unbiasedRandom(prefixes.length)];
  const randomLocation = locations[unbiasedRandom(locations.length)];
  const randomIdentifier = identifiers[unbiasedRandom(identifiers.length)]();
  const randomSuffix = suffixes[unbiasedRandom(suffixes.length)];

  const formats = [
    `${randomPrefix} ${randomLocation}-${randomIdentifier} ${randomSuffix}`,
    `${randomLocation} ${randomPrefix} ${randomSuffix}`,
    `${randomPrefix} ${randomLocation} ${randomSuffix}`,
  ];

  return formats[unbiasedRandom(formats.length)];
}

function generateRandomAddress(multiline: boolean = false): string {
  const localities = [
    "Marine Drive",
    "Fort Kochi",
    "Thevara",
    "Vyttila",
    "Edappally",
    "Palarivattom",
    "Kakkanad",
    "Mattancherry",
    "Kaloor",
    "Tripunithura",
  ];
  const neighborhoods = [
    "Lane 1",
    "Lane 2",
    "North Block",
    "East End",
    "West Side",
    "Central Area",
    "Market Road",
    "Garden Street",
    "Highland Avenue",
  ];
  const districts = ["Kochi", "Ernakulam"];
  const states = ["Kerala"];
  const pincode = (682000 + unbiasedRandom(1000)).toString();

  const randomLocality = localities[unbiasedRandom(localities.length)];
  const randomNeighborhood =
    neighborhoods[unbiasedRandom(neighborhoods.length)];
  const randomDistrict = districts[unbiasedRandom(districts.length)];
  const randomState = states[unbiasedRandom(states.length)];

  const addressParts = [
    randomNeighborhood,
    randomLocality,
    randomDistrict,
    randomState,
    `Pincode: ${pincode}`,
  ];

  return multiline ? addressParts.join("\n") : addressParts.join(", ");
}

function generatePatientName(): string {
  const firstNames = [
    "John",
    "Jane",
    "Michael",
    "Sarah",
    "David",
    "Emma",
    "James",
    "Olivia",
    "Robert",
    "Sophia",
    "William",
    "Isabella",
    "Benjamin",
    "Mia",
    "Daniel",
    "Charlotte",
    "Lucas",
    "Amelia",
    "Ethan",
    "Harper",
  ];
  const lastNames = [
    "Smith",
    "Johnson",
    "Williams",
    "Brown",
    "Jones",
    "Miller",
    "Davis",
    "Garcia",
    "Rodriguez",
    "Wilson",
    "Martinez",
    "Hernandez",
    "Lopez",
    "Gonzalez",
    "Perez",
    "Taylor",
    "Anderson",
    "Thomas",
    "Jackson",
    "White",
  ];

  const randomFirstName = firstNames[unbiasedRandom(firstNames.length)];
  const randomLastName = lastNames[unbiasedRandom(lastNames.length)];

  return `${randomFirstName} ${randomLastName}`;
}

export {
  generatePhoneNumber,
  generateEmergencyPhoneNumber,
  generateFacilityName,
  generateRandomAddress,
  generatePatientName,
};
