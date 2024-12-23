export const groupAndMergeByColumn = (
  data: string,
  groupByColumnIndex: number,
  mergeColumnIndices: number[],
  delimiter = ";",
): string => {
  if (!data || typeof data !== "string") {
    throw new Error("Data is in Invalid Format");
  }
  const msg = "An error occurred while processing the export";

  if (groupByColumnIndex < 0) {
    throw new Error(msg);
  }
  if (!mergeColumnIndices.length) {
    throw new Error(msg);
  }
  if (mergeColumnIndices.some((index) => index < 0)) {
    throw new Error(msg);
  }
  const lines = data.split("\n"); // Split the data into individual lines
  if (!lines.length || lines.length === 2) {
    throw new Error("No  patients found for export");
  }

  // Remove the last line only if it's empty
  if (lines[lines.length - 1].trim() === "") {
    lines.pop();
  }

  const groupedData = lines.reduce(
    (groupMap, line) => {
      const columns = line.split(",");
      const groupByKey = columns[groupByColumnIndex]?.trim();

      if (!groupMap[groupByKey]) {
        groupMap[groupByKey] = [];
      }
      groupMap[groupByKey].push(columns);
      return groupMap;
    },
    {} as Record<string, string[][]>,
  );

  const mergedLines = Object.values(groupedData).map((group) => {
    if (!group.length) return "";
    // Validate column indices are within bounds
    const columnCount = group[0].length;
    if (groupByColumnIndex >= columnCount) {
      throw new Error(msg);
    }
    mergeColumnIndices.forEach((index) => {
      if (index >= columnCount) {
        throw new Error(msg);
      }
    });
    const mergedRow = [...group[0]];
    mergeColumnIndices.forEach((mergeIndex) => {
      const mergedValue = group
        .map((columns) => columns[mergeIndex]?.trim() || "")
        .filter(Boolean) // Remove empty values
        .join(delimiter);

      mergedRow[mergeIndex] = mergedValue;
    });
    return mergedRow.join(",");
  });

  // Return the final cleaned data as a string
  return mergedLines.join("\n");
};

export const preventDuplicatePatientsDuetoPolicyId = (data: string): string => {
  const result = groupAndMergeByColumn(
    data,
    0, // Group by Patient ID
    [5], // Merge policy IDs
    ";", // Use ";" as the delimiter
  );
  return result;
};
