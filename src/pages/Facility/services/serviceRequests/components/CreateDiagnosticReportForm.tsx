import {
  ChevronsDownUp,
  ChevronsUpDown,
  FileUp,
  NotepadText,
  Plus,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card
      className={cn(
        "shadow-none border-border rounded-lg bg-background",
        isExpanded && "bg-muted",
      )}
    >
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardHeader className="p-2">
          <CollapsibleTrigger className="flex w-full flex-row justify-between items-start sm:items-center gap-4 sm:gap-2 rounded-md text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
            <div className="flex items-center gap-2">
              <CardTitle className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "flex items-center justify-center bg-muted p-2 rounded-lg",
                    isExpanded && "bg-accent",
                  )}
                >
                  <NotepadText className="size-6 text-muted-foreground stroke-[1.5px]" />
                </span>
                <span className="text-base/9 text-foreground font-medium">
                  {t("test_results_entry")}
                </span>
              </CardTitle>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {isExpanded ? (
                <ChevronsDownUp className="size-4 mx-3" />
              ) : (
                <ChevronsUpDown className="size-4 mx-3" />
              )}
            </div>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="px-2 pb-2 bg-muted">
            <PLUGIN_Component
              __name="ServiceRequestAction"
              serviceRequestId={serviceRequestId}
            />

            <div className="flex flex-col gap-2 bg-muted/20 rounded-lg">
              <Card className="flex flex-col items-center justify-center py-4 text-center border-dashed rounded-md shadow-none">
                <div className="rounded-lg bg-muted p-3 mb-3">
                  <FileUp className="size-5 text-muted-foreground" />
                </div>
                <h5 className="font-medium mb-1">
                  {!hasCollectedSpecimens
                    ? t("collect_specimen_before_report")
                    : t("no_test_results_recorded")}
                </h5>

                <p className="text-sm text-muted-foreground">
                  {isMultipleDiagnosticReport &&
                    hasCollectedSpecimens &&
                    t("select_report_type_to_create")}
                </p>

                <div className="mt-5">
                  {!isMultipleDiagnosticReport && (
                    <Button
                      onClick={() => handleCreateReport()}
                      disabled={disableEdit || !hasCollectedSpecimens}
                      className="w-full sm:w-auto"
                    >
                      <Plus className="size-4 mr-2" />
                      {t("create_report")}
                    </Button>
                  )}
                </div>
              </Card>
              {isMultipleDiagnosticReport && (
                <ReportTypePicker
                  availableReportCodes={availableReportCodes}
                  hasCollectedSpecimens={hasCollectedSpecimens}
                  disableEdit={disableEdit}
                  onCreateReport={handleCreateReport}
                />
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
