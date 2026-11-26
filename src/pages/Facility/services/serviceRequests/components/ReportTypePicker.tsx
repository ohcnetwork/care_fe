import { Plus, X } from "lucide-react";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Code } from "@/types/base/code/code";

import { reportCodeKey } from "./diagnosticReportCreation";

export function ReportTypePicker({
  availableReportCodes,
  hasCollectedSpecimens,
  disableEdit,
  onCreateReport,
  onDismiss,
  className,
}: {
  availableReportCodes: Code[];
  hasCollectedSpecimens: boolean;
  disableEdit: boolean;
  onCreateReport: (code: Code) => void;
  onDismiss?: () => void;
  className?: string;
}) {
  const { t } = useTranslation();
  const triggerId = useId();
  const [selectedCode, setSelectedCode] = useState<Code | null>(null);
  const effectiveSelectedCode =
    availableReportCodes.length === 1 ? availableReportCodes[0] : selectedCode;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted p-2",
        className,
      )}
    >
      <Label htmlFor={triggerId} className="sr-only">
        {t("select_diagnostic_report_type")}
      </Label>
      <Select
        value={
          effectiveSelectedCode ? reportCodeKey(effectiveSelectedCode) : ""
        }
        onValueChange={(value) => {
          const code = availableReportCodes.find(
            (c) => reportCodeKey(c) === value,
          );
          setSelectedCode(code ?? null);
        }}
        disabled={!hasCollectedSpecimens || disableEdit}
      >
        <SelectTrigger
          id={triggerId}
          className="min-w-0 flex-1 basis-56 bg-background"
        >
          <SelectValue placeholder={t("select_diagnostic_report_type")} />
        </SelectTrigger>
        <SelectContent>
          {availableReportCodes.map((code) => (
            <SelectItem key={reportCodeKey(code)} value={reportCodeKey(code)}>
              <span className="truncate">
                {code.display} ({code.code})
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="ml-auto flex items-center gap-2">
        {availableReportCodes.length !== 1 && (
          <Button
            variant="ghost"
            onClick={() => setSelectedCode(null)}
            disabled={!effectiveSelectedCode}
          >
            {t("clear")}
          </Button>
        )}
        <Button
          onClick={() => {
            if (!effectiveSelectedCode) return;
            onCreateReport(effectiveSelectedCode);
            setSelectedCode(null);
          }}
          disabled={
            disableEdit || !hasCollectedSpecimens || !effectiveSelectedCode
          }
        >
          <Plus className="size-4" />
          {t("create_report")}
        </Button>
        {onDismiss && (
          <Button
            aria-label={t("close")}
            onClick={() => {
              onDismiss();
              setSelectedCode(null);
            }}
            variant="ghost"
            size="icon"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
