import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Import other loaders
import { main as loadChargeItems } from "./load-chargeItem.js";
import { main as loadObservations } from "./load-observation_definition.js";
import { main as loadSpecimens } from "./load-specimenDefinition.js";
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

interface Code {
  system: string;
  code: string;
  display: string;
}

interface ActivityData {
  title: string;
  slug: string;
  description: string;
  status: string;
  category: string;
  kind: string;
  observation_slugs: string[];
  specimen_slugs: string[];
  charge_item_slugs: string[];
  diagnostic_report_loinc_codes: Code[];
  code?: Code;
  body_site?: Code;
}

// Helper function to parse code objects
function parseCode(
  system?: string,
  code?: string,
  display?: string,
): Code | null {
  if (!system || !code) return null;
  let cleanCode = code.trim();
  if (cleanCode.includes(".") && cleanCode.endsWith(".0")) {
    cleanCode = cleanCode.slice(0, -2);
  }
  return {
    system: system.trim(),
    code: cleanCode,
    display: display?.trim() || cleanCode,
  };
}

// Function to lookup missing codes using ValueSet API
async function lookupCode(searchTerm: string): Promise<Code | null> {
  try {
    const response = await fetch(
      `${CONFIG.apiBaseUrl}/api/v1/valueset/activity-definition-procedure-code/expand/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(`${process.env.USER_NAME}:${process.env.PASSWORD}`).toString("base64")}`,
        },
        body: JSON.stringify({
          count: 10,
          search: searchTerm,
        }),
      },
    );

    if (!response.ok) {
      logger(
        colorize(
          `Failed to lookup code for "${searchTerm}": ${response.status} ${response.statusText}`,
          1,
        ),
      );
      return null;
    }

    const data = await response.json();

    // Check if we have results
    if (data.expansion?.contains && data.expansion.contains.length > 0) {
      const firstResult = data.expansion.contains[0];
      return {
        system: firstResult.system || "http://snomed.info/sct",
        code: firstResult.code,
        display: firstResult.display,
      };
    }

    return null;
  } catch (error) {
    logger(colorize(`Error looking up code for "${searchTerm}": ${error}`, 1));
    return null;
  }
}

// Configuration
const CONFIG: BaseConfig & { outputDir: string } = {
  inputFile: path.join(__dirname, "ActivityDefinition.csv"),
  outputDir: path.join(__dirname, "output"),
  outputFile: path.join(__dirname, "output", "ActivityDefinitions-output.csv"),
  facilityId: DEFAULT_CONFIG.facilityId,
  apiBaseUrl: DEFAULT_CONFIG.apiBaseUrl,
  parser: DEFAULT_CONFIG.parser,
  sheetName: DEFAULT_CONFIG.sheetName,
  batchSize: DEFAULT_CONFIG.batchSize,
  maxWorkers: DEFAULT_CONFIG.maxWorkers,
};

