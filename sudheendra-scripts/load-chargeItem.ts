import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import {
  ApiResult,
  type BaseConfig,
  LoaderResult,
  type ProcessedRow,
  colorize,
  createScriptConfig,
  ensureAuthentication,
  ensureChargeItemCategories,
  generateHashSlug,
  getLogger,
  loadData,
  makeBatchApiCall,
  mapResultsToOutput,
  mergeConfigWithCli,
  normalizeTitle,
  parseCliArgs,
  processApiResults,
  removeDuplicates,
  showCliHelp,
  writeOutputCsv,
} from "./utils.js";

import { MonetaryComponentType } from "@/types/base/monetaryComponent/monetaryComponent";
import {
  ChargeItemDefinitionCreate,
  ChargeItemDefinitionStatus,
} from "@/types/billing/chargeItemDefinition/chargeItemDefinition";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const __rootDir = path.join(__dirname, "..");

dotenv.config({
  path: [path.join(__rootDir, ".env.local"), path.join(__rootDir, ".env")],
});

const logger = getLogger();

interface ChargeItemData {
  title: string;
  basePrice: number;
  slug_value: string;
  taxRate?: string;
  category: string;
  description?: string;
  status: ChargeItemDefinitionStatus;
}

// Script-specific configuration defaults
const SCRIPT_DEFAULTS = {
  inputFile: path.join(__dirname, "services.csv"),
  outputFile: path.join(__dirname, "services-output.csv"),
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
    return TAX_COMPONENTS[taxRate as keyof typeof TAX_COMPONENTS].map(
      (component) => ({
        ...component,
        conditions: [],
      }),
    );
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
    const taxRate = row["Tax Rate"] || row["RATE"] || row["Tax"] || undefined;
    const title = row["Service"] || row["title"];
    const slug_value = generateHashSlug(normalizeTitle(title || ""));

    return {
      title: title,
      basePrice: isNaN(basePrice) ? 0 : basePrice,
      slug_value: slug_value,
      taxRate: taxRate,
      category: row.category || "service",
      description: row.description || `Service: ${title}`,
      status:
        (row.status as ChargeItemDefinitionStatus) ||
        ChargeItemDefinitionStatus.active,
    };
  });
}

async function mockInsert(config: BaseConfig): Promise<LoaderResult> {
  logger(colorize("Loading data...", 0));
  const csvRows = await loadData(config);

  if (csvRows.length === 0) {
    throw new Error("No valid rows found in CSV file");
  }

  let processedData = processCsvData(csvRows);

  // Remove duplicates
  processedData = removeDuplicates(processedData);

  return {
    successful: processedData as unknown as ApiResult<ChargeItemData>[],
    failed: [],
    results: processedData.map((item) => ({
      success: true,
      item: item,
    })),
  };
}

async function main(configOverride?: Partial<BaseConfig>) {
  // If configOverride is provided, don't merge CLI args (called programmatically)
  // Otherwise, merge CLI args (called from command line)
  let finalConfig = configOverride
    ? createScriptConfig(
        SCRIPT_DEFAULTS.inputFile,
        SCRIPT_DEFAULTS.outputFile,
        configOverride,
      )
    : mergeConfigWithCli(
        createScriptConfig(
          SCRIPT_DEFAULTS.inputFile,
          SCRIPT_DEFAULTS.outputFile,
        ),
      );

  if (finalConfig.skipInsert) {
    return mockInsert(finalConfig);
  }

  try {
    logger(colorize("Starting charge item definition loader...", 0));

    // Ensure authentication tokens are available if token auth is enabled
    const authenticatedConfig = await ensureAuthentication(finalConfig);
    finalConfig = { ...finalConfig, ...authenticatedConfig };

    // Load CSV data
    logger(colorize("Loading data...", 0));
    const csvRows = await loadData(finalConfig);

    if (csvRows.length === 0) {
      throw new Error("No valid rows found in CSV file");
    }

    // Ensure categories exist
    const categoriesList = csvRows.map((item) => item.category);
    logger(colorize("Ensuring categories exist...", 0));
    const { successful, failed, categoryData } =
      await ensureChargeItemCategories(categoriesList, finalConfig);
    if (failed.length > 0) {
      logger(colorize("Failed to create categories:", 1));
      failed.forEach((category) => {
        logger(colorize(`- ${category}`, 1));
      });
      throw new Error("Failed to create categories");
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
      Slug_value: item.slug_value,
      Status: "Pending",
    }));

    // Upsert charge item definitions via API using batch processing
    logger(colorize("Upserting charge item definitions...", 0));
    const results = await makeBatchApiCall(
      `/api/v1/facility/${finalConfig.facilityId}/charge_item_definition/upsert/`,
      processedData.map((item): ChargeItemDefinitionCreate => {
        const normalizedTitle = normalizeTitle(item.title);
        return {
          title: normalizedTitle,
          slug_value: item.slug_value,
          status: item.status,
          description: item.description,
          category: `f-${finalConfig.facilityId}-${generateHashSlug(normalizeTitle(`cid_${item.category}`))}`,
          price_components: [
            {
              monetary_component_type: MonetaryComponentType.base,
              amount: item.basePrice.toString(),
              conditions: [],
            },
            ...getTaxComponents(item.taxRate),
          ],
        };
      }),
      finalConfig,
    );

    // Update output data with status
    outputData = mapResultsToOutput(outputData, results);

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

export { main, processCsvData };
