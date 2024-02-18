import dayjs from "../../Utils/dayjs";
import { useState } from "react";
import { useDispatch } from "react-redux";

export default function useExport() {
  const dispatch: any = useDispatch();
  const [isExporting, setIsExporting] = useState(false);

  const getTimestamp = () => {
    const now = dayjs();
    const date = now.format("YYYY-MM-DD");
    const time = now.format("HH:mm:ss");

    return date + "_" + time;
  };

  const exportCSV = async (
    filenamePrefix: string,
    action: any,
    parse = (data: string) => data
  ) => {
    setIsExporting(true);

    const filename = `${filenamePrefix}_${getTimestamp()}.csv`;

    const res = await dispatch(action);
    if (res.status === 200) {
      const a = document.createElement("a");
      const blob = new Blob([parse(res.data)], {
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
    action: any,
    parse = (data: string) => data
  ) => {
    setIsExporting(true);

    const res = await dispatch(action);
    if (res.status === 200) {
      const a = document.createElement("a");
      const blob = new Blob([parse(JSON.stringify(res.data.results))], {
        type: "application/json",
      });
      a.href = URL.createObjectURL(blob);
      a.download = `${filenamePrefix}-${getTimestamp()}.json`;
      a.click();
    }

    setIsExporting(false);
  };

  const exportFile = (
    action: any,
    filePrefix = "export",
    type = "csv",
    parse = (data: string) => data
  ) => {
    if (!action) return;

    switch (type) {
      case "csv":
        exportCSV(filePrefix, action(), parse);
        break;
      case "json":
        exportJSON(filePrefix, action(), parse);
        break;
      default:
        exportCSV(filePrefix, action(), parse);
    }
  };

  return {
    isExporting,
    exportCSV,
    exportJSON,
    exportFile,
  };
}
