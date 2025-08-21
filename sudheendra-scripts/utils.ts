import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config({ path: [".env.local", ".env"] });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Although same as `Objects.keys(...)`, this provides better type-safety.
 */
export const keysOf = <T extends object>(obj: T) => {
  return Object.keys(obj) as (keyof T)[];
};

/**
 * Parse a CSV string into a 2D array of strings
 * @param content - The CSV string to parse
 * @returns A 2D array of strings
 */
const parseCsv = (content: string) => {
  const result = content.split("\n").map((line) => {
    // Remove the leading and trailing quotes
    if (line.startsWith('"') && line.endsWith('"')) {
      line = line.slice(1, -1);
    }

    // Split by double quotes and then by comma. This is so that if the csv cell may contain a comma and google sheet csv view will wrap the cell in double quotes.
    const cells = line.split('","');

    return cells.map((cell) => cell.trim());
  });

  // Check if all rows have the same number of columns
  if (!result.every((row) => row.length === result[0].length)) {
    throw new Error("CSV rows have different lengths");
  }

  return result;
};

/**
 * Fetch a CSV from a Google Sheet
 * @param googleSheetId - The ID of the Google Sheet
 * @param sheetName - The name of the sheet
 * @returns A promise that resolves to a 2D array of strings
 */
export const fetchCsvFromGoogleSheet = async (
  googleSheetId: string,
  sheetName: string,
): Promise<string[][]> => {
  const csvUrl = `https://docs.google.com/spreadsheets/d/${googleSheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;

  const response = await fetch(csvUrl, {
    headers: {
      Accept: "text/csv",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch CSV from Google Sheet: ${response.statusText}\n${response.text()}`,
    );
  }

  return parseCsv(await response.text());
};

/**
 * Transform a CSV to an array of objects
 * @param csv - The CSV to transform
 * @param headers - The headers of the CSV. If the header is a number, it will be used as the index of the column. If the header is a string, it will be used as the key of the object.
 * @returns An array of objects
 */
export const transformCsvToObjects = <T extends string>(
  [headerRow, ...dataRows]: string[][],
  headerMap: Record<T, string | number>,
): Record<T, string>[] => {
  // Get the indexes of the headers
  const headerIndex = Object.fromEntries(
    keysOf(headerMap).map((rKey) => {
      if (typeof headerMap[rKey] === "number") {
        return [rKey, headerMap[rKey]];
      }

      const index = headerRow.indexOf(headerMap[rKey]);
      if (index === -1) {
        throw new Error(`Header ${headerMap[rKey]} not found in header row`);
      }
      return [rKey, index];
    }),
  ) as Record<T, number>;

  // Transform the data rows to objects
  return dataRows.map((row) => {
    return Object.fromEntries(
      keysOf(headerMap).map((rKey) => [rKey, row[headerIndex[rKey]]]),
    ) as Record<T, string>;
  });
};

/**
 * Create a slug from a string
 * @param input - The string to create a slug from
 * @returns A slug
 */

// Common interfaces
export interface ProcessedRow {
  [key: string]: string;
}

export interface ApiResult<T = any> {
  success: boolean;
  data?: T;
  error?: any;
  item: any;
}

export interface LoaderResult {
  successful: string[];
  failed: string[];
  results: ApiResult[];
}

// Common configuration
export interface BaseConfig {
  inputFile: string;
  outputFile: string;
  facilityId: string;
  apiBaseUrl: string;
  parser?: "local" | "google-sheets";
  googleSheetId?: string;
  sheetName?: string;
  batchSize?: number;
  maxWorkers?: number;
}

// Utility function to create slug from name
export function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, "") // Keep letters, numbers, spaces, underscores, and hyphens
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .trim();
}

/**
 * Batch an array into smaller arrays of a given size
 * @param array - The array to batch
 * @param batchSize - The size of each batch
 * @returns An array of arrays
 */
export const batchArray = <T>(array: T[], batchSize: number): T[][] => {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += batchSize) {
    result.push(array.slice(i, i + batchSize));
  }
  return result;
};

export const getLogger = () => {
  const stackLine = new Error().stack?.split("\n")[2] ?? "";
  const match = stackLine.match(/[/\\]([^/\\]+)[/\\]([^/\\]+)\.ts/);
  const [, parentDir, fileName] = match ?? [];

  const moduleName =
    parentDir && fileName ? `${parentDir}/${fileName}` : "unknown";

  return (...args: unknown[]) => {
    const timestamp = new Date().toISOString();
    console.log(
      `\x1b[2;37m${timestamp}\x1b[0m\x1b[1;32m [${moduleName}]\x1b[0m`,
      ...args,
    );
  };
};

