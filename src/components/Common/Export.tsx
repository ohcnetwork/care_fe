import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";

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
  className?: string;
  variant?: "primary_gradient" | "secondary";
}

export const ExportMenu = ({
  label = "Export",
  disabled,
  exportItems,
}: ExportMenuProps) => {
  const { isExporting, exportFile } = useExport();
  const { t } = useTranslation();

  if (exportItems.length === 1) {
    const item = exportItems[0];

    return (
      <Button
        variant={"primary_gradient"}
        className="gap-2"
        disabled={isExporting || disabled}
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
      >
        <CareIcon icon="l-export" />
        {isExporting ? `${t("exporting")}...` : label}
      </Button>
    );
  }

  return (
    <div key="export-menu" id="export-button">
      <DropdownMenu
        disabled={isExporting || disabled}
        title={isExporting ? "Exporting..." : label}
        icon={<CareIcon icon="l-export" />}
        className="tooltip border-primary-500 bg-white text-primary-500 hover:bg-primary-100 enabled:border"
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
  variant,
  type = "csv",
  className,
  parse,
  ...props
}: ExportButtonProps) => {
  const { isExporting, exportFile } = useExport();
  const { t } = useTranslation();

  return (
    <>
      <Button
        variant={variant || "primary_gradient"}
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
        className={cn(
          "tooltip gap-2 text-lg text-white disabled:bg-transparent disabled:text-secondary-500",
          className,
        )}
      >
        {isExporting ? (
          <CareIcon icon="l-spinner-alt" className="animate-spin" />
        ) : (
          <CareIcon icon="l-export" />
        )}
        <span className={`tooltip-text ${tooltipClassName}`}>
          {props.tooltip || t("export")}
        </span>
      </Button>
    </>
  );
};

export default ExportMenu;
