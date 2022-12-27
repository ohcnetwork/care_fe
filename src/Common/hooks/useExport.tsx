import { useState } from "react";
import { useDispatch } from "react-redux";
import { CSVLink } from "react-csv";

interface CSVLinkProps {
  id: string;
  filename: string;
  data: string;
}

export default function useExport() {
  const dispatch: any = useDispatch();
  const [isExporting, setIsExporting] = useState(false);
  const [csvLinkProps, setCsvLinkProps] = useState<CSVLinkProps>({
    id: "csv-download-link",
    filename: "",
    data: "",
  });

  const _CSVLink = () => <CSVLink hidden target="_blank" {...csvLinkProps} />;

  const getTimestamp = () => new Date().toISOString();

  const exportCSV = async (filenamePrefix: string, action: any) => {
    setIsExporting(true);

    const filename = `${filenamePrefix}_${getTimestamp()}.csv`;

    const res = await dispatch(action);
    if (res.status === 200) {
      setCsvLinkProps({ ...csvLinkProps, filename, data: res.data });
      document.getElementById(csvLinkProps.id)?.click();
    }

    setIsExporting(false);
  };

  const exportJSON = async (filenamePrefix: string, action: any) => {
    setIsExporting(true);

    const res = await dispatch(action);
    if (res.status === 200) {
      const a = document.createElement("a");
      const blob = new Blob([JSON.stringify(res.data.results)], {
        type: "application/json",
      });
      a.href = URL.createObjectURL(blob);
      a.download = `${filenamePrefix}-${getTimestamp()}.json`;
      a.click();
    }

    setIsExporting(false);
  };

  const exportFile = (action: any, filePrefix = "export", type = "csv") => {
    switch (type) {
      case "csv":
        exportCSV(filePrefix, action());
        break;
      case "json":
        exportJSON(filePrefix, action());
        break;
      default:
        exportCSV(filePrefix, action());
    }
  };

  return {
    isExporting,

    _CSVLink,

    exportCSV,
    exportJSON,
    exportFile,
  };
}
