import path from "path";
import { fileURLToPath } from "url";

import {
  Preference,
  SpecimenDefinitionCreate,
  SpecimenDefinitionStatus,
} from "@/types/emr/specimenDefinition/specimenDefinition.js";
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
function processCsvData(
  rows: Record<string, string>[],
): SpecimenDefinitionCreate[] {
  return rows.map((row) => {
    const minimumVolume = parseFloat(row.container_minimumvolume || "0");

    // Helper function to create Code object only if all fields are present
    const createCode = (code: string, system: string, display: string) => {
      if (code && system && display) {
        return { code, system, display };
      }
      return undefined;
    };

    // Create type_collected (required field)
    const typeCollected = createCode(
      row.type_collected_code,
      row.type_collected_system,
      row.type_collected_display,
    );
    if (!typeCollected) {
      throw new Error(
        `Missing required type_collected data for row with title: ${row.title}`,
      );
    }

    // Create container cap (optional)
    const containerCap = createCode(
      row.container_cap_code,
      row.container_cap_system,
      row.container_cap_display,
    );

    // Create minimum volume unit (optional)
    const minimumVolumeUnit = createCode(
      row.container_minimumvolume_unit_code,
      row.container_minimumvolume_unit_system,
      row.container_minimumvolume_unit_display,
    );

    // Create retention time unit (optional)
    const retentionTimeUnit = createCode(
      row.retention_time_unit_code,
      row.retention_time_unit_system,
      row.retention_time_unit_display,
    );

    // Build container object (optional)
    const container =
      containerCap || minimumVolumeUnit
        ? {
            ...(containerCap && { cap: containerCap }),
            ...(minimumVolumeUnit &&
              !isNaN(minimumVolume) &&
              minimumVolume > 0 && {
                minimum_volume: {
                  quantity: {
                    value: minimumVolume,
                    unit: minimumVolumeUnit,
                  },
                },
              }),
          }
        : undefined;

    // Build retention time (optional)
    const retentionTime =
      row.retention_time && retentionTimeUnit
        ? {
            value: parseFloat(row.retention_time_value) || 0,
            unit: retentionTimeUnit,
          }
        : undefined;

    // Build type_tested (optional)
    const typeTested = {
      is_derived: false,
      preference: (row.preference as Preference) || Preference.preferred,
      ...(container && { container }),
      ...(row.requirement && { requirement: row.requirement }),
      ...(retentionTime && { retention_time: retentionTime }),
      ...(row.single_use && {
        single_use: row.single_use === "true" || row.single_use === "1",
      }),
    };

    return {
      title: row.title,
      slug: row.slug,
      status:
        (row.status as SpecimenDefinitionStatus) ||
        SpecimenDefinitionStatus.active,
      description: row.description,
      type_collected: typeCollected,
      ...(typeTested && { type_tested: typeTested }),
    };
  });
}

// Function to upsert specimen definition
async function upsertSpecimenDefinition(
  data: SpecimenDefinitionCreate,
): Promise<any> {
  const specimenData = {
    title: data.title,
    slug: data.slug,
    description: data.description,
    status: data.status || SpecimenDefinitionStatus.active,
    type_collected: data.type_collected,
    type_tested: {
      is_derived: false, // Assuming not derived by default
      preference: data.type_tested?.preference || Preference.preferred,
      container: data.type_tested?.container,
      requirement: data.type_tested?.requirement,
      retention_time: data.type_tested?.retention_time,
      single_use: data.type_tested?.single_use,
    },
  };

  return await makeApiCall(
    `/api/v1/facility/${CONFIG.facilityId}/specimen_definition/upsert/`,
    specimenData,
    CONFIG,
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
      processedData,
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

export { loadData, main, processCsvData, upsertSpecimenDefinition };
