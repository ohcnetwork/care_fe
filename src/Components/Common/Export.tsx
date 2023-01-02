import DropdownMenu, {
  DropdownItem,
  DropdownItemProps,
} from "../../Components/Common/components/Menu";
import CareIcon from "../../CAREUI/icons/CareIcon";
import ButtonV2 from "../../Components/Common/components/ButtonV2";
import useExport from "../../Common/hooks/useExport";

interface ExportItem {
  options?: DropdownItemProps;
  type?: "csv" | "json";
  filePrefix?: string;
  label: string;
  action?: any;
}

interface ExportMenuProps {
  disabled?: boolean | undefined;
  label?: string;
  exportItems: ExportItem[];
}

interface ExportButtonProps {
  disabled?: boolean | undefined;
  tooltip?: string | undefined;
  tooltipClassName?: string;
  type?: "csv" | "json";
  action?: any;
  filenamePrefix: string;
}

export const ExportMenu = ({
  label = "Export",
  disabled,
  exportItems,
}: ExportMenuProps) => {
  const { isExporting, exportFile, _CSVLink } = useExport();

  return (
    <div key="export-menu">
      <_CSVLink />
      <DropdownMenu
        disabled={isExporting || disabled}
        title={isExporting ? "Exporting..." : label}
        icon={<CareIcon className="care-l-import" />}
        className="bg-white hover:bg-primary-100 text-primary-500 enabled:border border-primary-500 tooltip"
      >
        {exportItems.map((item) => (
          <DropdownItem
            onClick={() => exportFile(item.action, item.filePrefix, item.type)}
            {...item.options}
          >
            {item.label}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </div>
  );
};

export const ExportButton = ({
  tooltipClassName = "tooltip-bottom -translate-x-7",
  type = "csv",
  ...props
}: ExportButtonProps) => {
  const { isExporting, exportFile, _CSVLink } = useExport();

  return (
    <>
      <_CSVLink />
      <ButtonV2
        disabled={isExporting || props.disabled}
        onClick={() => exportFile(props.action, props.filenamePrefix, type)}
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

export default ExportMenu;
