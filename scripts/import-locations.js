#!/usr/bin/env node
/**
 * CARE Location Import Script
 *
 * This script imports location data from the Sudheendra location-final Google Sheets
 * into the CARE system via the API.
 *
 * Usage:
 * 1. Export the "location-final" sheet from the Google Sheets as CSV
 * 2. Place the CSV file in the scripts directory
 * 3. Configure the CARE_API_URL and authentication credentials
 * 4. Run: node scripts/import-locations.js <csv-file> <facility-id>
 *
 * Example:
 * node scripts/import-locations.js location-final.csv abc123-def456-789
 */
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);

// Load environment variables
dotenv.config({ path: [".env.local", ".env"] });

// Configuration
const CARE_API_URL =
  process.env.REACT_CARE_API_URL || "https://careapi.ohc.network";
const DEFAULT_CREDENTIALS = {
  username: "administrator_2_0",
  password: "Coronasafe@123",
};

// Location form mapping based on the CARE frontend types
const LOCATION_FORM_MAPPING = {
  site: "si",
  building: "bu",
  wing: "wi",
  ward: "wa",
  level: "lvl",
  floor: "lvl",
  corridor: "co",
  room: "ro",
  bed: "bd",
  vehicle: "ve",
  house: "ho",
  carpark: "ca",
  road: "rd",
  area: "area",
  garden: "jdn",
  virtual: "vi",
};

// Operational status mapping
const OPERATIONAL_STATUS_MAPPING = {
  closed: "C",
  housekeeping: "H",
  open: "O",
  unoccupied: "U",
  contaminated: "K",
  isolated: "I",
};

class CareLocationImporter {
  constructor() {
    this.authToken = null;
    this.facilityId = null;
    this.locationCache = new Map();
  }

