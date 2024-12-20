function generatePhoneNumber(): string {
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  const randomNum = (array[0] % 900000000) + 100000000;
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
    () => Math.floor(Math.random() * 100), // Numeric IDs
    () => `Zone-${Math.floor(Math.random() * 10)}`, // Zone IDs
    () => `Block-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`, // Alphabetic Blocks
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

  const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const randomLocation =
    locations[Math.floor(Math.random() * locations.length)];
  const randomIdentifier =
    identifiers[Math.floor(Math.random() * identifiers.length)]();
  const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];

  // Randomize the format of the name
  const formats = [
    `${randomPrefix} ${randomLocation}-${randomIdentifier} ${randomSuffix}`,
    `${randomLocation} ${randomPrefix} ${randomSuffix}`,
    `${randomPrefix} ${randomLocation} ${randomSuffix}`,
  ];

  return formats[Math.floor(Math.random() * formats.length)];
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
  const pincode = Math.floor(682000 + Math.random() * 1000).toString(); // Generate random pincodes in the 682XXX range.

  const randomLocality =
    localities[Math.floor(Math.random() * localities.length)];
  const randomNeighborhood =
    neighborhoods[Math.floor(Math.random() * neighborhoods.length)];
  const randomDistrict =
    districts[Math.floor(Math.random() * districts.length)];
  const randomState = states[Math.floor(Math.random() * states.length)];

  // Create address components
  const addressParts = [
    randomNeighborhood,
    randomLocality,
    randomDistrict,
    randomState,
    `Pincode: ${pincode}`,
  ];

  // Return address as single line or multiline
  // If 'multiline' is false, return address as a single line
  // If 'multiline' is true, return address with each component on a new line
  return multiline ? addressParts.join("\n") : addressParts.join(", ");
}

export {
  generatePhoneNumber,
  generateEmergencyPhoneNumber,
  generateFacilityName,
  generateRandomAddress,
};
