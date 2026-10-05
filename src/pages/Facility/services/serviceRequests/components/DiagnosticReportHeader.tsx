import {
  ChevronsDownUp,
  ChevronsUpDown,
  type LucideIcon,
  MoreVertical,
} from "lucide-react";
import { useTranslation } from "react-i18next";

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
import { cn } from "@/lib/utils";
import {
  DIAGNOSTIC_REPORT_STATUS_COLORS,
  DiagnosticReportRead,
} from "@/types/emr/diagnosticReport/diagnosticReport";
import { formatName } from "@/Utils/utils";

import { ObservationHistorySheet } from "./ObservationHistorySheet";

interface DiagnosticReportHeaderProps {
  report: DiagnosticReportRead;
  title?: string;
  updatedBy?: DiagnosticReportRead["updated_by"];
  icon: LucideIcon;
  isExpanded: boolean;
  patientId?: string;
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

  return (
    <CollapsibleTrigger asChild>
      <CardHeader className="cursor-pointer p-2">
        <div className="flex items-start sm:items-center justify-between gap-3 sm:gap-2 rounded-md">
          <div className="flex flex-1 items-center gap-2 min-w-0">
            <CardTitle className="min-w-0 w-full">
              <div className="flex items-start sm:items-center gap-2 min-w-0 w-full text-left">
                <span
                  className={cn(
                    "flex items-center justify-center bg-gray-100 p-2.5 rounded-lg",
                    isExpanded && "bg-gray-200",
                  )}
                >
                  <ReportIcon className="size-6 text-gray-600 stroke-[1.5px]" />
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="text-base text-gray-950 font-semibold wrap-break-word">
                    {title}
                  </span>

                  {updatedBy && (
                    <span className="text-sm text-gray-700 font-normal truncate">
                      {formatName(updatedBy)}
                    </span>
                  )}

                  <div className="mt-1.5 sm:hidden">
                    <Badge
                      variant={DIAGNOSTIC_REPORT_STATUS_COLORS[report.status]}
                    >
                      {t(report.status)}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardTitle>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-1 shrink-0">
            <Badge
              variant={DIAGNOSTIC_REPORT_STATUS_COLORS[report.status]}
              className="hidden sm:inline-flex"
            >
              {t(report.status)}
            </Badge>
            {isExpanded ? (
              <ChevronsDownUp className="size-4 mx-2" />
            ) : (
              <ChevronsUpDown className="size-4 mx-2" />
            )}
            {hasObservationHistory && patientId && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t("view_observation_history")}
                    onClick={(event) => event.stopPropagation()}
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
                      onSelect={(event) => event.preventDefault()}
                      onClick={(event) => event.stopPropagation()}
                    >
                      {t("view_observation_history")}
                    </DropdownMenuItem>
                  </ObservationHistorySheet>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>
    </CollapsibleTrigger>
  );
}
