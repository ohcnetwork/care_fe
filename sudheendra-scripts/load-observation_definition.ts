import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import {
  type BaseConfig,
  type ValidationRule,
  colorize,
  createScriptConfig,
  createSlug,
  ensureAuthentication,
  getAuthHeaders,
  getLogger,
  loadData,
  makeBatchApiCall,
  mergeConfigWithCli,
  parseCliArgs,
  parseCode,
  showCliHelp,
  validateRowCodes,
  writeOutputCsv,
} from "./utils.js";

import { Code } from "@/types/base/code/code";
import { QualifiedRange } from "@/types/base/qualifiedRange/qualifiedRange.js";
import {
  OBSERVATION_DEFINITION_STATUS,
  ObservationDefinitionCreateSpec,
  ObservationDefinitionStatus,
  QuestionType,
} from "@/types/emr/observationDefinition/observationDefinition";

/**
 * Types & Enums
 */
interface ObservationDefinitionComponentSpec {
  code: Code;
  permitted_data_type: QuestionType;
  permitted_unit: Code;
  qualified_ranges: QualifiedRange[];
}

interface CSVRow {
  slug: string;
  title: string;
  status: string;
  description: string;
  category: string;
  code_system: string;
  code_value: string;
  code_display: string;
  permitted_data_type: string;
  component: string;
  body_site_system?: string;
  body_site_code?: string;
  body_site_display?: string;
  method_system?: string;
  method_code?: string;
  method_display?: string;
  permitted_unit_system?: string;
  permitted_unit_code?: string;
  permitted_unit_display?: string;
  derived_from_uri?: string;
  qualified_ranges?: string;
}

interface ParsedObservationDefinition {
  slug_value: string;
  title: string;
  status: ObservationDefinitionStatus;
  description: string;
  category: string;
  code: Code;
  permitted_data_type: QuestionType;
  component: ObservationDefinitionComponentSpec[];
  body_site?: Code | null;
  method?: Code | null;
  permitted_unit?: Code | null;
  derived_from_uri?: string;
  facility: string;
  qualified_ranges: QualifiedRange[];
}

interface ProcessedRow {
  Slug_value: string;
  Title: string;
  Status: string;
  Errors?: string;
  Code_Substitution?: string;
}

// Remove duplicate constants - they're imported from types now

/**
 * Config
 */
dotenv.config({ path: [".env.local", ".env"] });
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = getLogger();

// Script-specific configuration defaults
const SCRIPT_DEFAULTS = {
  inputFile: path.join(__dirname, "observation_definitions.csv"),
  outputFile: path.join(__dirname, "observations-output.csv"),
};

// Validation rules for observation definition codes
const OBSERVATION_VALIDATION_RULES: ValidationRule[] = [
  {
    rowPrefix: "code",
    valuesetUrl: "/api/v1/valueset/system-observation/validate_codes/",
    defaultCode: "104922-0", // Laboratory test details panel
    defaultSystem: "http://loinc.org",
    defaultDisplay: "Laboratory test details panel",
    batchSize: 20,
  },
  {
    rowPrefix: "method",
    valuesetUrl: "/api/v1/valueset/system-collection-method/validate_codes/",
    defaultCode: "386053000",
    defaultSystem: "http://snomed.info/sct",
    defaultDisplay: "Technique",
    batchSize: 20,
  },
  // {
  //   rowPrefix: "body_site",
  //   valuesetUrl: "/api/v1/valueset/body-site/validate_codes/",
  //   defaultCode: "123456789",
  //   defaultSystem: "http://snomed.info/sct",
  //   defaultDisplay: "Test Body Site",
  //   batchSize: 20,
  // },
];

/**
 * CSV parsing helpers
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim().replace(/^"(.*)"$/, "$1"));
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim().replace(/^"(.*)"$/, "$1"));
  return result;
}

function parseCSV(csvContent: string): CSVRow[] {
  const lines = csvContent.trim().split("\n");
  const headers = parseCSVLine(lines[0]).map((h) => h.trim().replace(/"/g, ""));
  const rows: CSVRow[] = [];
  let currentLine = "";
  let inMultiLineQuote = false;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    currentLine += (currentLine ? "\n" : "") + line;

    let quoteCount = 0;
    let escapeNext = false;
    for (const char of currentLine) {
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      if (char === '"') quoteCount++;
      if (char === "\\") escapeNext = true;
    }

    if (quoteCount % 2 === 0) {
      const values = parseCSVLine(currentLine);
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = (values[index] || "").replace(/\n/g, " ").trim();
      });
      rows.push(row as unknown as CSVRow);
      currentLine = "";
      inMultiLineQuote = false;
    } else {
      inMultiLineQuote = true;
    }
  }

  if (currentLine && !inMultiLineQuote) {
    const values = parseCSVLine(currentLine);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = (values[index] || "").replace(/\n/g, " ").trim();
    });
    rows.push(row as unknown as CSVRow);
  }

  return rows.filter((row) => row.title);
}

/**
 * Mapping helpers
 */
