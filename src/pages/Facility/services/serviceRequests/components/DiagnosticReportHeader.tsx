import { ChevronDown, type LucideIcon, MoreVertical } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  DIAGNOSTIC_REPORT_STATUS_COLORS,
  DiagnosticReportRead,
} from "@/types/emr/diagnosticReport/diagnosticReport";
import { formatName } from "@/Utils/utils";

import { DiagnosticReportTimestamps } from "./DiagnosticReportTimestamps";
import { ObservationHistorySheet } from "./ObservationHistorySheet";

interface DiagnosticReportHeaderProps {
  report: DiagnosticReportRead;
  title?: string;
  updatedBy?: DiagnosticReportRead["updated_by"];
  icon: LucideIcon;
  isExpanded: boolean;
  patientId: string;
  hasObservationHistory?: boolean;
}

export function DiagnosticReportHeader({
  report,
  title,
  updatedBy,
  icon: ReportIcon,
  isExpanded,
  patientId,
  hasObservationHistory = false,
}: DiagnosticReportHeaderProps) {
  const { t } = useTranslation();
  const statusBadge = (className: string) => (
    <Badge
      variant={DIAGNOSTIC_REPORT_STATUS_COLORS[report.status]}
      className={className}
    >
      {t(report.status)}
    </Badge>
  );

  return (
    <div className="flex items-center gap-1 px-4 py-2.5 sm:px-5">
      <CollapsibleTrigger
        aria-label={`${t(isExpanded ? "collapse" : "expand")} ${title ?? t("diagnostic_report")}`}
        className="flex min-w-0 flex-1 cursor-pointer items-start gap-2.5 rounded-md text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <ReportIcon
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-soft-foreground"
        />
        <span className="block min-w-0 flex-1">
          <span className="block text-sm font-semibold wrap-break-word text-foreground">
            {title}
          </span>
          <span className="flex min-w-0 flex-col text-sm text-soft-foreground sm:flex-row sm:flex-wrap sm:gap-x-1.5">
            {updatedBy && (
              <span className="truncate">{formatName(updatedBy)}</span>
            )}
            {updatedBy && !isExpanded && (
              <span aria-hidden="true" className="hidden sm:inline">
                ·
              </span>
            )}
            {!isExpanded && (
              <DiagnosticReportTimestamps
                report={report}
                compact
                className=""
              />
            )}
          </span>
          {statusBadge("mt-1.5 sm:hidden")}
        </span>
        {statusBadge("hidden shrink-0 self-center sm:inline-flex")}
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "mx-1.5 size-4 shrink-0 self-center text-soft-foreground transition-transform",
            isExpanded && "rotate-180",
          )}
        />
      </CollapsibleTrigger>
      {hasObservationHistory && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("view_observation_history")}
              className="shrink-0 text-soft-foreground"
            >
              <MoreVertical />
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
    </div>
  );
}
