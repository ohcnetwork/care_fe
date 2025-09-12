import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import {
  type BaseConfig,
  colorize,
  createScriptConfig,
  ensureAuthentication,
  getAuthHeaders,
  getLogger,
  loadData,
  makeBatchApiCall,
  mergeConfigWithCli,
  parseCliArgs,
  parseCode,
  showCliHelp,
} from "./utils.js";

import { Code } from "@/types/base/code/code";
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
  qualified_value?: string;
}

interface ParsedObservationDefinition {
  slug: string;
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
}

interface ProcessedRow {
  Slug: string;
  Title: string;
  Status: string;
  Errors?: string;
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
        }));
    }
  } catch {
    // Intentionally ignore JSON parse errors for components
  }
  return [];
}

function csvRowToObservationDefinition(
  row: CSVRow,
  facilityId: string,
): ParsedObservationDefinition {
  const code = parseCode(row.code_system, row.code_value, row.code_display);
  if (!code) throw new Error(`Invalid code data for row: ${row.title}`);

  const bodySite = parseCode(
    row.body_site_system,
    row.body_site_code,
    row.body_site_display,
  );
  const method = parseCode(
    row.method_system,
    row.method_code,
    row.method_display,
  );
  const permittedUnit = parseCode(
    row.permitted_unit_system,
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
    slug: row.slug,
    title: row.title,
    status,
    description: row.description,
    category,
    code,
    permitted_data_type:
      (row.permitted_data_type as QuestionType) || QuestionType.string,
    component: parseComponents(row.component),
    body_site: bodySite,
    method,
    permitted_unit: permittedUnit,
    derived_from_uri: row.derived_from_uri || undefined,
    facility: facilityId,
  };
}

function validateObservationDefinition(
  definition: ParsedObservationDefinition,
): string[] {
  const errors: string[] = [];
  if (!definition.slug) errors.push("Slug is required");
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

    // Process all rows and prepare for batch API call
    const validDefinitions: ParsedObservationDefinition[] = [];
    const invalidRows: { row: CSVRow; errors: string[] }[] = [];

    for (const row of rows) {
      try {
        const definition = csvRowToObservationDefinition(
          row,
          finalConfig.facilityId,
        );
        const errors = validateObservationDefinition(definition);
        if (errors.length > 0) {
          invalidRows.push({ row, errors });
        } else {
          validDefinitions.push(definition);
        }
      } catch (error: any) {
        invalidRows.push({ row, errors: [error.message] });
      }
    }

    // Process valid definitions using batch API call
    logger(colorize("Upserting observation definitions...", 0));
    const results = await makeBatchApiCall(
      `/api/v1/observation_definition/upsert/`,
      validDefinitions.map(
        (def): ObservationDefinitionCreateSpec => ({
          slug: def.slug,
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
        }),
      ),
      finalConfig,
    );

    // Create processed rows for output
    const processedRows: ProcessedRow[] = [];

    // Add invalid rows
    invalidRows.forEach(({ row, errors }) => {
      processedRows.push({
        Slug: row.slug || "UNKNOWN",
        Title: row.title || "UNKNOWN",
        Status: "Validation Failed",
        Errors: errors.join("; "),
      });
    });

    // Add results from batch processing
    results.forEach((result) => {
      processedRows.push({
        Slug: result.item.slug,
        Title: result.item.title,
        Status: result.success ? "Success" : "Failed",
        Errors: result.error?.errorText || result.error?.message || "",
      });
    });

    const csvOutput = [
      "Slug,Title,Status,Errors",
      ...processedRows.map(
        (r: ProcessedRow) =>
          `"${r.Slug}","${r.Title}","${r.Status}","${r.Errors || ""}"`,
      ),
    ].join("\n");
    fs.writeFileSync(finalConfig.outputFile, csvOutput, "utf-8");

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
      logger(colorize("\nFailed items:", 1));
      results
        .filter((r) => !r.success)
        .forEach((r) => {
          const errorMessage =
            r.error?.errorText || r.error?.message || JSON.stringify(r.error);
          logger(colorize(`- ${r.item.title}: ${errorMessage}`, 1));
        });
    }

    // Return results for use by other scripts
    return {
      successful: results.filter((r) => r.success).map((r) => r.item.slug),
      failed: results.filter((r) => !r.success).map((r) => r.item.slug),
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
