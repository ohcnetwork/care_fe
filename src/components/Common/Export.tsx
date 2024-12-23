import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";

import ButtonV2 from "@/components/Common/ButtonV2";
import DropdownMenu, {
  DropdownItem,
  DropdownItemProps,
} from "@/components/Common/Menu";

import useExport from "@/hooks/useExport";

import request from "@/Utils/request/request";
import { Route } from "@/Utils/request/types";

interface ExportItem {
  options?: DropdownItemProps;
  type?: "csv" | "json";
  filePrefix?: string;
  label: string;
  parse?: (data: string) => string;
  action?: Parameters<ReturnType<typeof useExport>["exportFile"]>[0];
  route?: Route<string | { results: object[] }, unknown>;
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
  action?: Parameters<ReturnType<typeof useExport>["exportFile"]>[0];
  route?: Route<string | { results: object[] }, unknown>;
  parse?: (data: string) => string;
  filenamePrefix: string;
}

export const ExportMenu = ({
  label = "Export",
  disabled,
  exportItems,
}: ExportMenuProps) => {
  const { isExporting, exportFile } = useExport();

  if (exportItems.length === 1) {
    const item = exportItems[0];

    return (
      <Button
        disabled={isExporting || disabled}
        size="default"
        onClick={() => {
          let action = item.action;
          if (item.route) {
            action = async () => {
              const { data } = await request(item.route!);
              return data ?? null;
            };
          }
          if (action) {
            exportFile(action, item.filePrefix, item.type, item.parse);
          }
        }}
        variant="outline_primary"
        className="py-2.5"
      >
        <CareIcon icon="l-export" />
        {isExporting ? "Exporting..." : label}
      </Button>
    );
  }

  return (
    <div key="export-menu" id="export-button">
      <DropdownMenu
        disabled={isExporting || disabled}
        title={isExporting ? "Exporting..." : label}
        icon={<CareIcon icon="l-export" />}
        className="border border-primary-700 text-primary-700 bg-white shadow-sm hover:bg-primary-700 hover:text-white h-9 px-4 py-2dark:border-primary-700 dark:bg-primary-700 dark:text-white"
      >
        {exportItems.map((item) => (
          <DropdownItem
            key={item.label}
            onClick={() => {
              let action = item.action;
              if (item.route) {
                action = async () => {
                  const { data } = await request(item.route!);
                  return data ?? null;
                };
              }
              if (action) {
                exportFile(action, item.filePrefix, item.type, item.parse);
              }
            }}
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
        onClick={() => {
          let action = props.action;
          if (props.route) {
            action = async () => {
              const { data } = await request(props.route!);
              return data ?? null;
            };
          }
          if (action) {
            exportFile(action, props.filenamePrefix, type, parse);
          }
        }}
        className="tooltip mx-2 p-4 text-lg text-secondary-800  bg-red disabled:bg-transparent disabled:text-secondary-500"
        variant="secondary"
        ghost
        circle
      >
        {isExporting ? (
          <CareIcon icon="l-spinner-alt" className="animate-spin" />
        ) : (
          <CareIcon icon="l-export" />
        )}
        <span className={`tooltip-text ${tooltipClassName}`}>
          {props.tooltip || "Export"}
        </span>
      </ButtonV2>
    </>
  );
};

export default ExportMenu;