function parseComponents(
  componentStr: string,
): ObservationDefinitionComponentSpec[] {
  if (!componentStr || componentStr === "[]") return [];
  try {
    if (componentStr.startsWith("[")) {
      const components = JSON.parse(componentStr) as any[];
      return components
        .filter((comp) => typeof comp === "object" && comp !== null)
        .map((comp) => ({
          code: comp.code || { system: "", code: "", display: "" },
          permitted_data_type: comp.permitted_data_type || "",
          permitted_unit: comp.permitted_unit || undefined,
          qualified_ranges: comp.qualified_ranges || [],
        }));
    }
  } catch {
    // Intentionally ignore JSON parse errors for components
  }
  return [];
}

// Helper function to create ParsedObservationDefinition from a row with validated code
function createObservationDefinitionFromRow(
  row: Record<string, string>,
  facilityId: string,
): ParsedObservationDefinition {
  // Create code from validated row data
  const finalCode = {
    system: row.code_system || OBSERVATION_VALIDATION_RULES[0].defaultSystem,
    code: row.code_value || OBSERVATION_VALIDATION_RULES[0].defaultCode,
    display: row.code_display || OBSERVATION_VALIDATION_RULES[0].defaultDisplay,
  };

  const bodySite = parseCode(
    row.body_site_system || "http://snomed.info/sct",
    row.body_site_code,
    row.body_site_display,
  );
  const method = parseCode(
    row.method_system ||
      "http://terminology.hl7.org/CodeSystem/observation-methods",
    row.method_code,
    row.method_display,
  );
  const permittedUnit = parseCode(
    row.permitted_unit_system || "http://unitsofmeasure.org",
    row.permitted_unit_code,
    row.permitted_unit_display,
  );

  const status = OBSERVATION_DEFINITION_STATUS.includes(
    row.status as ObservationDefinitionStatus,
  )
    ? (row.status as ObservationDefinitionStatus)
    : ("active" as ObservationDefinitionStatus);
  const category = row.category || "laboratory";

  return {
    slug_value: row.slug,
    title: row.title,
    status,
    description: row.description,
    category,
    code: finalCode,
    permitted_data_type:
      (row.permitted_data_type as QuestionType) || QuestionType.string,
    component: parseComponents(row.component),
    body_site: bodySite,
    method,
    permitted_unit: permittedUnit,
    derived_from_uri: row.derived_from_uri || undefined,
    facility: facilityId,
    qualified_ranges: [],
  };
}

// Legacy function for backward compatibility
function csvRowToObservationDefinition(
  row: CSVRow,
  facilityId: string,
): ParsedObservationDefinition {
  return createObservationDefinitionFromRow(
    row as unknown as Record<string, string>,
    facilityId,
  );
}

function validateObservationDefinition(
  definition: ParsedObservationDefinition,
): string[] {
  const errors: string[] = [];
  if (!definition.slug_value) errors.push("Slug is required");
  if (!definition.title) errors.push("Title is required");
  if (!definition.description) errors.push("Description is required");
  if (!definition.category) errors.push("Category is required");
  if (!definition.code?.system) errors.push("Code system is required");
  if (!definition.code?.code) errors.push("Code value is required");
  if (
    !definition.permitted_data_type ||
    definition.permitted_data_type.trim() === ""
  )
    errors.push("Permitted data type is required");

  return errors;
}

/**
 * API call
 */
