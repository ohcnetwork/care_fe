import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";

import useExport from "@/hooks/useExport";

import request from "@/Utils/request/request";
import { ApiRoute } from "@/Utils/request/types";

interface ExportButtonProps {
  disabled?: boolean | undefined;
  tooltip?: string | undefined;
  tooltipClassName?: string;
  type?: "csv" | "json";
  action?: Parameters<ReturnType<typeof useExport>["exportFile"]>[0];
  route?: ApiRoute<string | { results: object[] }, unknown>;
  parse?: (data: string) => string;
  filenamePrefix: string;
  className?: string;
  variant?: "primary_gradient" | "secondary";
}

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