const CARE_API_URL = process.env.REACT_CARE_API_URL ?? "http://127.0.0.1:8000";

/**
 * Make a request to the CARE API
 * @param url - The URL to make the request to
 * @param method - The method to use for the request
 * @param body - The body of the request
 * @returns The response from the request
 */
export const request = async (
  url: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  body?: Record<string, unknown>,
) => {
  const response = await fetch(`${CARE_API_URL}${url}`, {
    method,
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${process.env.USERNAME}:${process.env.PASSWORD}`).toString("base64")}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to make request to ${url}: ${response.statusText}\n${await response.text()}`,
    );
  }

  return response.json();
};

const CARE_API_WORKERS = parseInt(process.env.CARE_API_WORKERS ?? "4");

/**
 * Batch a request to the CARE API
 * @param datapoints - The datapoints to make the request to
 * @param request - The request to make
 * @param batchSize - The size of each batch
 * @param workers - The number of workers to use
 * @returns The response from the request
 */
export const batchRequest = async <TRequest, TResponse>(
  datapoints: TRequest[],
  request: (
    datapoint: TRequest[],
    meta: {
      groupIndex: number;
      batchIndex: number;
      offset: number;
      batchSize: number;
    },
  ) => Promise<TResponse[]>,
  batchSize = 100,
  workers = CARE_API_WORKERS,
) => {
  const requestGroups = batchArray(batchArray(datapoints, batchSize), workers);

  const results: TResponse[] = [];

  for (const [groupIndex, requestGroup] of Object.entries(requestGroups)) {
    const groupedResults = await Promise.all(
      requestGroup.map(async (datapoints, batchIndex) =>
        request(datapoints, {
          groupIndex: Number(groupIndex),
          batchIndex,
          offset: +groupIndex * workers * batchSize + batchIndex * batchSize,
          batchSize,
        }),
      ),
    );
    results.push(...groupedResults.flat());
  }

  return results;
};

const ANSI_COLORS = [
  "\x1b[90m", // bright black (gray)
  "\x1b[2;37m", // dim white
  "\x1b[2;90m", // dim gray
  "\x1b[30m", // black
  "\x1b[2;30m", // dim black
  "\x1b[97m", // bright white
];

export const colorize = (text: string, number: number) => {
  return `${ANSI_COLORS[number % ANSI_COLORS.length]}${text}\x1b[0m`;
};
// CSV parsing helpers
export function parseCSVLine(line: string): string[] {
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

export function parseCSV(csvContent: string): Record<string, string>[] {
  const lines = csvContent.trim().split("\n");
  const headers = parseCSVLine(lines[0]).map((h) => h.trim().replace(/"/g, ""));
  const rows: Record<string, string>[] = [];
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
      rows.push(row);
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
    rows.push(row);
  }

  return rows;
}

// Function to read and parse CSV file
export async function loadCsvFile(
  filePath: string,
): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      reject(new Error(`File not found: ${filePath}`));
      return;
    }

    try {
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const rows = parseCSV(fileContent);
      console.log(`Loaded ${rows.length} rows from CSV file`);
      resolve(rows);
    } catch (error) {
      reject(error);
    }
  });
}

// Enhanced function to load data from either local file or Google Sheets
export async function loadData(
  config: BaseConfig,
): Promise<Record<string, string>[]> {
  const logger = getLogger();

  if (config.parser === "google-sheets") {
    if (!config.googleSheetId || !config.sheetName) {
      throw new Error(
        "Google Sheets parser requires googleSheetId and sheetName",
      );
    }

    logger(
      colorize(`Loading data from Google Sheets: ${config.googleSheetId}`, 0),
    );
    const csvData = await fetchCsvFromGoogleSheet(
      config.googleSheetId,
      config.sheetName,
    );
    const rows = transformCsvToObjects(csvData, {} as any); // We'll handle header mapping in individual scripts
    logger(colorize(`Loaded ${rows.length} rows from Google Sheets`, 0));
    return rows;
  } else {
    // Default to local file parser
    logger(colorize(`Loading data from local file: ${config.inputFile}`, 0));
    return await loadCsvFile(config.inputFile);
  }
}

