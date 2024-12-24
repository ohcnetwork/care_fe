export const csvGroupByColumn = (
  data: string,
  groupByColumn: string = "Patient ID",
  delimiter = ";",
): string => {
  const [header, ...datalines] = data.trim().split("\n");
  const headerColumns = header.split(",");
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
      const index = headerColumns.indexOf(column);
      const mergedValue = group
        .map((columns) => columns[index]?.trim() || "")
        .filter(Boolean)
        .join(delimiter);

      mergedRow[index] = mergedValue;
    });
    return mergedRow.join(",");
  });

  return header.concat(mergedLines.join("\n"));
};
