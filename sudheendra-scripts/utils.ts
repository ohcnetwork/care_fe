import dotenv from "dotenv";

dotenv.config({ path: [".env.local", ".env"] });

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
export function createSlug(input: string): string {
  return input
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
