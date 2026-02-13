/**
 * Escapes a CSV field value by wrapping it in quotes if it contains
 * commas, quotes, or newlines.
 */
function escapeCSVField(value: string): string {
  if (
    value.includes(",") ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export interface CSVColumn<T> {
  header: string;
  accessor: (row: T) => string;
}

/**
 * Generates a CSV string from the given data and columns, then triggers
 * a browser download with the specified filename.
 */
export function exportCSV<T>(
  data: T[],
  columns: CSVColumn<T>[],
  filename: string,
): void {
  const headerRow = columns.map((col) => escapeCSVField(col.header)).join(",");

  const dataRows = data.map((row) =>
    columns.map((col) => escapeCSVField(col.accessor(row))).join(","),
  );

  const csvContent = "\uFEFF" + [headerRow, ...dataRows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  try {
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
  } finally {
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }
}
