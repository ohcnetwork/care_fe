import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config({ path: [".env.local", ".env"] });

import {
  type BaseConfig,
  DEFAULT_CONFIG,
  type ProcessedRow,
  colorize,
  createSlug,
  getLogger,
  loadData,
  makeApiCall,
  makeBatchApiCall,
  mergeConfigWithCli,
  parseCliArgs,
  processApiResults,
  removeDuplicates,
  showCliHelp,
  writeOutputCsv,
} from "./utils.js";

import { MonetaryComponentType } from "@/types/base/monetaryComponent/monetaryComponent";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = getLogger();

interface ChargeItemData {
  title: string;
  basePrice: number;
  slug: string;
  taxRate?: string;
}

// Configuration
const CONFIG: BaseConfig = {
  inputFile: path.join(__dirname, "services.csv"),
  outputFile: path.join(__dirname, "services-output.csv"),
  facilityId: DEFAULT_CONFIG.facilityId,
  apiBaseUrl: DEFAULT_CONFIG.apiBaseUrl,
  parser: DEFAULT_CONFIG.parser,
  sheetName: DEFAULT_CONFIG.sheetName,
  batchSize: DEFAULT_CONFIG.batchSize,
  maxWorkers: DEFAULT_CONFIG.maxWorkers,
};

// Tax component helper function
const taxComponent = (factor: number, code: "cgst" | "sgst") => {
  return {
    monetary_component_type: MonetaryComponentType.tax,
    code: {
      system: "http://ohc.network/codes/monetary/tax",
      code,
      display: code.toUpperCase(),
    },
    factor,
  };
};

// Tax components mapping
const TAX_COMPONENTS = {
  "5": [taxComponent(2.5, "cgst"), taxComponent(2.5, "sgst")],
  "12": [taxComponent(6, "cgst"), taxComponent(6, "sgst")],
  "18": [taxComponent(9, "cgst"), taxComponent(9, "sgst")],
};

// Function to get tax components based on tax rate
function getTaxComponents(taxRate?: string) {
  if (taxRate && taxRate in TAX_COMPONENTS) {
    return TAX_COMPONENTS[taxRate as keyof typeof TAX_COMPONENTS];
  }
  if (taxRate) {
    logger(`Unknown tax rate: ${taxRate}`);
  }
  return [];
}

// Function to process CSV data
function processCsvData(rows: Record<string, string>[]): ChargeItemData[] {
  return rows.map((row) => {
    const basePrice = parseFloat(row["Base Price"].replace(/[^\d.-]/g, ""));
    const slug = createSlug(row.Service);
    const taxRate = row["Tax Rate"] || row["RATE"] || row["Tax"] || undefined;

    return {
      title: row.Service,
      basePrice: isNaN(basePrice) ? 0 : basePrice,
      slug: slug,
      taxRate: taxRate,
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
        monetary_component_type: MonetaryComponentType.base,
        amount: data.basePrice.toString(),
      },
      ...getTaxComponents(data.taxRate),
    ],
  };

  return await makeApiCall(
    `/api/v1/facility/${CONFIG.facilityId}/charge_item_definition/upsert/`,
    chargeItemData,
    CONFIG,
  );
}

