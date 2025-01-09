interface FacilityTestData {
  name: string;
  type: string;
  description: string;
  address: string;
  pincode: string;
  coordinates: {
    latitude: string;
    longitude: string;
  };
  features: string[];
}

const FACILITY_FEATURES = [
  "CT Scan",
  "Maternity Care",
  "X-Ray",
  "Neonatal Care",
  "Operation Theater",
  "Blood Bank",
  "Emergency Services",
];

// Facility type prefixes
const facilityPrefixes = [
  "GHC", // Government Hospital
  "PHC", // Primary Health Center
  "CHC", // Community Health Center
  "THC", // Taluk Hospital
  "DH", // District Hospital
];

// Special institution prefixes
const specialPrefixes = [
  "Saint Maria",
  "Holy Cross",
  "Little Flower",
  "Mar Sleeva",
  "Saint Thomas",
];

// Ernakulam district locations with real coordinates
const locations = [
  {
    name: "Aluva",
    pincode: "683101",
    coordinates: { latitude: "10.1004", longitude: "76.3570" },
  },
  {
    name: "Angamaly",
    pincode: "683572",
    coordinates: { latitude: "10.1960", longitude: "76.3860" },
  },
  {
    name: "Kalady",
    pincode: "683574",
    coordinates: { latitude: "10.1682", longitude: "76.4410" },
  },
  {
    name: "Perumbavoor",
    pincode: "683542",
    coordinates: { latitude: "10.1071", longitude: "76.4750" },
  },
  {
    name: "Kothamangalam",
    pincode: "686691",
    coordinates: { latitude: "10.0558", longitude: "76.6280" },
  },
  {
    name: "Muvattupuzha",
    pincode: "686661",
    coordinates: { latitude: "9.9894", longitude: "76.5790" },
  },
  {
    name: "Piravom",
    pincode: "686664",
    coordinates: { latitude: "9.8730", longitude: "76.4920" },
  },
  {
    name: "Kolenchery",
    pincode: "682311",
    coordinates: { latitude: "9.9811", longitude: "76.4007" },
  },
  {
    name: "Tripunithura",
    pincode: "682301",
    coordinates: { latitude: "9.9486", longitude: "76.3289" },
  },
  {
    name: "Kakkanad",
    pincode: "682030",
    coordinates: { latitude: "10.0158", longitude: "76.3419" },
  },
  {
    name: "Edappally",
    pincode: "682024",
    coordinates: { latitude: "10.0236", longitude: "76.3097" },
  },
  {
    name: "Kaloor",
    pincode: "682017",
    coordinates: { latitude: "9.9894", longitude: "76.2998" },
  },
  {
    name: "Fort Kochi",
    pincode: "682001",
    coordinates: { latitude: "9.9639", longitude: "76.2432" },
  },
  {
    name: "Mattancherry",
    pincode: "682002",
    coordinates: { latitude: "9.9585", longitude: "76.2574" },
  },
  {
    name: "Vytilla",
    pincode: "682019",
    coordinates: { latitude: "9.9712", longitude: "76.3186" },
  },
  {
    name: "Palarivattom",
    pincode: "682025",
    coordinates: { latitude: "10.0070", longitude: "76.3050" },
  },
  {
    name: "Thevara",
    pincode: "682013",
    coordinates: { latitude: "9.9312", longitude: "76.2891" },
  },
  {
    name: "Thrikkakara",
    pincode: "682021",
    coordinates: { latitude: "10.0316", longitude: "76.3421" },
  },
  {
    name: "Kalamassery",
    pincode: "683104",
    coordinates: { latitude: "10.0558", longitude: "76.3213" },
  },
  {
    name: "Eloor",
    pincode: "683501",
    coordinates: { latitude: "10.0583", longitude: "76.2833" },
  },
];

function generateFacilityName(): string {
  // Use crypto.getRandomValues for secure random selection
  const randomBytes = new Uint8Array(2);
  crypto.getRandomValues(randomBytes);

  const useSpecialPrefix = randomBytes[0] % 5 === 0; // 20% chance
  const locationIndex = randomBytes[1] % locations.length;
  const location = locations[locationIndex];

  if (useSpecialPrefix) {
    const specialPrefixIndex = randomBytes[0] % specialPrefixes.length;
    const specialPrefix = specialPrefixes[specialPrefixIndex];
    return `${specialPrefix} GHC ${location.name}`;
  } else {
    const prefixIndex = randomBytes[0] % facilityPrefixes.length;
    const prefix = facilityPrefixes[prefixIndex];
    return `${prefix} ${location.name}`;
  }
}

export function generateFacilityData(): FacilityTestData {
  const randomBytes = new Uint8Array(2);
  crypto.getRandomValues(randomBytes);

  const locationIndex = randomBytes[0] % locations.length;
  const location = locations[locationIndex];
  const name = generateFacilityName();

  // Generate number of features (2-4)
  const numberOfFeatures = (randomBytes[1] % 3) + 2;

  // Securely shuffle features array
  const shuffledFeatures = [...FACILITY_FEATURES]
    .map((value) => ({
      value,
      sort: crypto.getRandomValues(new Uint8Array(1))[0],
    }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);

  return {
    name,
    type: "General Hospital",
    description: `Healthcare facility serving the ${location.name} region with modern medical facilities and experienced staff`,
    address: `${name} Building, Main Road, ${location.name}`,
    pincode: location.pincode,
    coordinates: location.coordinates,
    features: shuffledFeatures.slice(0, numberOfFeatures),
  };
}
