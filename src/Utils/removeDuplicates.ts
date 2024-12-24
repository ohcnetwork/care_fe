export const csvGroupByColumn = (
  data: string,
  groupByColumn: string,
  delimiter = ";",
): string => {
  const [header, ...datalines] = data.trim().split("\n"); // Split the data into individual lines
  const headerColumns = header.split(","); // Extract the header columns
  const groupByColumnIndex = headerColumns.indexOf(groupByColumn);

  const groupedData = datalines.reduce(
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

    const mergedRow = [...group[0]];
    headerColumns.forEach((column) => {
      const Index = headerColumns.indexOf(column);
      const mergedValue = group
        .map((columns) => columns[Index]?.trim() || "")
        .filter(Boolean) // Remove empty values
        .join(delimiter);

      mergedRow[Index] = mergedValue;
    });
    return mergedRow.join(",");
  });

  return header.concat(mergedLines.join("\n"));
};

export const preventDuplicatePatients = (data: string): string => {
  const result = csvGroupByColumn(
    data,
    "Patient ID", // Group by Patient ID
    ";", // Use ";" as the delimiter
  );
  return result;
};
