import { Plus, X } from "lucide-react";
import { useState } from "react";
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
import { Code } from "@/types/base/code/code";

import { reportCodeKey } from "./diagnosticReportCreation";

export function ReportTypePicker({
  availableReportCodes,
  hasCollectedSpecimens,
  disableEdit,
  onCreateReport,
  onDismiss,
}: {
  availableReportCodes: Code[];
  hasCollectedSpecimens: boolean;
  disableEdit: boolean;
  onCreateReport: (code: Code) => void;
  onDismiss?: () => void;
}) {
  const { t } = useTranslation();
  const [selectedCode, setSelectedCode] = useState<Code | null>(null);

  return (
    <div className="flex flex-col items-stretch gap-2 rounded-lg border border-gray-200 bg-gray-100 p-4">
      {onDismiss && (
        <Button
          aria-label={t("close")}
          onClick={() => {
            onDismiss();
            setSelectedCode(null);
          }}
          variant="ghost"
          size="icon"
          className="self-end"
        >
          <X className="size-4" />
        </Button>
      )}
      <div className="w-full flex-1 space-y-2">
        <Label className="text-sm font-medium text-gray-950">
          {t("select_diagnostic_report_type")}
        </Label>
        <Select
          value={selectedCode ? reportCodeKey(selectedCode) : ""}
          onValueChange={(value) => {
            const code = availableReportCodes.find(
              (c) => reportCodeKey(c) === value,
            );
            setSelectedCode(code ?? null);
          }}
          disabled={!hasCollectedSpecimens || disableEdit}
        >
          <SelectTrigger className="w-full bg-white">
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
      </div>
      <div className="flex ml-auto items-center gap-2">
        <Button
          variant="ghost"
          className="underline"
          onClick={() => setSelectedCode(null)}
          disabled={!selectedCode}
        >
          {t("clear")}
        </Button>
        <Button
          onClick={() => {
            if (!selectedCode) return;
            onCreateReport(selectedCode);
            setSelectedCode(null);
          }}
          disabled={disableEdit || !hasCollectedSpecimens || !selectedCode}
          className="w-full sm:w-auto"
        >
          <Plus className="size-4 mr-2" />
          {t("create_report")}
        </Button>
      </div>
    </div>
  );
}
