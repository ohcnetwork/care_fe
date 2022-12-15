import { useState } from "react";
import { useDispatch } from "react-redux";
import DropdownMenu from "../../Components/Common/components/Menu";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { CSVLink } from "react-csv";
import ButtonV2 from "../../Components/Common/components/ButtonV2";

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

interface ExportButtonProps {
  disabled?: boolean | undefined;
  tooltip?: string | undefined;
  tooltipClassName?: string;
  type?: "csv" | "json";
  action: any;
  filenamePrefix: string;
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

  const _CSVLink = () => <CSVLink hidden target="_blank" {...csvLinkProps} />;

  const ExportMenu = ({
    label = "Export",
    disabled,
    children,
  }: ExportMenuProps) => {
    return (
      <>
        <_CSVLink />
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

  const ExportButton = ({
    tooltipClassName = "tooltip-bottom -translate-x-7",
    type = "csv",
    ...props
  }: ExportButtonProps) => {
    const exportFile = () => {
      if (type === "csv") exportCSV(props.filenamePrefix, props.action());
      if (type === "json") exportJSON(props.filenamePrefix, props.action());
    };

    return (
      <>
        <_CSVLink />
        <ButtonV2
          disabled={isExporting || props.disabled}
          onClick={exportFile}
          className="mx-2 tooltip p-4 text-lg text-secondary-800 disabled:text-secondary-500 disabled:bg-transparent"
          variant="secondary"
          ghost
          circle
        >
          {isExporting ? (
            <CareIcon className="care-l-spinner-alt animate-spin" />
          ) : (
            <CareIcon className="care-l-export" />
          )}
          <span className={`tooltip-text ${tooltipClassName}`}>
            {props.tooltip || "Export"}
          </span>
        </ButtonV2>
      </>
    );
  };

  return {
    isExporting,

    ExportMenu,
    ExportButton,

    exportCSV,
    exportJSON,
  };
}
