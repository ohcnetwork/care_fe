import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import {
  ProductKnowledgeCreate,
  ProductKnowledgeStatus,
  ProductKnowledgeType,
  ProductNameTypes,
} from "@/types/inventory/productKnowledge/productKnowledge";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: [".env.local", ".env"] });

const CONFIG = {
  inputFile: path.join(__dirname, "../product-knowledges.csv"),
  facilityId: "e254fe40-5f4d-4dd4-8e72-a10ff2a96bec", // Replace with actual facility ID
  apiBaseUrl: process.env.REACT_CARE_API_URL, // Replace with actual API URL
};

interface CsvRow {
  itemCategory: string;
  pharmacyCategory: string;
  item: string;
  genericName: string;
  manufacturer: string;
}

// Utility function to create slug from name
function createSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, "") // Keep letters, numbers, spaces, underscores, and hyphens
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .trim();
}

async function loadCsvFile(filePath: string): Promise<CsvRow[]> {
  return new Promise((resolve, reject) => {
    const results: CsvRow[] = [];

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const lines = fileContent.split("\n");

    // Parse header
    const header = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
    const itemCategoryIndex = header.findIndex((h) => h === "ITEM CATEGORY");
    const pharmacyCategoryIndex = header.findIndex(
      (h) => h === "PHARMACY CATEGORY",
    );
    const itemIndex = header.findIndex((h) => h === "ITEM");
    const genericNameIndex = header.findIndex((h) => h === "GENERIC NAME");
    const manufacturerIndex = header.findIndex((h) => h === "MANUFACTURER");

    if (
      itemCategoryIndex === -1 ||
      pharmacyCategoryIndex === -1 ||
      itemIndex === -1 ||
      genericNameIndex === -1 ||
      manufacturerIndex === -1
    ) {
      reject(
        new Error(
          'CSV must contain "ITEM CATEGORY", "PHARMACY CATEGORY", "ITEM", "GENERIC NAME", and "MANUFACTURER" columns',
        ),
      );
      return;
    }

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
      const itemCategory = values[itemCategoryIndex];
      const pharmacyCategory = values[pharmacyCategoryIndex];
      const item = values[itemIndex];
      const genericName = values[genericNameIndex];
      const manufacturer = values[manufacturerIndex];

      if (itemCategory && pharmacyCategory && item) {
        results.push({
          itemCategory: itemCategory,
          pharmacyCategory: pharmacyCategory,
          item: item,
          genericName: genericName,
          manufacturer: manufacturer,
        });
      } else {
        console.warn(`Skipping row ${i} because it is missing required fields`);
      }
    }

    console.log(`Loaded ${results.length} rows from CSV file`);
    resolve(results);
  });
}

// Function to process CSV data
function processCsvData(rows: CsvRow[]): ProductKnowledgeCreate[] {
  return rows.map((row) => {
    const productType =
      row.pharmacyCategory === "MEDICINES"
        ? ProductKnowledgeType.medication
        : ProductKnowledgeType.consumable;

    return {
      name: row.item,
      slug: createSlug(row.item),
      product_type: productType,
      status: ProductKnowledgeStatus.active,
      facility: CONFIG.facilityId,
      names: row.genericName
        ? [
            {
              name: row.genericName,
              name_type: ProductNameTypes.alias,
            },
          ]
        : [],
      storage_guidelines: [],
    };
  });
}

// Function to upsert product knowledge
async function upsertProductKnowledge(datapoints: ProductKnowledgeCreate[]) {
  try {
    const apiUrl = CONFIG.apiBaseUrl;
    const url = `${apiUrl}/api/v1/product_knowledge/upsert/`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${process.env.USERNAME}:${process.env.PASSWORD}`).toString("base64")}`,
      },
      body: JSON.stringify({ datapoints }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(errorText);
      return;
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error(`Failed to upsert product knowledge:`, error);
    throw error;
  }
}

async function main() {
  const csvData = await loadCsvFile(CONFIG.inputFile);
  const datapoints = processCsvData(csvData);
  for (let offset = 0; offset < datapoints.length; offset += 1000) {
    console.log(
      `Upserting chunk ${offset / 1000 + 1} of ${Math.ceil(datapoints.length / 1000)}`,
    );
    const datapointsChunk = datapoints.slice(offset, offset + 1000);
    await upsertProductKnowledge(datapointsChunk);
  }
}

main();
