import {
  ChevronsDownUp,
  ChevronsUpDown,
  MoreVertical,
  NotepadText,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Avatar } from "@/components/Common/Avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DIAGNOSTIC_REPORT_STATUS_COLORS,
  DiagnosticReportRead,
} from "@/types/emr/diagnosticReport/diagnosticReport";
import { formatName } from "@/Utils/utils";

import { DiagnosticReportTimestamps } from "./DiagnosticReportTimestamps";
import { ObservationHistorySheet } from "./ObservationHistorySheet";

interface DiagnosticReportItemHeaderProps {
  report: DiagnosticReportRead;
  fullReport?: DiagnosticReportRead;
  patientId: string;
  isExpanded: boolean;
  isMultipleDiagnosticReport: boolean;
  hasObservationHistory: boolean;
}

export function DiagnosticReportItemHeader({
  report,
  fullReport,
  patientId,
  isExpanded,
  isMultipleDiagnosticReport,
  hasObservationHistory,
}: DiagnosticReportItemHeaderProps) {
  const { t } = useTranslation();
  return (
    <CardHeader className="px-2 py-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-2 rounded-md">
        <div className="flex flex-1 items-center gap-2 min-w-0 w-full sm:w-auto">
          <CardTitle className="min-w-0 w-full">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 min-w-0 w-full text-left"
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.stopPropagation();
                  }
                }}
              >
                <NotepadText className="size-6 shrink-0 text-gray-950 stroke-[1.5px]" />
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-base text-gray-950 font-medium wrap-break-word">
                    {isMultipleDiagnosticReport
                      ? report.code?.display
                      : report.service_request?.title}
                  </span>
                  <DiagnosticReportTimestamps report={fullReport ?? report} />
                </div>
              </button>
            </CollapsibleTrigger>
          </CardTitle>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-5 w-full sm:w-auto">
          {fullReport && (
            <div
              className="flex items-center gap-2 min-w-0"
              title={t("created_by_user", {
                name: formatName(fullReport.created_by),
              })}
            >
              <Avatar
                name={formatName(fullReport.created_by, true)}
                className="size-5 shrink-0"
                imageUrl={fullReport.created_by.profile_picture_url}
              />
              <span className="text-sm text-gray-700 font-medium truncate">
                {formatName(fullReport.created_by)}
              </span>
            </div>
          )}

          <div className="flex items-center gap-1 shrink-0">
            <Badge variant={DIAGNOSTIC_REPORT_STATUS_COLORS[report.status]}>
              {t(report.status)}
            </Badge>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-10"
                aria-label={isExpanded ? t("collapse") : t("expand")}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.stopPropagation();
                  }
                }}
              >
                {isExpanded ? (
                  <ChevronsDownUp className="size-5" />
                ) : (
                  <ChevronsUpDown className="size-5" />
                )}
              </Button>
            </CollapsibleTrigger>
            {hasObservationHistory && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t("view_observation_history")}
                  >
                    <MoreVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <ObservationHistorySheet
                    patientId={patientId}
                    diagnosticReportId={report.id}
                  >
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      {t("view_observation_history")}
                    </DropdownMenuItem>
                  </ObservationHistorySheet>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </CardHeader>
  );
}