function normalizeTitle(title: string) {
  // Clean up the title first
  let cleaned = title
    // Remove extra spaces
    .replace(/\s+/g, " ")
    // Fix spacing around punctuation
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s*\(\s*/g, " (")
    .replace(/\s*\)\s*/g, ") ")
    .replace(/\s*,\s*/g, ", ")
    .replace(/\s*\.\s*/g, ". ")
    .replace(/\s*-\s*/g, "-")
    .replace(/\s*\+\s*/g, "+")
    // Trim extra spaces
    .trim();

  // Split by spaces and normalize each word
  const words = cleaned.split(/\s+/);

  return (
    words
      .map((word) => {
        // Handle special cases for common abbreviations/acronyms
        const upperWord = word.toUpperCase();
        if (
          [
            "X",
            "RAY",
            "AP",
            "LAT",
            "CT",
            "MRI",
            "ECG",
            "EKG",
            "IV",
            "OP",
            "IP",
            "ICU",
            "OPD",
            "IPD",
          ].includes(upperWord)
        ) {
          return upperWord;
        }

        // Handle words with punctuation (like parentheses)
        if (
          word.includes("(") ||
          word.includes(")") ||
          word.includes("/") ||
          word.includes(",")
        ) {
          // Split by punctuation, capitalize each part, then rejoin
          return word.replace(/([a-zA-Z]+)/g, (match) => {
            const upperMatch = match.toUpperCase();
            if (
              [
                "X",
                "RAY",
                "AP",
                "LAT",
                "CT",
                "MRI",
                "ECG",
                "EKG",
                "IV",
                "OP",
                "IP",
                "ICU",
                "OPD",
                "IPD",
              ].includes(upperMatch)
            ) {
              return upperMatch;
            }
            return match.charAt(0).toUpperCase() + match.slice(1).toLowerCase();
          });
        }

        // Regular word capitalization
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(" ")
      // Final cleanup - remove double spaces that might have been introduced
      .replace(/\s+/g, " ")
      .trim()
  );
}

// Main function
async function main(configOverride?: Partial<typeof CONFIG>) {
  // If configOverride is provided, don't merge CLI args (called programmatically)
  // Otherwise, merge CLI args (called from command line)
  const finalConfig = configOverride
    ? { ...CONFIG, ...configOverride }
    : mergeConfigWithCli(CONFIG, configOverride);

  try {
    logger(colorize("Starting charge item definition loader...", 0));

    // Load CSV data
    logger(colorize("Loading data...", 0));
    const csvRows = await loadData(finalConfig);

    if (csvRows.length === 0) {
      throw new Error("No valid rows found in CSV file");
    }

    // Process data
    logger(colorize("Processing data...", 0));
    let processedData = processCsvData(csvRows);

    // Remove duplicates
    processedData = removeDuplicates(processedData);

    // Create output data for CSV
    let outputData: ProcessedRow[] = processedData.map((item) => ({
      Service: normalizeTitle(item.title),
      "Base Price": item.basePrice.toString(),
      "Tax Rate": item.taxRate || "N/A",
      Slug: item.slug,
      Status: "Pending",
    }));

    // Upsert charge item definitions via API using batch processing
    logger(colorize("Upserting charge item definitions...", 0));
    const results = await makeBatchApiCall(
      `/api/v1/facility/${finalConfig.facilityId}/charge_item_definition/upsert/`,
      processedData.map((item) => {
        const normalizedTitle = normalizeTitle(item.title);
        return {
          title: normalizedTitle,
          slug: item.slug,
          status: "active",
          description: normalizedTitle,
          price_components: [
            {
              monetary_component_type: MonetaryComponentType.base,
              amount: item.basePrice.toString(),
            },
            ...getTaxComponents(item.taxRate),
          ],
        };
      }),
      finalConfig,
    );

    // Update output data with status
    outputData = outputData.map((row) => {
      const result = results.find((r) => r.item.slug === row.Slug);
      return {
        ...row,
        Status: result?.success ? "Success" : "Failed",
        "Error Message": result?.success
          ? ""
          : result?.error || "Unknown error",
      };
    });

    // Write output CSV
    logger(colorize("Writing output CSV...", 0));
    await writeOutputCsv(outputData, finalConfig.outputFile);

    // Process and return results
    return processApiResults(results, "charge item");
  } catch (error) {
    logger(colorize(`Error in main process: ${error}`, 1));
    throw error;
  }
}

// Run the script
if (require.main === module) {
  const cliArgs = parseCliArgs();

  if (cliArgs.help) {
    showCliHelp("sudheendra-scripts/load-chargeItem.ts");
    process.exit(0);
  }

  main();
}

export { loadData, main, processCsvData, upsertChargeItemDefinition };
