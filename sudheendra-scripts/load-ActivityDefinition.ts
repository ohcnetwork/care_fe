import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Import other loaders
import { main as loadChargeItems } from "./load-chargeItem.js";
import { main as loadObservations } from "./load-observation_definition.js";
import { main as loadSpecimens } from "./load-specimenDefinition.js";
import {
  type BaseConfig,
  type ProcessedRow,
  type ValidationRule,
  colorize,
  createScriptConfig,
  ensureActivityDefinitionCategories,
  ensureAuthentication,
  generateHashSlug,
  getAuthHeaders,
  getLogger,
  loadData,
  makeBatchApiCall,
  mergeConfigWithCli,
  normalizeTitle,
  parseCliArgs,
  parseCode,
  processApiResults,
  removeDuplicates,
  showCliHelp,
  validateRowCodes,
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
const __dirname = path.join(path.dirname(__filename), "inputs");
const __rootDir = path.join(__dirname, "..");

dotenv.config({
  path: [path.join(__rootDir, ".env.local"), path.join(__rootDir, ".env")],
});

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
  observations: string[];
  specimens: string[];
  chargeItems: string[];
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

// Validation rules for activity definition codes
const ACTIVITY_VALIDATION_RULES: ValidationRule[] = [
  {
    rowPrefix: "code",
    valuesetUrl:
      "/api/v1/valueset/activity-definition-procedure-code/validate_codes/",
    defaultCode: "71388002", // Default procedure code
    defaultSystem: "http://snomed.info/sct",
    defaultDisplay: "Procedure",
    batchSize: 20,
  },
  // You can easily add more validation rules here:
  // {
  //   rowPrefix: "body_site",
  //   valuesetUrl: "/api/v1/valueset/body-site/validate_codes/",
  //   defaultCode: "123456789",
  //   defaultSystem: "http://snomed.info/sct",
  //   defaultDisplay: "Test Body Site",
  //   batchSize: 20,
  // },
];

// Helper function to create ActivityData from a row with validated code
function createActivityDataFromRow(row: Record<string, string>): ActivityData {
  // Create code from validated row data
  const finalCode = {
    system: row.code_system || ACTIVITY_VALIDATION_RULES[0].defaultSystem,
    code: row.code_value || ACTIVITY_VALIDATION_RULES[0].defaultCode,
    display: row.code_display || ACTIVITY_VALIDATION_RULES[0].defaultDisplay,
  };
  const bodySite = parseCode(
    row.body_site_system,
    row.body_site_code,
    row.body_site_display,
  );

  // Parse diagnostic report LOINC codes as Code objects
  const diagnosticReportCodes: Code[] = [];
  if (row.diagnostic_report_loinc_codes) {
    const codes = row.diagnostic_report_loinc_codes
      .split(";")
      .map((s: string) => s.trim())
      .filter((s: string) => s);

    for (const codeStr of codes) {
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

  return {
    title: row.title,
    slug_value: generateHashSlug(normalizeTitle(row.title)),
    description: row.description,
    usage: row.usage || "",
    status: (row.status as Status) || Status.active,
    classification:
      (row.classification as Classification) || Classification.laboratory,
    kind: Kind.service_request,
    category: row.category || "laboratory",
    observations: row.observation_slugs
      ? row.observation_slugs
          .split(",")
          .map((s: string) => s.trim())
          .filter((s: string) => s)
      : [],
    specimens: row.specimen_slugs
      ? row.specimen_slugs
          .split(",")
          .map((s: string) => s.trim())
          .filter((s: string) => s)
      : [],
    chargeItems: row.charge_item_slugs
      ? row.charge_item_slugs
          .split(",")
          .map((s: string) => s.trim())
          .filter((s: string) => s)
      : [],
    diagnostic_report_loinc_codes: [], //diagnosticReportCodes,
    code: finalCode,
    body_site: bodySite || undefined,
    derived_from_uri: row.derived_from_uri || undefined,
    locations: row.locations
      ? row.locations
          .split(",")
          .map((s: string) => s.trim())
          .filter((s: string) => s)
      : [],
  };
}

// Function to process CSV data using flexible validation
async function processCsvData(
  rows: Record<string, string>[],
  config: BaseConfig,
): Promise<{ data: ActivityData[]; substitutions: Map<string, string> }> {
  // Validate codes using the flexible validation system
  const { validatedRows, substitutions } = await validateRowCodes(
    rows,
    config,
    ACTIVITY_VALIDATION_RULES,
  );

  // Process validated rows into ActivityData
  const results: ActivityData[] = [];
  for (const row of validatedRows) {
    try {
      const activityData = createActivityDataFromRow(row);
      results.push(activityData);
    } catch (error: any) {
      logger(
        colorize(`Error processing row "${row.title}": ${error.message}`, 1),
      );
    }
  }

  /*   const locationData = await fetchLocationData(
    Array.from(new Set(results.map((result) => result.locations || []).flat())),
    config,
  );

  const locationDataMap = new Map(
    locationData.map((location) => [location.name, location.id]),
  );

  results.forEach((result) => {
    let locationIds: string[] = [];
    result.locations?.forEach((locationName) => {
      const locationId = locationDataMap.get(locationName);
      if (locationId) {
        locationIds.push(locationId);
      }
    });
    result.locations = locationIds;
  }); */

  return { data: results, substitutions };
}

// Removed checkDependencies function - dependency checking is now done inline
// with selective filtering of missing dependencies rather than blocking entire activities

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
    if (finalConfig.skipInsert) {
      logger(colorize("Skipping charge item loading...", 1));
    } else {
      logger(colorize("Loading charge items...", 2));
    }
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
    if (finalConfig.skipInsert) {
      logger(colorize("Skipping observation loading...", 1));
    } else {
      logger(colorize("Loading observations...", 2));
    }
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

    // Process data
    logger(colorize("Processing data...", 0));
    const { data: processedData, substitutions } = await processCsvData(
      csvRows,
      finalConfig,
    );

    const categoryData = processedData.map((item) => item.category);

    // Step 4: Ensure categories exist
    logger(colorize("Ensuring categories exist...", 0));
    const categoryResults = await ensureActivityDefinitionCategories(
      categoryData,
      finalConfig,
    );

    // Create a map of category title -> slug for replacement
    const categoryMap = new Map<string, string>();
    categoryResults.categoryData.forEach((cat) => {
      // Use the title as is for the map key
      categoryMap.set(cat.title, cat.slug_value);
    });

    // Remove duplicates
    const uniqueProcessedData = removeDuplicates(processedData);

    // Replace category values with actual generated slugs
    uniqueProcessedData.forEach((item) => {
      const categorySlug = categoryMap.get(normalizeTitle(item.category));
      if (categorySlug) {
        item.category = categorySlug;
      }
    });

    // Create output data for CSV
    let outputData: ProcessedRow[] = uniqueProcessedData.map((item) => ({
      title: item.title,
      slug_value: item.slug_value,
      status: "Pending",
      code_substitution: substitutions.get(item.slug_value) || "",
    }));

    // Step 4: Check dependencies and prepare for batch processing
    logger(colorize("Checking dependencies and preparing for upsert...", 0));
    const allActivities: ActivityData[] = [];
    const invalidActivities: { item: ActivityData; error: string }[] = [];
    const activityWarnings: Map<string, string[]> = new Map();

    const availableSlugs = {
      observations: observationResults.successful.map(
        (obs: any) => obs.item.slug_value,
      ),
      specimens: specimenResults.successful.map(
        (spec: any) => spec.item.slug_value,
      ),
      chargeItems: chargeItemResults.successful.map(
        (ci: any) => ci.item.slug_value,
      ),
      categories: categoryResults.successful,
    };

    for (const item of uniqueProcessedData) {
      const warnings: string[] = [];

      // Check if category is missing (critical - blocks creation)
      if (!availableSlugs.categories.includes(item.category)) {
        invalidActivities.push({
          item,
          error: `Missing category: ${item.category}`,
        });
        continue; // Skip this activity entirely
      }

      // Check for missing dependencies (non-critical - just warnings)
      const missingObservations = item.observations.filter(
        (obs) => !availableSlugs.observations.includes(obs),
      );
      const missingSpecimens = item.specimens.filter(
        (spec) => !availableSlugs.specimens.includes(spec),
      );
      const missingChargeItems = item.chargeItems.filter(
        (ci) => !availableSlugs.chargeItems.includes(ci),
      );

      if (missingObservations.length > 0) {
        warnings.push(
          `Missing observations: ${missingObservations.join(", ")}`,
        );
      }
      if (missingSpecimens.length > 0) {
        warnings.push(`Missing specimens: ${missingSpecimens.join(", ")}`);
      }
      if (missingChargeItems.length > 0) {
        warnings.push(`Missing charge items: ${missingChargeItems.join(", ")}`);
      }

      if (warnings.length > 0) {
        activityWarnings.set(item.slug_value, warnings);
      }

      allActivities.push(item);
    }

    // Step 5: Upsert activities using batch processing
    logger(colorize("Upserting activity definitions...", 0));
    const results = await makeBatchApiCall(
      `/api/v1/facility/${finalConfig.facilityId}/activity_definition/upsert/`,
      allActivities.map(
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
          category: `f-${finalConfig.facilityId}-${item.category}`,
          // Only include dependencies that exist
          specimen_requirements: item.specimens
            .filter((spec) => availableSlugs.specimens.includes(spec))
            .map((spec) => `f-${finalConfig.facilityId}-${spec}`),
          charge_item_definitions: item.chargeItems
            .filter((ci) => availableSlugs.chargeItems.includes(ci))
            .map((ci) => `f-${finalConfig.facilityId}-${ci}`),
          observation_result_requirements: item.observations
            .filter((obs) => availableSlugs.observations.includes(obs))
            .map((obs) => `f-${finalConfig.facilityId}-${obs}`),
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
      // Add results from API calls with warnings
      ...results.map((result) => {
        const warnings = activityWarnings.get(result.item.slug_value);
        let errorMessage = result.error;

        // Append warnings to error message if present
        if (warnings && warnings.length > 0) {
          const warningText = `Warnings: ${warnings.join("; ")}`;
          if (errorMessage) {
            if (typeof errorMessage === "string") {
              errorMessage = { message: errorMessage + "; " + warningText };
            } else if (errorMessage.message) {
              errorMessage = {
                message: errorMessage.message + "; " + warningText,
              };
            } else {
              errorMessage = { message: warningText };
            }
          } else {
            errorMessage = { message: warningText };
          }
        }

        return {
          success: result.success,
          error: errorMessage,
          item: result.item,
        };
      }),
      // Add invalid activities that were blocked from API call
      ...invalidActivities.map((invalid) => ({
        success: false,
        error: { message: invalid.error },
        item: invalid.item,
      })),
    ];

    // Update output data with status
    outputData = outputData.map((row) => {
      const result = allResults.find(
        (r) => r.item.slug_value === row.slug_value,
      );

      // Handle error message properly - convert objects to strings
      let errorMessage = "";
      if (result?.error) {
        if (typeof result.error === "string") {
          errorMessage = result.error;
        } else if (result.error.message) {
          errorMessage = result.error.message;
        } else if (result.error.errorText) {
          errorMessage = result.error.errorText;
        } else {
          // If it's an object without message/errorText, stringify it
          errorMessage = JSON.stringify(result.error);
        }
      }

      return {
        ...row,
        Status: result?.success ? "Success" : "Failed",
        Errors: errorMessage,
      };
    });

    // Write output CSV with dynamic substitution columns
    logger(colorize("Writing output CSV...", 0));

    // Create custom headers with substitution columns
    const customHeaders = [
      "title",
      "slug_value",
      "Status",
      "Errors",
      "code_substitution",
    ];

    await writeOutputCsv(outputData, finalConfig.outputFile, customHeaders);

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

export { main, processCsvData };
