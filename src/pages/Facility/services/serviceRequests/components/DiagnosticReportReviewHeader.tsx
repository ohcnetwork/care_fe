import {
  ChevronsDownUp,
  ChevronsUpDown,
  FileCheck2,
  MoreVertical,
} from "lucide-react";
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

  return (
    <CardHeader className="flex-row items-center gap-2 px-2 py-4">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex flex-1 flex-wrap items-center justify-between gap-3 min-w-0 text-left rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          aria-label={`${t(isExpanded ? "collapse" : "expand")} ${reportTitle ?? t("diagnostic_report")}`}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.stopPropagation();
            }
          }}
        >
          <span className="flex w-full items-center gap-2 min-w-0 sm:w-auto sm:flex-1">
            <FileCheck2 className="size-6 shrink-0 text-gray-950 stroke-[1.5px]" />
            <span className="flex flex-col gap-1 min-w-0">
              <span className="text-base text-gray-950 font-medium wrap-break-word">
                {reportTitle}
              </span>
              <DiagnosticReportTimestamps report={report} />
            </span>
          </span>
          <span className="flex flex-wrap items-center gap-3 sm:gap-5">
            {isEmpty && (
              <span className="text-sm text-gray-400 font-medium">
                {t("no_observations_entered")}
              </span>
            )}
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
                <span className="text-sm text-gray-700 font-medium truncate">
                  {formatName(report.created_by)}
                </span>
              </span>
            )}
            <Badge variant={DIAGNOSTIC_REPORT_STATUS_COLORS[report.status]}>
              {t(report.status)}
            </Badge>
            {isExpanded ? (
              <ChevronsDownUp className="size-5" />
            ) : (
              <ChevronsUpDown className="size-5" />
            )}
          </span>
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
