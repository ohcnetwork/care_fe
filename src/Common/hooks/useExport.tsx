import { useState } from "react";
import { useDispatch } from "react-redux";
import DropdownMenu from "../../Components/Common/components/Menu";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { CSVLink } from "react-csv";

interface CSVLinkProps {
  id: string;
  filename: string;
  data: string;
}

interface ExportMenuProps {
  disabled?: boolean | undefined;
  label?: string;
  children: JSX.Element | JSX.Element[];
}

export default function useExport() {
  const dispatch: any = useDispatch();
  const [isExporting, setIsExporting] = useState(false);
  const [csvLinkProps, setCsvLinkProps] = useState<CSVLinkProps>({
    id: "csv-download-link",
    filename: "",
    data: "",
  });

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

  const ExportMenu = ({
    label = "Export",
    disabled,
    children,
  }: ExportMenuProps) => {
    return (
      <>
        <CSVLink hidden target="_blank" {...csvLinkProps} />
        <DropdownMenu
          disabled={isExporting || disabled}
          title={isExporting ? "Exporting..." : label}
          icon={<CareIcon className="care-l-import" />}
          className="bg-white hover:bg-primary-100 text-primary-500 enabled:border border-primary-500 tooltip"
        >
          {children}
        </DropdownMenu>
      </>
    );
  };

  return {
    isExporting,
    ExportMenu,
    exportCSV,
    exportJSON,
  };
}