  async authenticate(
    username = DEFAULT_CREDENTIALS.username,
    password = DEFAULT_CREDENTIALS.password,
  ) {
    try {
      console.log("🔐 Authenticating with CARE API...");

      const response = await fetch(`${CARE_API_URL}/api/v1/auth/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error(
          `Authentication failed: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();
      this.authToken = data.access_token;
      console.log("✅ Authentication successful");

      return data;
    } catch (error) {
      console.error("❌ Authentication failed:", error.message);
      throw error;
    }
  }

  async makeApiCall(endpoint, method = "GET", body = null) {
    if (!this.authToken) {
      throw new Error("Not authenticated. Call authenticate() first.");
    }

    const headers = {
      Authorization: `Bearer ${this.authToken}`,
      "Content-Type": "application/json",
    };

    const config = {
      method,
      headers,
    };

    if (body && (method === "POST" || method === "PUT")) {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${CARE_API_URL}${endpoint}`, config);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `API call failed: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    return await response.json();
  }

  parseCsvFile(csvPath) {
    console.log(`📄 Reading CSV file: ${csvPath}`);

    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found: ${csvPath}`);
    }

    const csvContent = fs.readFileSync(csvPath, "utf-8");
    const lines = csvContent.split("\n").filter((line) => line.trim());

    if (lines.length < 2) {
      throw new Error(
        "CSV file must have at least a header row and one data row",
      );
    }

    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
    const locations = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""));

      if (values.length !== headers.length) {
        console.warn(`⚠️ Skipping row ${i + 1}: column count mismatch`);
        continue;
      }

      const location = {};
      headers.forEach((header, index) => {
        location[header.toLowerCase().replace(/\s+/g, "_")] = values[index];
      });

      locations.push(location);
    }

    console.log(`📊 Parsed ${locations.length} locations from CSV`);
    return locations;
  }

  mapLocationData(csvLocation) {
    // Map CSV data to CARE location format
    const name = csvLocation.name || csvLocation.location_name || "";
    const description = csvLocation.description || csvLocation.desc || "";
    const type = csvLocation.type || csvLocation.location_type || "room";
    const status = csvLocation.status || "active";
    const operationalStatus = csvLocation.operational_status || "open";
    const parent = csvLocation.parent || csvLocation.parent_location || null;

    // Map to CARE format
    const form = LOCATION_FORM_MAPPING[type.toLowerCase()] || "ro"; // default to room
    const operational_status =
      OPERATIONAL_STATUS_MAPPING[operationalStatus.toLowerCase()] || "O"; // default to open

    return {
      name: name,
      description: description,
      status: status === "inactive" ? "inactive" : "active",
      operational_status: operational_status,
      form: form,
      mode: form === "bd" ? "instance" : "kind", // beds are instances, others are kinds
      availability_status: "available",
      organizations: [],
      parent: parent,
    };
  }

  async createLocation(locationData) {
    try {
      console.log(`🏗️ Creating location: ${locationData.name}`);

      const response = await this.makeApiCall(
        `/api/v1/facility/${this.facilityId}/location/`,
        "POST",
        locationData,
      );

      console.log(
        `✅ Created location: ${locationData.name} (ID: ${response.id})`,
      );
      this.locationCache.set(locationData.name, response.id);

      return response;
    } catch (error) {
      console.error(
        `❌ Failed to create location ${locationData.name}:`,
        error.message,
      );
      throw error;
    }
  }

  async importLocations(csvPath, facilityId) {
    try {
      this.facilityId = facilityId;

      // Parse CSV
      const csvLocations = this.parseCsvFile(csvPath);

      if (csvLocations.length === 0) {
        console.log("⚠️ No locations found in CSV file");
        return;
      }

      console.log(
        `🚀 Starting import of ${csvLocations.length} locations to facility ${facilityId}`,
      );

      // First, get existing locations to avoid duplicates
      console.log("📋 Fetching existing locations...");
      const existingLocations = await this.makeApiCall(
        `/api/v1/facility/${facilityId}/location/`,
      );

      const existingNames = new Set(
        existingLocations.results?.map((loc) => loc.name) || [],
      );
      console.log(`Found ${existingNames.size} existing locations`);

      // Import locations
      let successCount = 0;
      let errorCount = 0;

      for (const csvLocation of csvLocations) {
        try {
          const locationData = this.mapLocationData(csvLocation);

          // Skip if location already exists
          if (existingNames.has(locationData.name)) {
            console.log(`⏭️ Skipping existing location: ${locationData.name}`);
            continue;
          }

          // Handle parent relationship
          if (
            locationData.parent &&
            this.locationCache.has(locationData.parent)
          ) {
            locationData.parent = this.locationCache.get(locationData.parent);
          } else if (locationData.parent) {
            // Look up parent in existing locations
            const parentLocation = existingLocations.results?.find(
              (loc) => loc.name === locationData.parent,
            );
            if (parentLocation) {
              locationData.parent = parentLocation.id;
            } else {
              console.warn(
                `⚠️ Parent location "${locationData.parent}" not found for ${locationData.name}`,
              );
              locationData.parent = null;
            }
          }

          await this.createLocation(locationData);
          successCount++;

          // Add a small delay to avoid overwhelming the API
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          console.error(
            `❌ Error importing location ${csvLocation.name}:`,
            error.message,
          );
          errorCount++;
        }
      }

      console.log("\n📊 Import Summary:");
      console.log(`✅ Successfully imported: ${successCount} locations`);
      console.log(`❌ Failed to import: ${errorCount} locations`);
      console.log(
        `⏭️ Skipped existing: ${csvLocations.length - successCount - errorCount} locations`,
      );
    } catch (error) {
      console.error("💥 Import failed:", error.message);
      throw error;
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log(`
📖 Usage: node ${path.basename(__filename)} <csv-file> <facility-id>

📄 CSV File Format:
The CSV should contain columns like:
- name (required): Location name
- description: Location description
- type: Location type (site, building, ward, room, bed, etc.)
- status: active/inactive
- operational_status: open/closed/housekeeping/etc.
- parent: Parent location name (optional)

🔧 Environment Variables:
- REACT_CARE_API_URL: CARE API URL (default: https://careapi.ohc.network)
- CARE_USERNAME: Username for authentication (default: administrator_2_0)
- CARE_PASSWORD: Password for authentication (default: Coronasafe@123)

📋 Example:
node scripts/import-locations.js location-final.csv abc123-def456-789

💾 To export from Google Sheets:
1. Open the Google Sheets document
2. Select the "location-final (Sudheendra)" sheet
3. File > Download > Comma-separated values (.csv)
4. Save as location-final.csv in the scripts directory

🧪 Test with sample data:
node scripts/import-locations.js scripts/sample-locations.csv <facility-id>
`);
    process.exit(1);
  }

  const csvFile = args[0];
  const facilityId = args[1];
  const username = process.env.CARE_USERNAME || DEFAULT_CREDENTIALS.username;
  const password = process.env.CARE_PASSWORD || DEFAULT_CREDENTIALS.password;

  console.log("🎯 CARE Location Import Tool");
  console.log(`📂 CSV File: ${csvFile}`);
  console.log(`🏥 Facility ID: ${facilityId}`);
  console.log(`🌐 API URL: ${CARE_API_URL}`);
  console.log(`👤 Username: ${username}`);
  console.log("");

  const importer = new CareLocationImporter();

  try {
    await importer.authenticate(username, password);
    await importer.importLocations(csvFile, facilityId);

    console.log("\n🎉 Import completed successfully!");
  } catch (error) {
    console.error("\n💥 Import failed:", error.message);
    process.exit(1);
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
