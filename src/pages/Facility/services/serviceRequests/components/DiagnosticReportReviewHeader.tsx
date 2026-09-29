import { ChevronDown, ChevronUp, FileCheck2, MoreVertical } from "lucide-react";
import { useId } from "react";
import { useTranslation } from "react-i18next";

import { Avatar } from "@/components/Common/Avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardHeader } from "@/components/ui/card";
import { CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { formatName } from "@/Utils/utils";
import { ObservationHistorySheet } from "@/pages/Facility/services/serviceRequests/components/ObservationHistorySheet";
import {
  DIAGNOSTIC_REPORT_STATUS_COLORS,
  DiagnosticReportRead,
} from "@/types/emr/diagnosticReport/diagnosticReport";

import { DiagnosticReportTimestamps } from "./DiagnosticReportTimestamps";

interface DiagnosticReportReviewHeaderProps {
  report: DiagnosticReportRead;
  patientId: string;
  isExpanded: boolean;
  showObservationHistory: boolean;
  isEmpty: boolean;
}

export function DiagnosticReportReviewHeader({
  report,
  patientId,
  isExpanded,
  showObservationHistory,
  isEmpty,
}: DiagnosticReportReviewHeaderProps) {
  const { t } = useTranslation();
  const reportTitle = report.code?.display ?? report.service_request?.title;
  const timestampsId = useId();
  const statusId = useId();

  return (
    <CardHeader className="flex-row items-start gap-2 space-y-0 p-4">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="grid flex-1 grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-3 min-w-0 text-left rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"
          aria-label={`${t(isExpanded ? "collapse" : "expand")} ${reportTitle ?? t("diagnostic_report")}`}
          aria-describedby={`${timestampsId} ${statusId}`}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.stopPropagation();
            }
          }}
        >
          <span className="flex items-start gap-2.5 min-w-0">
            <FileCheck2 className="mt-0.5 size-5 shrink-0 text-gray-500 stroke-[1.5px]" />
            <span className="flex flex-col gap-1 min-w-0">
              <span className="text-sm leading-5 text-gray-950 font-semibold wrap-break-word sm:text-base sm:leading-6">
                {reportTitle}
              </span>
              <span id={timestampsId} className="flex">
                <DiagnosticReportTimestamps
                  report={report}
                  compact={!isExpanded}
                />
              </span>
              {isEmpty && (
                <span className="text-xs text-gray-500 font-normal">
                  {t("no_observations_entered")}
                </span>
              )}
            </span>
          </span>
          <span className="col-span-2 row-start-2 flex items-center justify-between gap-3 min-w-0 border-t border-gray-100 pt-3 sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:border-0 sm:pt-0 sm:gap-4">
            {report.created_by && (
              <span
                className="flex items-center gap-2 min-w-0"
                title={t("created_by_user", {
                  name: formatName(report.created_by),
                })}
              >
                <Avatar
                  name={formatName(report.created_by, true)}
                  className="size-5 shrink-0"
                  imageUrl={report.created_by.profile_picture_url}
                />
                <span className="text-xs text-gray-600 font-normal truncate">
                  {formatName(report.created_by)}
                </span>
              </span>
            )}
            <Badge
              id={statusId}
              variant={DIAGNOSTIC_REPORT_STATUS_COLORS[report.status]}
              className="ml-auto shrink-0 px-2 text-xs"
            >
              {t(report.status)}
            </Badge>
          </span>
          {isExpanded ? (
            <ChevronUp className="col-start-2 row-start-1 mt-0.5 size-4 text-gray-500 sm:col-start-3 sm:mt-0" />
          ) : (
            <ChevronDown className="col-start-2 row-start-1 mt-0.5 size-4 text-gray-500 sm:col-start-3 sm:mt-0" />
          )}
        </button>
      </CollapsibleTrigger>
      {showObservationHistory && (
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
              <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                {t("view_observation_history")}
              </DropdownMenuItem>
            </ObservationHistorySheet>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </CardHeader>
  );
}
