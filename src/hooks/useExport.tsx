import { useState } from "react";

import dayjs from "@/Utils/dayjs";

export default function useExport() {
  const [isExporting, setIsExporting] = useState(false);

  const getTimestamp = () => {
    const now = dayjs();
    const date = now.format("YYYY-MM-DD");
    const time = now.format("HH:mm:ss");

    return date + "_" + time;
  };

  const exportCSV = async (
    filenamePrefix: string,
    getData: () => Promise<string | null>,
    parse = (data: string) => data,
  ) => {
    setIsExporting(true);

    const filename = `${filenamePrefix}_${getTimestamp()}.csv`;

    const data = await getData();
    if (data) {
      const a = document.createElement("a");
      const blob = new Blob([parse(data)], {
        type: "text/csv",
      });
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
    }

    setIsExporting(false);
  };

  const exportJSON = async (
    filenamePrefix: string,
    getData: () => Promise<{ results: object[] } | null>,
    parse = (data: string) => data,
  ) => {
    setIsExporting(true);

    const data = await getData();
    if (data?.results.length) {
      const a = document.createElement("a");
      const blob = new Blob([parse(JSON.stringify(data.results))], {
        type: "application/json",
      });
      a.href = URL.createObjectURL(blob);
      a.download = `${filenamePrefix}-${getTimestamp()}.json`;
      a.click();
    }

    setIsExporting(false);
  };

  const exportFile = (
    action: () => Promise<{ results: object[] } | string | null>,
    filePrefix = "export",
    type = "csv",
    parse = (data: string) => data,
  ) => {
    if (!action) return;

    switch (type) {
      case "csv":
        exportCSV(filePrefix, action as Parameters<typeof exportCSV>[1], parse);
        break;
      case "json":
        exportJSON(
          filePrefix,
          action as Parameters<typeof exportJSON>[1],
          parse,
        );
        break;
      default:
        exportCSV(filePrefix, action as Parameters<typeof exportCSV>[1], parse);
    }
  };

  return {
    isExporting,
    exportCSV,
    exportJSON,
    exportFile,
  };
}
