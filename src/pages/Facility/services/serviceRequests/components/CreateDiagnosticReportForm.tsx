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
        "shadow-none border-gray-300 rounded-lg bg-white",
        isExpanded && "bg-gray-100",
      )}
    >
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardHeader className="px-2 py-4">
          <div className="flex flex-row justify-between items-start sm:items-center gap-4 sm:gap-2 rounded-md">
            <div className="flex items-center gap-2">
              <CardTitle>
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 text-left"
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ")
                        event.stopPropagation();
                    }}
                  >
                    <NotepadText className="size-6 text-gray-950 font-normal text-base stroke-[1.5px]" />{" "}
                    <span className="text-base/9 text-gray-950 font-medium">
                      {t("test_results_entry")}
                    </span>
                  </button>
                </CollapsibleTrigger>
              </CardTitle>
            </div>
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-10"
                  aria-label={isExpanded ? t("collapse") : t("expand")}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ")
                      event.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                >
                  {isExpanded ? (
                    <ChevronsDownUp className="size-5" />
                  ) : (
                    <ChevronsUpDown className="size-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="px-2 bg-gray-100">
            <PLUGIN_Component
              __name="ServiceRequestAction"
              serviceRequestId={serviceRequestId}
            />

            <div className="flex flex-col gap-1 bg-gray-100 rounded-lg p-1">
              <div className="flex flex-col justify-center items-center rounded-lg bg-gray-500/3 p-3 border border-gray-200 gap-2">
                <FileUp size={24} className="text-gray-600" />
                <p className="mt-2 text-sm text-gray-700 text-center">
                  {!hasCollectedSpecimens
                    ? t("collect_specimen_before_report")
                    : t("no_test_results_recorded")}
                </p>
                {isMultipleDiagnosticReport && (
                  <p className="mt-2 text-sm text-gray-700 text-center">
                    {t("select_report_type_to_create")}
                  </p>
                )}
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
