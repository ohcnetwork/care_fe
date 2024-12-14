import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { DropdownItemProps } from "@/components/Common/Menu";

import useExport from "@/hooks/useExport";

import request from "@/Utils/request/request";
import { Route } from "@/Utils/request/types";

import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

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
        variant={"outline_primary"}
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
        className="py-2.5"
      >
        <CareIcon icon="l-export" />
        {isExporting ? "Exporting..." : label}
      </Button>
    );
  }

  return (
    <div key="export-menu" id="export-button" className="w-full">
      <DropdownMenu>
        <DropdownMenuTrigger className={cn("w-full")}>
          <Button
            variant={"outline_primary"}
            size={"lg"}
            className="w-full gap-2 cursor-pointer"
            disabled={isExporting || disabled}
          >
            <CareIcon icon="l-export" className="text-base lg:w-fit" />
            {isExporting ? "Exporting..." : label}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {exportItems.map((item) => (
            <div
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
              <DropdownMenuItem className={cn("cursor-pointer gap-2")}>
                {item.options?.icon}
                {item.label}
              </DropdownMenuItem>
            </div>
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
      <Button
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
      >
        {isExporting ? (
          <CareIcon icon="l-spinner-alt" className="animate-spin" />
        ) : (
          <CareIcon icon="l-export" />
        )}
        <span className={`tooltip-text ${tooltipClassName}`}>
          {props.tooltip || "Export"}
        </span>
      </Button>
    </>
  );
};

export default ExportMenu;