// Function to process CSV data
async function processCsvData(
  rows: Record<string, string>[],
): Promise<ActivityData[]> {
  const results: ActivityData[] = [];

  for (const row of rows) {
    // Parse code fields
    let code = parseCode(row.code_system, row.code_value, row.code_display);
    const bodySite = parseCode(
      row.body_site_system,
      row.body_site_code,
      row.body_site_display,
    );

    // If code is missing but we have a title, try to lookup the code
    if (!code && row.title) {
      logger(colorize(`Looking up code for activity: ${row.title}`, 2));
      code = await lookupCode(row.title);
      if (code) {
        logger(
          colorize(
            `Found code for "${row.title}": ${code.code} - ${code.display}`,
            0,
          ),
        );
      } else {
        logger(colorize(`No code found for "${row.title}"`, 1));
      }
    }

    // Parse diagnostic report LOINC codes as Code objects
    const diagnosticReportCodes: Code[] = [];
    if (row.diagnostic_report_loinc_codes) {
      const codes = row.diagnostic_report_loinc_codes
        .split(";")
        .map((s: string) => s.trim())
        .filter((s: string) => s);

      for (const codeStr of codes) {
        // Assuming format: "system|code|display" or just "code"
        const parts = codeStr.split("|");
        if (parts.length >= 2) {
          diagnosticReportCodes.push({
            system: parts[0],
            code: parts[1],
            display: parts[2] || parts[1],
          });
        } else {
          // Default to LOINC system if no system specified
          diagnosticReportCodes.push({
            system: "http://loinc.org",
            code: codeStr,
            display: codeStr,
          });
        }
      }
    }

    results.push({
      title: row.title,
      slug: row.slug,
      description: row.description,
      status: row.status || "active",
      category: row.category.toLowerCase() || "laboratory",
      kind: "service_request",
      observation_slugs: row.observation_slugs
        ? row.observation_slugs
            .split(";")
            .map((s: string) => s.trim())
            .filter((s: string) => s)
        : [],
      specimen_slugs: row.specimen_slugs
        ? row.specimen_slugs
            .split(";")
            .map((s: string) => s.trim())
            .filter((s: string) => s)
        : [],
      charge_item_slugs: row.charge_item_slugs
        ? row.charge_item_slugs
            .split(";")
            .map((s: string) => s.trim())
            .filter((s: string) => s)
        : [],
      diagnostic_report_loinc_codes: diagnosticReportCodes,
      code: code || undefined,
      body_site: bodySite || undefined,
    });
  }

  return results;
}

// Function to check if dependencies are available
function checkDependencies(
  activity: ActivityData,
  availableSlugs: {
    observations: string[];
    specimens: string[];
    chargeItems: string[];
  },
): { available: boolean; missing: string[] } {
  const missing: string[] = [];

  // Check observation dependencies
  for (const obsSlug of activity.observation_slugs) {
    if (!availableSlugs.observations.includes(obsSlug)) {
      missing.push(`observation:${obsSlug}`);
    }
  }

  // Check specimen dependencies
  for (const specSlug of activity.specimen_slugs) {
    if (!availableSlugs.specimens.includes(specSlug)) {
      missing.push(`specimen:${specSlug}`);
    }
  }

  // Check charge item dependencies
  for (const chargeSlug of activity.charge_item_slugs) {
    if (!availableSlugs.chargeItems.includes(chargeSlug)) {
      missing.push(`charge_item:${chargeSlug}`);
    }
  }

  return {
    available: missing.length === 0,
    missing,
  };
}

// Function to upsert activity definition
async function upsertActivityDefinition(data: ActivityData): Promise<any> {
  const activityData = {
    title: data.title,
    slug: data.slug,
    description: data.description,
    status: data.status,
    category: data.category,
    kind: data.kind,
    observation_slugs: data.observation_slugs,
    specimen_slugs: data.specimen_slugs,
    charge_item_slugs: data.charge_item_slugs,
    diagnostic_report_loinc_codes: data.diagnostic_report_loinc_codes,
    code: data.code,
    body_site: data.body_site,
  };

  return await makeApiCall(
    `/api/v1/facility/${CONFIG.facilityId}/activity_definition/upsert/`,
    activityData,
    CONFIG,
  );
}

