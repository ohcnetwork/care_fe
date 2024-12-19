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
    () => window.crypto.getRandomValues(new Uint32Array(1))[0] % 100, // Numeric IDs
    () => `Zone-${window.crypto.getRandomValues(new Uint32Array(1))[0] % 10}`, // Zone IDs
    () =>
      `Block-${String.fromCharCode(65 + (window.crypto.getRandomValues(new Uint32Array(1))[0] % 26))}`, // Alphabetic Blocks
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

  const randomPrefix =
    prefixes[
      window.crypto.getRandomValues(new Uint32Array(1))[0] % prefixes.length
    ];
  const randomLocation =
    locations[
      window.crypto.getRandomValues(new Uint32Array(1))[0] % locations.length
    ];
  const randomIdentifier =
    identifiers[
      window.crypto.getRandomValues(new Uint32Array(1))[0] % identifiers.length
    ]();
  const randomSuffix =
    suffixes[
      window.crypto.getRandomValues(new Uint32Array(1))[0] % suffixes.length
    ];

  // Randomize the format of the name
  const formats = [
    `${randomPrefix} ${randomLocation}-${randomIdentifier} ${randomSuffix}`,
    `${randomLocation} ${randomPrefix} ${randomSuffix}`,
    `${randomPrefix} ${randomLocation} ${randomSuffix}`,
  ];

  return formats[
    window.crypto.getRandomValues(new Uint32Array(1))[0] % formats.length
  ];
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
  const pincode =
    682000 + (window.crypto.getRandomValues(new Uint32Array(1))[0] % 1000); // Generate random pincodes in the 682XXX range.

  const randomLocality =
    localities[
      window.crypto.getRandomValues(new Uint32Array(1))[0] % localities.length
    ];
  const randomNeighborhood =
    neighborhoods[
      window.crypto.getRandomValues(new Uint32Array(1))[0] %
        neighborhoods.length
    ];
  const randomDistrict =
    districts[
      window.crypto.getRandomValues(new Uint32Array(1))[0] % districts.length
    ];
  const randomState =
    states[
      window.crypto.getRandomValues(new Uint32Array(1))[0] % states.length
    ];

  // Create address components
  const addressParts = [
    randomNeighborhood,
    randomLocality,
    randomDistrict,
    randomState,
    `Pincode: ${pincode}`,
  ];

  // Return address as single line or multiline
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

  const randomFirstName =
    firstNames[
      window.crypto.getRandomValues(new Uint32Array(1))[0] % firstNames.length
    ];
  const randomLastName =
    lastNames[
      window.crypto.getRandomValues(new Uint32Array(1))[0] % lastNames.length
    ];

  // Return the full name
  return `${randomFirstName} ${randomLastName}`;
}

export {
  generatePhoneNumber,
  generateEmergencyPhoneNumber,
  generateFacilityName,
  generateRandomAddress,
  generatePatientName,
};