async function upsertObservationDefinition(
  data: ParsedObservationDefinition,
  config: BaseConfig,
) {
  const apiUrl = `${config.apiBaseUrl}/api/v1/observation_definition/upsert/`;
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(config),
    },
    body: JSON.stringify({ datapoints: [data] }),
  });

  if (!response.ok) {
    const errorText = await response.json();

    // Check if it's a "slug must be unique" error
    const errorString = JSON.stringify(errorText).toLowerCase();
    if (errorString.includes("slug must be unique")) {
      throw {
        status: response.status,
        statusText: response.statusText,
        errorText: "slug must be unique",
        isAlreadyExists: true,
      };
    }

    // Extract specific error message from Django/Pydantic error object
    let specificError = "Unknown error";
    if (typeof errorText === "string") {
      specificError = errorText;
    } else if (errorText?.errors && Array.isArray(errorText.errors)) {
      // Pydantic validation errors: [{type, loc, msg, input, url}, ...]
      specificError = errorText.errors
        .map((err: any) => {
          const field = err.loc ? err.loc.join(" > ") : "unknown field";
          const message =
            typeof err.msg === "string" ? err.msg : JSON.stringify(err.msg);
          return `${field}: ${message}`;
        })
        .join("; ");
    } else if (typeof errorText === "object" && errorText !== null) {
      // Structured errors: {field_name: [errors], ...}
      const fieldErrors = Object.entries(errorText)
        .map(([field, errors]) => {
          if (Array.isArray(errors)) {
            return errors
              .map((err: any) => {
                if (typeof err === "string") return `${field}: ${err}`;
                if (err?.msg) return `${field}: ${err.msg}`;
                if (err?.message) return `${field}: ${err.message}`;
                return `${field}: ${JSON.stringify(err)}`;
              })
              .join("; ");
          } else if (typeof errors === "string") {
            return `${field}: ${errors}`;
          }
          return `${field}: ${JSON.stringify(errors)}`;
        })
        .join("; ");
      specificError = fieldErrors || JSON.stringify(errorText);
    } else {
      specificError = JSON.stringify(errorText);
    }

    throw {
      status: response.status,
      statusText: response.statusText,
      errorText: specificError,
    };
  }
  return await response.json();
}

async function mockInsert(config: BaseConfig) {
  const rawRows = await loadData(config);
  if (rawRows.length === 0) throw new Error("No valid rows found in CSV file");

  // Convert generic rows to typed CSVRow objects
  const rows: CSVRow[] = rawRows.map((row) => row as unknown as CSVRow);

  return {
    successful: rows.map((item) => item.slug),
    failed: [],
    results: rows.map((item) => ({
      success: true,
      item: item,
    })),
  };
}

