import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { DropdownItemProps } from "@/components/Common/Menu";

import useExport from "@/hooks/useExport";
import { useIsAuthorized } from "@/hooks/useIsAuthorized";

import { Anyone, AuthorizedForCB } from "@/Utils/AuthorizeFor";
import request from "@/Utils/request/request";
import { Route } from "@/Utils/request/types";
import { classNames } from "@/Utils/utils";

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
  variant?: string;
  disabled?: boolean | undefined;
  label?: string;
  exportItems: ExportItem[];
  authorizeFor?: AuthorizedForCB | undefined;
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
  authorizeFor = Anyone,
}: ExportMenuProps) => {
  const { isExporting, exportFile } = useExport();
  const isAuthorized = useIsAuthorized(authorizeFor);

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
    <div
      key="export-menu"
      id="export-button"
      className={cn("tooltip border-primary-500 enabled:border")}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild className="w-full">
          <Button
            variant={"outline_primary"}
            size={"lg"}
            disabled={isExporting || disabled}
          >
            <CareIcon icon="l-export" />
            {isExporting ? "Exporting..." : label}
          </Button>
        </DropdownMenuTrigger>
        {label !== "Importing..." && (
          <DropdownMenuContent>
            {exportItems.map((item) => (
              <div key={item.label} {...item.options}>
                <DropdownMenuItem disabled={isExporting || disabled}>
                  <div
                    className={classNames(
                      isAuthorized
                        ? "pointer-events-auto cursor-pointer"
                        : "!hidden",
                    )}
                    onClick={() => {
                      let action = item.action;
                      if (item.route) {
                        action = async () => {
                          const { data } = await request(item.route!);
                          return data ?? null;
                        };
                      }
                      if (action) {
                        exportFile(
                          action,
                          item.filePrefix,
                          item.type,
                          item.parse,
                        );
                      }
                    }}
                  >
                    <i>{item.options?.icon}</i>
                    <span className="w-full">{item.label}</span>
                  </div>
                </DropdownMenuItem>
              </div>
            ))}
          </DropdownMenuContent>
        )}
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
