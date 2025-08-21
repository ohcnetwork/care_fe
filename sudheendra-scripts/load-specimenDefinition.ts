import path from "path";
import { fileURLToPath } from "url";

import {
  type BaseConfig,
  DEFAULT_CONFIG,
  type ProcessedRow,
  colorize,
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = getLogger();

interface SpecimenData {
  title: string;
  slug: string;
  status: string;
  description: string;
  type_collected: {
    code: string;
    system: string;
    display: string;
  };
  preference: string;
  container_cap: {
    code: string;
    system: string;
    display: string;
  };
  container_minimumvolume: number;
}

// Configuration
const CONFIG: BaseConfig = {
  inputFile: path.join(__dirname, "SpecimenDefinition.csv"),
  outputFile: path.join(__dirname, "specimens-output.csv"),
  facilityId: DEFAULT_CONFIG.facilityId,
  apiBaseUrl: DEFAULT_CONFIG.apiBaseUrl,
  parser: DEFAULT_CONFIG.parser,
  sheetName: DEFAULT_CONFIG.sheetName,
  batchSize: DEFAULT_CONFIG.batchSize,
  maxWorkers: DEFAULT_CONFIG.maxWorkers,
};

// Function to process CSV data
function processCsvData(rows: Record<string, string>[]): SpecimenData[] {
  return rows.map((row) => {
    const minimumVolume = parseFloat(row.container_minimumvolume || "0");

    return {
      title: row.title,
      slug: row.slug,
      status: row.status || "active",
      description: row.description,
      type_collected: {
        code: row.type_collected_code || "",
        system: row.type_collected_system || "",
        display: row.type_collected_display || "",
      },
      preference: row.preference || "preferred",
      container_cap: {
        code: row.container_cap_code || "",
        system: row.container_cap_system || "",
        display: row.container_cap_display || "",
      },
      container_minimumvolume: isNaN(minimumVolume) ? 0 : minimumVolume,
    };
  });
}

// Function to upsert specimen definition
async function upsertSpecimenDefinition(data: SpecimenData): Promise<any> {
  const specimenData = {
    title: data.title,
    slug: data.slug,
    description: data.description,
    status: data.status,
    type_collected: data.type_collected,
    preference: data.preference,
    container_cap: data.container_cap,
    container_minimumvolume: data.container_minimumvolume,
  };

  return await makeApiCall(
    `/api/v1/facility/${CONFIG.facilityId}/specimen_definition/upsert/`,
    specimenData,
    CONFIG,
  );
}

// Main function
async function main(configOverride?: Partial<typeof CONFIG>) {
  const finalConfig = mergeConfigWithCli(CONFIG, configOverride);

  try {
    logger(colorize("Starting specimen definition loader...", 0));

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
      Title: item.title,
      Slug: item.slug,
      Status: "Pending",
    }));

    // Upsert specimen definitions via API using batch processing
    logger(colorize("Upserting specimen definitions...", 0));
    const results = await makeBatchApiCall(
      `/api/v1/facility/${finalConfig.facilityId}/specimen_definition/upsert/`,
      processedData.map((item) => ({
        title: item.title,
        slug: item.slug,
        description: item.description,
        status: item.status,
        type_collected: item.type_collected,
        preference: item.preference,
        container_cap: item.container_cap,
        container_minimumvolume: item.container_minimumvolume,
      })),
      finalConfig,
    );

    // Update output data with status
    outputData = outputData.map((row) => {
      const result = results.find((r) => r.item.slug === row.Slug);
      return {
        ...row,
        Status: result?.success ? "Success" : "Failed",
        Errors: result?.error?.errorText || "",
      };
    });

    // Write output CSV
    logger(colorize("Writing output CSV...", 0));
    await writeOutputCsv(outputData, finalConfig.outputFile);

    // Process and return results
    return processApiResults(results, "specimen");
  } catch (error) {
    logger(colorize(`Error in main process: ${error}`, 1));
    throw error;
  }
}

// Run the script
if (require.main === module) {
  const cliArgs = parseCliArgs();

  if (cliArgs.help) {
    showCliHelp("sudheendra-scripts/load-specimenDefinition.ts");
    process.exit(0);
  }

  main();
}

export { main, loadData, processCsvData, upsertSpecimenDefinition };
