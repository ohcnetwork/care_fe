import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/**
 * Types & Enums
 */
interface Code {
  system: string;
  code: string;
  display: string;
}

interface ObservationDefinitionComponentSpec {
  code: Code;
  permitted_data_type: string;
  permitted_unit?: Code;
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
  status: string;
  description: string;
  category: string;
  code: Code;
  permitted_data_type: string;
  component: ObservationDefinitionComponentSpec[];
  body_site?: Code | null;
  method?: Code | null;
  permitted_unit?: Code | null;
  derived_from_uri?: string;
  facility: string;
  qualified_value?: string;
}

interface ProcessedRow {
  Slug: string;
  Title: string;
  Status: string;
  Errors?: string;
}

const OBSERVATION_DEFINITION_STATUS = [
  "draft",
  "active",
  "retired",
  "unknown",
] as const;
const OBSERVATION_DEFINITION_CATEGORY = [
  "social_history",
  "vital_signs",
  "imaging",
  "laboratory",
  "procedure",
  "survey",
  "exam",
  "therapy",
  "activity",
] as const;

/**
 * Config
 */
dotenv.config({ path: [".env.local", ".env"] });
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  inputFile: path.join(__dirname, "observation_definitions.csv"),
  outputFile: path.join(__dirname, "observations-output.csv"),
  facilityId: process.env.FACILITY_ID || "9bff2c5b-0151-4f09-97cb-2a7b91cbdf04",
  apiBaseUrl: process.env.API_BASE_URL || "http://localhost:9000",
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

  return rows;
}

/**
 * Mapping helpers
 */
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
    row.status as (typeof OBSERVATION_DEFINITION_STATUS)[number],
  )
    ? row.status
    : "active";
  const category = OBSERVATION_DEFINITION_CATEGORY.includes(
    row.category as (typeof OBSERVATION_DEFINITION_CATEGORY)[number],
  )
    ? row.category
    : "laboratory";

  return {
    slug: row.slug,
    title: row.title,
    status,
    description: row.description,
    category,
    code,
    permitted_data_type: row.permitted_data_type || "string",
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
async function upsertObservationDefinition(data: ParsedObservationDefinition) {
  const apiUrl = `${CONFIG.apiBaseUrl}/api/v1/observation_definition/upsert/`;
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${process.env.USER_NAME}:${process.env.PASSWORD}`).toString("base64")}`,
    },
    body: JSON.stringify({ datapoints: [data] }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `HTTP ${response.status}: ${response.statusText} - ${errorText}`,
    );
  }
  return await response.json();
}

/**
 * Main script
 */
async function main() {
  try {
    console.log("Starting observation definition loader...");

    if (!CONFIG.inputFile || !fs.existsSync(CONFIG.inputFile)) {
      throw new Error(
        `Input file not found or path is invalid: ${CONFIG.inputFile}`,
      );
    }

    const csvContent = fs.readFileSync(CONFIG.inputFile, "utf-8");
    const rows = parseCSV(csvContent);
    if (rows.length === 0) throw new Error("No valid rows found in CSV file");

    const processedRows: ProcessedRow[] = [];

    for (const row of rows) {
      try {
        const definition = csvRowToObservationDefinition(
          row,
          CONFIG.facilityId,
        );
        const errors = validateObservationDefinition(definition);
        if (errors.length > 0) {
          processedRows.push({
            Slug: definition.slug,
            Title: definition.title,
            Status: "Validation Failed",
            Errors: errors.join("; "),
          });
          continue;
        }
        await upsertObservationDefinition(definition);
        processedRows.push({
          Slug: definition.slug,
          Title: definition.title,
          Status: "Success",
        });
      } catch (err) {
        processedRows.push({
          Slug: row.slug || "UNKNOWN",
          Title: row.title || "UNKNOWN",
          Status: "Failed",
          Errors: (err as Error).message,
        });
      }
    }

    const csvOutput = [
      "Slug,Title,Status,Errors",
      ...processedRows.map(
        (r: ProcessedRow) =>
          `"${r.Slug}","${r.Title}","${r.Status}","${r.Errors || ""}"`,
      ),
    ].join("\n");
    fs.writeFileSync(CONFIG.outputFile, csvOutput, "utf-8");

    console.log(`Output written to ${CONFIG.outputFile}`);
    console.log(`Total processed: ${processedRows.length}`);
    console.log(
      `Success: ${processedRows.filter((r: ProcessedRow) => r.Status === "Success").length}`,
    );
    console.log(
      `Failed: ${processedRows.filter((r: ProcessedRow) => r.Status !== "Success").length}`,
    );
  } catch (err) {
    console.error("Error in main process:", err);
  }
}

main();
