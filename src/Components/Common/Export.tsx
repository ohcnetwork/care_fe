import DropdownMenu, {
  DropdownItem,
  DropdownItemProps,
} from "../../Components/Common/components/Menu";

import ButtonV2 from "../../Components/Common/components/ButtonV2";
import CareIcon from "../../CAREUI/icons/CareIcon";
import useExport from "../../Common/hooks/useExport";

interface ExportItem {
  options?: DropdownItemProps;
  type?: "csv" | "json";
  filePrefix?: string;
  label: string;
  parse?: (data: string) => string;
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
  parse?: (data: string) => string;
  filenamePrefix: string;
}

export const ExportMenu = ({
  label = "Export",
  disabled,
  exportItems,
}: ExportMenuProps) => {
  const { isExporting, exportFile } = useExport();

  return (
    <div key="export-menu">
      <DropdownMenu
        disabled={isExporting || disabled}
        title={isExporting ? "Exporting..." : label}
        icon={<CareIcon className="care-l-import" />}
        className="tooltip border-primary-500 bg-white text-primary-500 hover:bg-primary-100 enabled:border"
      >
        {exportItems.map((item) => (
          <DropdownItem
            key={item.label}
            onClick={() =>
              exportFile(item.action, item.filePrefix, item.type, item.parse)
            }
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
  parse,
  ...props
}: ExportButtonProps) => {
  const { isExporting, exportFile } = useExport();

  return (
    <>
      <ButtonV2
        disabled={isExporting || props.disabled}
        onClick={() =>
          exportFile(props.action, props.filenamePrefix, type, parse)
        }
        className="tooltip mx-2 p-4 text-lg text-secondary-800 disabled:bg-transparent disabled:text-secondary-500"
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