// Main function
async function main(configOverride?: Partial<typeof CONFIG>) {
  const finalConfig = mergeConfigWithCli(CONFIG, configOverride);

  try {
    logger(colorize("Starting activity definition loader...", 0));

    // Step 0: Create output directory if it doesn't exist
    const outputDir = finalConfig.outputDir;
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Step 1: Load dependencies first
    logger(colorize("\n=== Loading Dependencies ===", 0));

    // Load charge items
    logger(colorize("Loading charge items...", 2));
    const chargeItemResults = await loadChargeItems({
      inputFile: path.join(__dirname, "ChargeItemDefinition.csv"),
      outputFile: path.join(finalConfig.outputDir, "ChargeItems-output.csv"),
      facilityId: finalConfig.facilityId,
      apiBaseUrl: finalConfig.apiBaseUrl,
    });

    // Load specimens
    logger(colorize("Loading specimens...", 2));
    const specimenResults = await loadSpecimens({
      inputFile: path.join(__dirname, "SpecimenDefinition.csv"),
      outputFile: path.join(finalConfig.outputDir, "Specimens-output.csv"),
      facilityId: finalConfig.facilityId,
      apiBaseUrl: finalConfig.apiBaseUrl,
    });

    // Load observations
    logger(colorize("Loading observations...", 2));
    const observationResults = await loadObservations({
      inputFile: path.join(__dirname, "ObservationDefinition.csv"),
      outputFile: path.join(finalConfig.outputDir, "Observations-output.csv"),
      facilityId: finalConfig.facilityId,
      apiBaseUrl: finalConfig.apiBaseUrl,
    });

    // Step 2: Check if input file exists
    if (!fs.existsSync(finalConfig.inputFile)) {
      throw new Error(`Input file not found: ${finalConfig.inputFile}`);
    }

    // Step 3: Load activity definitions
    logger(colorize("\n=== Loading Activity Definitions ===", 0));
    logger(colorize("Loading data...", 0));
    const csvRows = await loadData(finalConfig);

    if (csvRows.length === 0) {
      throw new Error("No valid rows found in CSV file");
    }

    // Process data
    logger(colorize("Processing data...", 0));
    let processedData = await processCsvData(csvRows);

    // Remove duplicates
    processedData = removeDuplicates(processedData);

    // Create output data for CSV
    let outputData: ProcessedRow[] = processedData.map((item) => ({
      Title: item.title,
      Slug: item.slug,
      Status: "Pending",
    }));

    // Step 4: Check dependencies and prepare for batch processing
    logger(colorize("Checking dependencies and preparing for upsert...", 0));
    const validActivities: ActivityData[] = [];
    const invalidActivities: { item: ActivityData; error: string }[] = [];

    const availableSlugs = {
      observations: observationResults.successful,
      specimens: specimenResults.successful,
      chargeItems: chargeItemResults.successful,
    };

    for (const item of processedData) {
      // Check dependencies
      const dependencyCheck = checkDependencies(item, availableSlugs);

      if (!dependencyCheck.available) {
        invalidActivities.push({
          item,
          error: `Missing dependencies: ${dependencyCheck.missing.join(", ")}`,
        });
      } else {
        validActivities.push(item);
      }
    }

    // Step 5: Upsert activities using batch processing
    logger(colorize("Upserting activity definitions...", 0));
    const results = await makeBatchApiCall(
      `/api/v1/facility/${finalConfig.facilityId}/activity_definition/upsert/`,
      validActivities.map((item) => ({
        title: item.title,
        slug: item.slug,
        description: item.description,
        status: item.status,
        category: item.category,
        kind: item.kind,
        observation_slugs: item.observation_slugs,
        specimen_slugs: item.specimen_slugs,
        charge_item_slugs: item.charge_item_slugs,
        diagnostic_report_loinc_codes: item.diagnostic_report_loinc_codes,
        code: item.code,
        body_site: item.body_site,
      })),
      finalConfig,
    );

    // Combine results from invalid activities and batch processing
    const allResults = [
      ...invalidActivities.map(({ item, error }) => ({
        success: false,
        error: { message: error },
        item,
      })),
      ...results,
    ];

    // Update output data with status
    outputData = outputData.map((row) => {
      const result = allResults.find((r) => r.item.slug === row.Slug);
      return {
        ...row,
        Status: result?.success ? "Success" : "Failed",
        Errors: result?.error?.message || result?.error?.errorText || "",
      };
    });

    // Write output CSV
    logger(colorize("Writing output CSV...", 0));
    await writeOutputCsv(outputData, finalConfig.outputFile);

    // Process and return results
    return processApiResults(allResults, "activity");
  } catch (error) {
    logger(colorize(`Error in main process: ${error}`, 1));
    throw error;
  }
}

// Run the script
if (require.main === module) {
  const cliArgs = parseCliArgs();

  if (cliArgs.help) {
    showCliHelp("sudheendra-scripts/load-ActivityDefinition.ts");
    process.exit(0);
  }

  main();
}

export { main, loadData, processCsvData, upsertActivityDefinition };
