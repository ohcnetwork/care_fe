import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
dotenv.config({ path: [".env.local", ".env"] });

// Import other loaders
import { main as loadChargeItems } from "./load-chargeItem.js";
import { main as loadObservations } from "./load-observation_definition.js";
import { main as loadSpecimens } from "./load-specimenDefinition.js";
import {
  type BaseConfig,
  type ProcessedRow,
  colorize,
  createScriptConfig,
  createSlug,
  ensureActivityDefinitionCategories,
  ensureAuthentication,
  getAuthHeaders,
  getLogger,
  loadData,
  makeApiCall,
  makeBatchApiCall,
  mergeConfigWithCli,
  parseCliArgs,
  parseCode,
  processApiResults,
  removeDuplicates,
  showCliHelp,
  writeOutputCsv,
} from "./utils.js";

import { Code } from "@/types/base/code/code";
import {
  ActivityDefinitionCreateSpec,
  Classification,
  Kind,
  Status,
} from "@/types/emr/activityDefinition/activityDefinition";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = getLogger();

interface ActivityData {
  title: string;
  slug_value: string;
  description: string;
  usage: string;
  status: Status;
  classification: Classification;
  kind: Kind;
  category: string; // Category slug for creation
  observation_slugs: string[];
  specimen_slugs: string[];
  charge_item_slugs: string[];
  diagnostic_report_loinc_codes: Code[];
  code?: Code;
  body_site?: Code;
  derived_from_uri?: string;
  locations?: string[];
}