// Django/Pydantic error handling
export function extractDjangoError(errorText: any): string {
  // Check if it's an "already exists" error
  const errorString = JSON.stringify(errorText).toLowerCase();
  if (errorString.includes("already exists")) {
    throw {
      errorText: "already exists",
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

  return specificError;
}

// Generic API call function
export async function makeApiCall(
  endpoint: string,
  data: any,
  config: BaseConfig,
  method: "POST" = "POST",
): Promise<any> {
  const url = `${config.apiBaseUrl}${endpoint}`;

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${process.env.USER_NAME}:${process.env.PASSWORD}`).toString("base64")}`,
    },
    body: JSON.stringify({ datapoints: [data] }),
  });

  if (!response.ok) {
    const errorText = await response.json();
    const specificError = extractDjangoError(errorText);

    throw {
      status: response.status,
      statusText: response.statusText,
      errorText: specificError,
    };
  }

  return await response.json();
}

// Batch API call function for processing multiple items
export async function makeBatchApiCall<T>(
  endpoint: string,
  items: T[],
  config: BaseConfig,
  method: "POST" = "POST",
): Promise<ApiResult<T>[]> {
  const logger = getLogger();
  const batchSize = config.batchSize || DEFAULT_CONFIG.batchSize;
  const maxWorkers = config.maxWorkers || DEFAULT_CONFIG.maxWorkers;

  logger(
    colorize(
      `Processing ${items.length} items in batches of ${batchSize} with ${maxWorkers} workers`,
      0,
    ),
  );

  const results: ApiResult<T>[] = [];
  const batches = batchArray(items, batchSize);

  // Process batches with limited concurrency
  for (let i = 0; i < batches.length; i += maxWorkers) {
    const batchGroup = batches.slice(i, i + maxWorkers);
    const batchPromises = batchGroup.map(async (batch, batchIndex) => {
      const batchNumber = i + batchIndex + 1;
      const startIndex = (i + batchIndex) * batchSize;
      const endIndex = Math.min(startIndex + batchSize, items.length);

      logger(
        colorize(
          `Processing batch ${batchNumber}/${Math.ceil(items.length / batchSize)} (items ${startIndex + 1}-${endIndex})`,
          2,
        ),
      );

      const batchResults: ApiResult<T>[] = [];

      for (const item of batch) {
        try {
          const result = await makeApiCall(endpoint, item, config, method);
          batchResults.push({ success: true, data: result, item });
        } catch (error: any) {
          batchResults.push(handleApiError(error, item));
        }
      }

      logger(colorize(`Completed batch ${batchNumber}`, 0));
      return batchResults;
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults.flat());
  }

  logger(colorize(`Completed processing all ${items.length} items`, 0));
  return results;
}

// Function to write processed data to output CSV
export async function writeOutputCsv(
  data: ProcessedRow[],
  outputFile: string,
): Promise<void> {
  if (data.length === 0) {
    console.log("No data to write");
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers.map((header) => `"${row[header] || ""}"`).join(","),
    ),
  ].join("\n");

  // Ensure output directory exists
  const outputDir = path.dirname(outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputFile, csvContent, "utf-8");
  console.log(`Output written to ${outputFile}`);
}

// Function to remove duplicates based on slug
export function removeDuplicates<T extends { slug: string }>(items: T[]): T[] {
  return items.filter(
    (item, index, self) =>
      index === self.findIndex((t) => t.slug === item.slug),
  );
}

// Function to format error messages in a readable way
function formatError(error: any): string {
  if (!error) return "Unknown error";

  // If it's already a string, return it
  if (typeof error === "string") return error;

  // If it has errorText, use that
  if (error.errorText) return error.errorText;

  // If it has a message, use that
  if (error.message) return error.message;

  // If it has status and statusText, format it
  if (error.status && error.statusText) {
    return `HTTP ${error.status}: ${error.statusText}`;
  }

  // For complex objects, try to extract meaningful info
  if (typeof error === "object") {
    // If it has errors array (Pydantic style)
    if (error.errors && Array.isArray(error.errors)) {
      return error.errors
        .map((err: any) => {
          if (err.msg) return err.msg;
          if (err.message) return err.message;
          return "Validation error";
        })
        .join("; ");
    }

    // If it has detail field
    if (error.detail) return error.detail;

    // Last resort: stringify but limit length
    const errorStr = JSON.stringify(error);
    return errorStr.length > 200
      ? errorStr.substring(0, 200) + "..."
      : errorStr;
  }

  return "Unknown error";
}

