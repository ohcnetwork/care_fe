import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables
dotenv.config({ path: [".env.local", ".env"] });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CsvRow {
  Service: string;
  "Base Price": string;
  [key: string]: string; // Allow other columns
}

interface ProcessedRow {
  Service: string;
  "Base Price": string;
  Slug: string;
  Status: string;
}

interface ChargeItemData {
  title: string;
  basePrice: number;
  slug: string;
}

// Configuration
const CONFIG = {
  inputFile: path.join(__dirname, "services.csv"),
  outputFile: path.join(__dirname, "services-output.csv"),
  facilityId: "f3aab8c6-9cc4-41bc-84e9-cdba0ff5ca86", // Replace with actual facility ID
  apiBaseUrl: "http://localhost:8000", // Replace with actual API URL
};

// Utility function to create slug from service name
function createSlug(serviceName: string): string {
  return serviceName
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, "") // Keep letters, numbers, spaces, underscores, and hyphens
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .trim();
}

// Function to read and parse CSV file
async function loadCsvFile(filePath: string): Promise<CsvRow[]> {
  return new Promise((resolve, reject) => {
    const results: CsvRow[] = [];

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const lines = fileContent.split("\n");

    // Parse header
    const header = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
    const serviceIndex = header.findIndex((h) => h === "Service");
    const priceIndex = header.findIndex((h) => h === "Base Price");

    if (serviceIndex === -1 || priceIndex === -1) {
      reject(new Error('CSV must contain "Service" and "Base Price" columns'));
      return;
    }

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
      const service = values[serviceIndex];
      const basePrice = values[priceIndex];

      if (service && basePrice) {
        results.push({
          Service: service,
          "Base Price": basePrice,
        });
      }
    }

    console.log(`Loaded ${results.length} rows from CSV file`);
    resolve(results);
  });
}

// Function to process CSV data
function processCsvData(rows: CsvRow[]): ChargeItemData[] {
  return rows.map((row) => {
    const basePrice = parseFloat(row["Base Price"].replace(/[^\d.-]/g, ""));
    const slug = createSlug(row.Service);

    return {
      title: row.Service,
      basePrice: isNaN(basePrice) ? 0 : basePrice,
      slug: slug,
    };
  });
}

// Function to upsert charge item definition
async function upsertChargeItemDefinition(data: ChargeItemData): Promise<any> {
  const chargeItemData = {
    title: data.title,
    slug: data.slug,
    status: "active",
    description: `Service: ${data.title}`,
    price_components: [
      {
        monetary_component_type: "base",
        amount: data.basePrice.toString(),
      },
    ],
  };

  try {
    const apiUrl = CONFIG.apiBaseUrl || process.env.REACT_CARE_API_URL;
    const url = `${apiUrl}/api/v1/facility/${CONFIG.facilityId}/charge_item_definition/upsert/`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${process.env.USER_NAME}:${process.env.PASSWORD}`).toString("base64")}`,
      },
      body: JSON.stringify({ datapoints: [chargeItemData] }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HTTP ${response.status}: ${response.statusText} - ${errorText}`,
      );
    }

    const result = await response.json();
    console.log(`Upserted charge item: ${data.title} (${data.slug})`);
    return result;
  } catch (error) {
    console.error(`Failed to upsert charge item for ${data.title}:`, error);
    throw error;
  }
}

// Function to write processed data to output CSV
async function writeOutputCsv(data: ProcessedRow[]): Promise<void> {
  const csvContent = [
    "Service,Base Price,Slug,Status",
    ...data.map(
      (row) =>
        `"${row.Service}","${row["Base Price"]}","${row.Slug}","${row.Status}"`,
    ),
  ].join("\n");

  fs.writeFileSync(CONFIG.outputFile, csvContent, "utf-8");
  console.log(`Output written to ${CONFIG.outputFile}`);
}

// Main function
async function main() {
  try {
    console.log("Starting charge item definition loader...");

    // Check if input file exists
    if (!fs.existsSync(CONFIG.inputFile)) {
      throw new Error(`Input file not found: ${CONFIG.inputFile}`);
    }

    // Load CSV data
    console.log("Loading CSV file...");
    const csvRows = await loadCsvFile(CONFIG.inputFile);

    if (csvRows.length === 0) {
      throw new Error("No valid rows found in CSV file");
    }

    // Process data
    console.log("Processing data...");
    let processedData = processCsvData(csvRows);

    // Remove duplicates
    processedData = processedData.filter(
      (item, index, self) =>
        index === self.findIndex((t) => t.slug === item.slug),
    );

    // Create output data for CSV
    let outputData: ProcessedRow[] = processedData.map((item) => ({
      Service: item.title,
      "Base Price": item.basePrice.toString(),
      Slug: item.slug,
      Status: "Pending",
    }));

    // Remove duplicate data (based on slug)
    outputData = outputData.filter(
      (item, index, self) =>
        index === self.findIndex((t) => t.Slug === item.Slug),
    );

    // Upsert charge item definitions via API
    console.log("Upserting charge item definitions...");
    const results: Array<{
      success: boolean;
      data?: any;
      error?: any;
      item: ChargeItemData;
    }> = [];

    for (const item of processedData) {
      try {
        const result = await upsertChargeItemDefinition(item);
        results.push({ success: true, data: result, item });
      } catch (error) {
        results.push({ success: false, error, item });
      }
    }

    // Update output data with status
    outputData = outputData.map((row) => {
      const result = results.find((r) => r.item.slug === row.Slug);
      return {
        ...row,
        Status: result?.success ? "Success" : "Failed",
      };
    });

    // Write output CSV
    console.log("Writing output CSV...");
    await writeOutputCsv(outputData);

    // Summary
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log("\n=== Summary ===");
    console.log(`Total items processed: ${processedData.length}`);
    console.log(`Successfully created: ${successful}`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) {
      console.log("\nFailed items:");
      results
        .filter((r) => !r.success)
        .forEach((r) => {
          console.log(`- ${r.item.title}: ${r.error}`);
        });
    }
  } catch (error) {
    console.error("Error in main process:", error);
  }
}

main();