// Function to lookup missing codes using ValueSet API
async function lookupCode(
  searchTerm: string,
  config: BaseConfig,
): Promise<Code | null> {
  try {
    const response = await fetch(
      `${config.apiBaseUrl}/api/v1/valueset/activity-definition-procedure-code/expand/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(config),
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

// Script-specific configuration defaults
const SCRIPT_DEFAULTS = {
  inputFile: path.join(__dirname, "ActivityDefinition.csv"),
  outputFile: path.join(__dirname, "output", "ActivityDefinitions-output.csv"),
  outputDir: path.join(__dirname, "output"),
};

// Function to process CSV data
async function processCsvData(
  rows: Record<string, string>[],
  config: BaseConfig,
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
      //skip row
      /* logger(colorize(`Looking up code for activity: ${row.title}`, 2));
      code = await lookupCode(row.title, config);
      if (code) {
        logger(
          colorize(
            `Found code for "${row.title}": ${code.code} - ${code.display}`,
            0,
          ),
        );
      } else {
        logger(colorize(`No code found for "${row.title}"`, 1));
      } */
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
          const code = parseCode("http://loinc.org", codeStr, codeStr);
          if (code) {
            diagnosticReportCodes.push({
              system: code.system,
              code: code.code,
              display: code.display,
            });
          }
        }
      }
    }
    // filter out rows with no code
    rows = rows.filter((r) => r.code);

    results.push({
      title: row.title,
      slug_value: createSlug(row.title),
      description: row.description,
      usage: row.usage || "",
      status: (row.status as Status) || Status.active,
      classification:
        (row.classification as Classification) || Classification.laboratory,
      kind: Kind.service_request,
      category: createSlug(row.category || "laboratory"),
      observation_slugs: row.observation_slugs
        ? row.observation_slugs
            .split(";")
            .map((s: string) => s.trim())
            .filter((s: string) => s)
            .map((s: string) => createSlug(s))
        : [],
      specimen_slugs: row.specimen_slugs
        ? row.specimen_slugs
            .split(";")
            .map((s: string) => s.trim())
            .filter((s: string) => s)
            .map((s: string) => createSlug(s))
        : [],
      charge_item_slugs: row.charge_item_slugs
        ? row.charge_item_slugs
            .split(";")
            .map((s: string) => s.trim())
            .filter((s: string) => s)
            .map((s: string) => createSlug(s))
        : [],
      diagnostic_report_loinc_codes: diagnosticReportCodes,
      code: code || undefined,
      body_site: bodySite || undefined,
      derived_from_uri: row.derived_from_uri || undefined,
      locations: row.locations
        ? row.locations
            .split(";")
            .map((s: string) => s.trim())
            .filter((s: string) => s)
        : [],
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
async function upsertActivityDefinition(
  data: ActivityData,
  config: BaseConfig,
): Promise<any> {
  const activityData: ActivityDefinitionCreateSpec = {
    title: data.title,
    slug_value: data.slug_value,
    description: data.description,
    usage: data.usage,
    status: data.status,
    classification: data.classification,
    kind: data.kind,
    facility: config.facilityId,
    category: data.category,
    specimen_requirements: data.specimen_slugs,
    charge_item_definitions: data.charge_item_slugs,
    observation_result_requirements: data.observation_slugs,
    locations: data.locations || [],
    diagnostic_report_codes: data.diagnostic_report_loinc_codes,
    code: data.code!,
    body_site: data.body_site || null,
    derived_from_uri: data.derived_from_uri || null,
    healthcare_service: null,
  };

  return await makeApiCall(
    `/api/v1/facility/${config.facilityId}/activity_definition/upsert/`,
    activityData,
    config,
  );
}

// Main function
async function main(configOverride?: Partial<BaseConfig>) {
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

  try {
    logger(colorize("Starting activity definition loader...", 0));

    // Ensure authentication tokens are available if token auth is enabled
    const authenticatedConfig = await ensureAuthentication(finalConfig);
    finalConfig = { ...finalConfig, ...authenticatedConfig };

    // Step 0: Create output directory if it doesn't exist
    const outputDir = SCRIPT_DEFAULTS.outputDir;
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Step 1: Load dependencies first
    logger(colorize("\n=== Loading Dependencies ===", 0));

    // Load charge items
    logger(colorize("Loading charge items...", 2));
    const chargeItemResults = await loadChargeItems({
      ...authenticatedConfig,
      inputFile: path.join(__dirname, "ChargeItemDefinition.csv"),
      outputFile: path.join(outputDir, "ChargeItems-output.csv"),
      facilityId: finalConfig.facilityId,
      apiBaseUrl: finalConfig.apiBaseUrl,
      parser: finalConfig.parser,
      googleSheetId: finalConfig.googleSheetId,
      sheetName: finalConfig.sheetName,
    });

    // Load specimens
    logger(colorize("Loading specimens...", 2));
    const specimenResults = await loadSpecimens({
      ...authenticatedConfig,
      inputFile: path.join(__dirname, "SpecimenDefinition.csv"),
      outputFile: path.join(outputDir, "Specimens-output.csv"),
      facilityId: finalConfig.facilityId,
      apiBaseUrl: finalConfig.apiBaseUrl,
      parser: finalConfig.parser,
      googleSheetId: finalConfig.googleSheetId,
      sheetName: finalConfig.sheetName,
    });

    // Load observations
    logger(colorize("Loading observations...", 2));
    const observationResults = await loadObservations({
      ...authenticatedConfig,
      inputFile: path.join(__dirname, "ObservationDefinition.csv"),
      outputFile: path.join(outputDir, "Observations-output.csv"),
      facilityId: finalConfig.facilityId,
      apiBaseUrl: finalConfig.apiBaseUrl,
      parser: finalConfig.parser,
      googleSheetId: finalConfig.googleSheetId,
      sheetName: finalConfig.sheetName,
    });

    // Step 2: Check if input file exists (only for local parser)
    if (
      finalConfig.parser === "local" &&
      !fs.existsSync(finalConfig.inputFile)
    ) {
      throw new Error(`Input file not found: ${finalConfig.inputFile}`);
    }

    // Step 3: Load activity definitions
    logger(colorize("\n=== Loading Activity Definitions ===", 0));
    logger(colorize("Loading data...", 0));
    const csvRows = await loadData(finalConfig);

    if (csvRows.length === 0) {
      throw new Error("No valid rows found in CSV file");
    }

    // Step 4: Ensure categories exist
    logger(colorize("Ensuring categories exist...", 0));
    await ensureActivityDefinitionCategories(csvRows, finalConfig);

    // Process data
    logger(colorize("Processing data...", 0));
    let processedData = await processCsvData(csvRows, finalConfig);

    // Remove duplicates
    processedData = removeDuplicates(processedData);

    // Create output data for CSV
    let outputData: ProcessedRow[] = processedData.map((item) => ({
      Title: item.title,
      Slug_value: item.slug_value,
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
      validActivities.map(
        (
          item,
        ): ActivityDefinitionCreateSpec & { healthcare_service: null } => ({
          title: item.title,
          slug_value: item.slug_value,
          description: item.description,
          usage: item.usage,
          status: item.status,
          classification: item.classification,
          kind: item.kind,
          facility: finalConfig.facilityId,
          category: item.category,
          specimen_requirements: item.specimen_slugs,
          charge_item_definitions: item.charge_item_slugs,
          observation_result_requirements: item.observation_slugs,
          locations: item.locations || [],
          diagnostic_report_codes: item.diagnostic_report_loinc_codes,
          code: item.code!,
          body_site: item.body_site || null,
          derived_from_uri: item.derived_from_uri || null,
          healthcare_service: null,
        }),
      ),
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
      const result = allResults.find(
        (r) => r.item.slug_value === row.Slug_value,
      );
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

export { main, processCsvData, upsertActivityDefinition };