// Function to process API results and handle "already exists" errors
export function processApiResults<T>(
  results: ApiResult<T>[],
  itemName: string = "item",
): LoaderResult {
  const successful = results.filter((r) => r.success).map((r) => r.item.slug);
  const failed = results.filter((r) => !r.success).map((r) => r.item.slug);

  // Log summary
  console.log(`\n=== ${itemName} Summary ===`);
  console.log(`Total items processed: ${results.length}`);
  console.log(`Successfully created/Already exists: ${successful.length}`);
  console.log(`Failed: ${failed.length}`);

  // Log failed items with details
  if (failed.length > 0) {
    console.log(`\nFailed ${itemName}s:`);
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        const errorMessage = formatError(r.error);
        console.log(`- ${r.item.title || r.item.slug}: ${errorMessage}`);
      });
  }

  return { successful, failed, results };
}

// Function to handle "already exists" errors in catch blocks
export function handleApiError(error: any, item: any): ApiResult {
  if (error.isAlreadyExists) {
    console.log(`Already exists: ${item.title || item.slug} (${item.slug})`);
    return {
      success: true,
      data: { message: "Already exists" },
      item,
    };
  } else {
    return {
      success: false,
      error,
      item,
    };
  }
}

export type parserType = "local" | "google-sheets";

// Common configuration defaults
export const DEFAULT_CONFIG = {
  facilityId: process.env.FACILITY_ID || "f3aab8c6-9cc4-41bc-84e9-cdba0ff5ca86",
  apiBaseUrl: process.env.API_BASE_URL || "http://localhost:8000",
  parser: "local" as parserType,
  sheetName: "Sheet1",
  batchSize: 100,
  maxWorkers: 4,
};

// CLI argument parser
export function parseCliArgs(): Record<string, string> {
  const args: Record<string, string> = {};

  process.argv.slice(2).forEach((arg) => {
    if (arg.startsWith("--")) {
      const [key, value] = arg.slice(2).split("=");
      if (key && value) {
        args[key] = value;
      } else if (key) {
        args[key] = "true"; // Boolean flag
      }
    } else if (arg.startsWith("-")) {
      const key = arg.slice(1);
      args[key] = "true"; // Boolean flag
    }
  });

  return args;
}

// Helper to merge configurations with CLI args
export function mergeConfigWithCli<T extends BaseConfig>(
  defaultConfig: T,
  override?: Partial<T>,
): T {
  const cliArgs = parseCliArgs();

  // Map CLI arguments to config properties
  const cliConfig: Partial<T> = {};

  if (cliArgs.parser) {
    cliConfig.parser = cliArgs.parser as parserType;
  }

  if (cliArgs["google-sheet-id"]) {
    cliConfig.googleSheetId = cliArgs["google-sheet-id"];
  }

  if (cliArgs["sheet-name"]) {
    cliConfig.sheetName = cliArgs["sheet-name"];
  }

  if (cliArgs["input-file"]) {
    cliConfig.inputFile = cliArgs["input-file"];
  }

  if (cliArgs["output-file"]) {
    cliConfig.outputFile = cliArgs["output-file"];
  }

  if (cliArgs["facility-id"]) {
    cliConfig.facilityId = cliArgs["facility-id"];
  }

  if (cliArgs["api-base-url"]) {
    cliConfig.apiBaseUrl = cliArgs["api-base-url"];
  }

  // Merge in order: defaultConfig -> override -> cliConfig
  return { ...defaultConfig, ...override, ...cliConfig };
}

// CLI help function
export function showCliHelp(scriptName: string) {
  console.log(`
Usage: npx tsx ${scriptName} [options]

Options:
  --parser=<type>              Data source type: "local" or "google-sheets" (default: "local")
  --input-file=<path>          Path to local CSV file (for local parser)
  --output-file=<path>         Path for output CSV file
  --google-sheet-id=<id>       Google Sheet ID (for google-sheets parser)
  --sheet-name=<name>          Google Sheet name (default: "Sheet1")
  --facility-id=<id>           Facility ID for API calls (default: from env or "f3aab8c6-9cc4-41bc-84e9-cdba0ff5ca86")
  --api-base-url=<url>         API base URL (default: from env or "http://localhost:8000")
  --help                       Show this help message

Examples:
  # Use local CSV file (minimal args - uses defaults)
  npx tsx ${scriptName} --input-file=./data.csv

  # Use local CSV file with custom output
  npx tsx ${scriptName} --input-file=./data.csv --output-file=./output.csv

  # Use Google Sheets
  npx tsx ${scriptName} --parser=google-sheets --google-sheet-id=123456

  # Override facility ID and API URL
  npx tsx ${scriptName} --facility-id=my-facility-id --api-base-url=https://api.example.com

  # Show help
  npx tsx ${scriptName} --help
`);
}

// Helper to merge configurations
export function mergeConfig<T extends BaseConfig>(
  defaultConfig: T,
  override?: Partial<T>,
): T {
  return { ...defaultConfig, ...override };
}