/**
 * Main script
 */
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
    logger(colorize("Starting observation definition loader...", 0));

    // Ensure authentication tokens are available if token auth is enabled
    finalConfig = await ensureAuthentication(finalConfig);

    // Load data using the shared loadData function
    const rawRows = await loadData(finalConfig);
    if (rawRows.length === 0)
      throw new Error("No valid rows found in CSV file");

    // Convert generic rows to typed CSVRow objects
    const rows: CSVRow[] = rawRows.map((row) => row as unknown as CSVRow);

    logger(colorize(`Processing ${rows.length} observation definitions...`, 0));

    // Validate codes using the flexible validation system
    const { validatedRows, substitutions } = await validateRowCodes(
      rows as unknown as Record<string, string>[],
      finalConfig,
      OBSERVATION_VALIDATION_RULES,
    );

    // Process validated rows into ParsedObservationDefinition
    const processedDefinitions: ParsedObservationDefinition[] = [];
    for (const row of validatedRows) {
      try {
        const definition = createObservationDefinitionFromRow(
          row,
          finalConfig.facilityId,
        );
        processedDefinitions.push(definition);
      } catch (error: any) {
        logger(
          colorize(`Error processing row "${row.title}": ${error.message}`, 1),
        );
      }
    }

    // Validate processed definitions
    const validDefinitions: ParsedObservationDefinition[] = [];
    const invalidRows: { row: CSVRow; errors: string[] }[] = [];

    for (const definition of processedDefinitions as ParsedObservationDefinition[]) {
      try {
        const errors = validateObservationDefinition(definition);
        if (errors.length > 0) {
          // Find the original row for error reporting
          const originalRow = rows.find(
            (r) => r.slug === definition.slug_value,
          );
          if (originalRow) {
            invalidRows.push({ row: originalRow, errors });
          }
        } else {
          validDefinitions.push(definition);
        }
      } catch (error: any) {
        // Find the original row for error reporting
        const originalRow = rows.find((r) => r.slug === definition.slug_value);
        if (originalRow) {
          invalidRows.push({ row: originalRow, errors: [error.message] });
        }
      }
    }

    // Process valid definitions using batch API call
    logger(colorize("Upserting observation definitions...", 0));
    const results = await makeBatchApiCall(
      `/api/v1/observation_definition/upsert/`,
      validDefinitions.map(
        (def): ObservationDefinitionCreateSpec => ({
          slug_value: def.slug_value,
          title: def.title,
          status: def.status,
          description: def.description,
          category: def.category,
          code: def.code,
          permitted_data_type: def.permitted_data_type,
          component: def.component,
          body_site: def.body_site || null,
          method: def.method || null,
          permitted_unit: def.permitted_unit || null,
          derived_from_uri: def.derived_from_uri,
          facility: def.facility,
          qualified_ranges: def.qualified_ranges,
        }),
      ),
      finalConfig,
    );

    // Create processed rows for output
    const processedRows: ProcessedRow[] = [];

    // Add invalid rows
    invalidRows.forEach(({ row, errors }) => {
      processedRows.push({
        Slug_value: row.slug || createSlug(row.title),
        Title: row.title || "UNKNOWN",
        Status: "Validation Failed",
        Errors: errors.join("; "),
        Code_Substitution: substitutions.get(row.slug) || "",
      });
    });

    // Add results from batch processing
    results.forEach((result) => {
      // Handle error message properly - convert objects to strings
      let errorMessage = "";
      if (result.error) {
        if (typeof result.error === "string") {
          errorMessage = result.error;
        } else if (result.error.errorText) {
          errorMessage = result.error.errorText;
        } else if (result.error.message) {
          errorMessage = result.error.message;
        } else {
          // If it's an object without message/errorText, stringify it
          errorMessage = JSON.stringify(result.error);
        }
      }

      processedRows.push({
        Slug_value: result.item.slug_value,
        Title: result.item.title,
        Status: result.success ? "Success" : "Failed",
        Errors: errorMessage,
        Code_Substitution: substitutions.get(result.item.slug_value) || "",
      });
    });

    // Add substitution data to each row
    const outputDataWithSubstitutions = processedRows.map((row) => {
      const rowWithSubstitutions: Record<string, any> = { ...row };

      // Add substitution columns for each validation rule
      OBSERVATION_VALIDATION_RULES.forEach((rule) => {
        const substitutionKey = `${rule.rowPrefix}_Substitution`;
        rowWithSubstitutions[substitutionKey] =
          substitutions.get(`${row.Slug_value}.${rule.rowPrefix}`) || "";
      });

      return rowWithSubstitutions;
    });

    // Create custom headers with substitution columns
    const customHeaders = [
      "Slug_value",
      "Title",
      "Status",
      "Errors",
      ...OBSERVATION_VALIDATION_RULES.map(
        (rule) => `${rule.rowPrefix}_Substitution`,
      ),
    ];

    await writeOutputCsv(
      outputDataWithSubstitutions,
      finalConfig.outputFile,
      customHeaders,
    );

    logger(colorize(`Output written to ${finalConfig.outputFile}`, 0));

    logger(colorize(`Total processed: ${processedRows.length}`, 0));
    logger(
      colorize(
        `Success: ${processedRows.filter((r: ProcessedRow) => r.Status === "Success").length}`,
        0,
      ),
    );
    logger(
      colorize(
        `Failed: ${processedRows.filter((r: ProcessedRow) => r.Status !== "Success").length}`,
        1,
      ),
    );

    if (results.filter((r) => !r.success).length > 0) {
      //logger(colorize("\nFailed items:", 1));
      results
        .filter((r) => !r.success)
        .forEach((r) => {
          const errorMessage =
            r.error?.errorText || r.error?.message || JSON.stringify(r.error);
          //logger(colorize(`- ${r.item.title}: ${errorMessage}`, 1));
        });
    }

    // Return results for use by other scripts
    return {
      successful: results
        .filter((r) => r.success)
        .map((r) => r.item.slug_value),
      failed: results.filter((r) => !r.success).map((r) => r.item.slug_value),
      results,
    };
  } catch (err) {
    logger(colorize(`Error in main process: ${err}`, 1));
    throw err;
  }
}

// Run the script
if (require.main === module) {
  const cliArgs = parseCliArgs();

  if (cliArgs.help) {
    showCliHelp("sudheendra-scripts/load-observation_definition.ts");
    process.exit(0);
  }

  main();
}

export {
  csvRowToObservationDefinition,
  main,
  parseCSV,
  upsertObservationDefinition,
};
