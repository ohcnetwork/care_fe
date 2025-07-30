/**
 * Parses a CSV string into an array of objects.
 * @param csvText - The CSV string to parse.
 * @param transform - A function that transforms each row into an object.
 * @returns An array of objects.
 */
export function parseCsv<T>(
  csvText: string,
  transform: (row: Record<string, string>) => T,
  defaults?: Partial<Record<string, string>>,
): T[] {
  const lines = csvText.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.trim());

  const data: T[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    const row: Record<string, string> = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || defaults?.[header] || "";
    });

    data.push(transform(row));
  }

  return data;
}
