import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ShadcnMenuDropdownItemProps } from "@/components/Common/Menu";

import useExport from "@/hooks/useExport";
import { useIsAuthorized } from "@/hooks/useIsAuthorized";

import request from "@/Utils/request/request";
import { Route } from "@/Utils/request/types";

import ButtonV2 from "./ButtonV2";

interface ExportItem {
  options?: ShadcnMenuDropdownItemProps;
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

  const authorizationResults = exportItems.map((item) =>
    item.options?.authorizeFor
      ? useIsAuthorized(item.options.authorizeFor)
      : true,
  );

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
        <CareIcon icon="l-export" className="mr-1" />
        {isExporting ? "Exporting..." : label}
      </Button>
    );
  }

  return (
    <div key="export-menu" id="export-button">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            disabled={isExporting || disabled}
            size="default"
            variant="outline_primary"
            className="py-2.5 w-full"
          >
            <CareIcon icon="l-export" className="mr-1" />
            {isExporting ? "Exporting..." : label}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-full">
          {exportItems.map((item, index) => (
            <DropdownMenuItem
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
              disabled={item.options?.disabled || !authorizationResults[index]}
              id={item.options?.id}
              className={item.options?.className}
            >
              <div>
                {item.options?.icon}
                <span className="ml-1">{item.label}</span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
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
        className="tooltip mx-2 p-4 text-lg text-secondary-800 disabled:bg-transparent disabled:text-secondary-500"
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
