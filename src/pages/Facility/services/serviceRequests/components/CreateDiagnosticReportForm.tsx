import { ChevronDown, FileUp, Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { PLUGIN_Component } from "@/PluginEngine";
import { Code } from "@/types/base/code/code";

import { ReportTypePicker } from "./ReportTypePicker";

export const CreateDiagnosticReportForm = ({
  disableEdit,
  serviceRequestId,
  handleCreateReport,
  hasCollectedSpecimens,
  isMultipleDiagnosticReport,
  availableReportCodes,
}: {
  disableEdit: boolean;
  serviceRequestId: string;
  handleCreateReport: (code?: Code) => void;
  hasCollectedSpecimens: boolean;
  isMultipleDiagnosticReport: boolean;
  availableReportCodes: Code[];
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const { t } = useTranslation();

  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={setIsExpanded}
      className="overflow-hidden rounded-lg border border-border bg-white shadow-xs"
    >
      <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between gap-2 px-4 py-3 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring sm:px-5">
        <span className="font-semibold text-foreground">
          {t("test_results_entry")}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "mx-1.5 size-4 shrink-0 text-soft-foreground transition-transform",
            isExpanded && "rotate-180",
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t border-border px-4 py-3 sm:px-5">
          <PLUGIN_Component
            __name="ServiceRequestAction"
            serviceRequestId={serviceRequestId}
          />
          <div className="flex flex-col gap-2 rounded-md border border-dashed border-border bg-background p-2 sm:flex-row sm:items-center sm:gap-3">
            <div className="flex min-w-0 flex-1 items-start gap-2 px-1 text-sm text-muted-foreground">
              <FileUp aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <div className="min-w-0">
                <p>
                  {!hasCollectedSpecimens
                    ? t("collect_specimen_before_report")
                    : t("no_test_results_recorded")}
                </p>
                {isMultipleDiagnosticReport && hasCollectedSpecimens && (
                  <p className="text-sm">{t("select_report_type_to_create")}</p>
                )}
              </div>
            </div>
            {isMultipleDiagnosticReport ? (
              <ReportTypePicker
                availableReportCodes={availableReportCodes}
                hasCollectedSpecimens={hasCollectedSpecimens}
                disableEdit={disableEdit}
                onCreateReport={handleCreateReport}
                className="border-0 bg-transparent p-0 sm:flex-[1.4]"
              />
            ) : (
              <Button
                onClick={() => handleCreateReport()}
                disabled={disableEdit || !hasCollectedSpecimens}
                className="self-end sm:self-auto"
              >
                <Plus className="size-4" />
                {t("create_report")}
              </Button>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
