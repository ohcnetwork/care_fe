import {
  Archive,
  Download,
  EllipsisVertical,
  Eye,
  FileHeart,
  FileText,
  LucideIcon,
  Plus,
  RefreshCw,
  SearchIcon,
} from "lucide-react";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Frame,
  FrameFooter,
  FrameHeader,
  FramePanel,
} from "@/components/ui/frame";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TooltipComponent } from "@/components/ui/tooltip";

import Pagination from "@/components/Common/Pagination";
import { ArchivedBadge } from "@/components/Files/ArchivedBadge";
import { ArchiveStatusFilter } from "@/components/Files/FileFilters";

import useFilters from "@/hooks/useFilters";
import useReportManager from "@/hooks/useReportManager";

import { formatDateTime } from "@/Utils/utils";
import TemplateReportSheet from "@/pages/Encounters/TemplateBuilder/TemplateReportSheet";
import { useCurrentFacilitySilently } from "@/pages/Facility/utils/useCurrentFacility";
import { ReportReadList, ReportType } from "@/types/emr/report/report";

interface ReportTabProps {
  associatingId: string;
  reportType?: ReportType;
  facilityId?: string;
  patientId?: string;
  encounterId?: string;
}

const REPORT_TYPE_ICONS: Partial<Record<string, LucideIcon>> = {
  [ReportType.DISCHARGE_SUMMARY]: FileHeart,
};

const PAGE_SIZE = 15;

export function ReportSubTab({
  associatingId,
  reportType,
  facilityId,
  patientId,
  encounterId,
}: ReportTabProps) {
  const { t } = useTranslation();
  const { facility } = useCurrentFacilitySilently();
  const { qParams, updateQuery, updatePage } = useFilters({
    limit: PAGE_SIZE,
    disableCache: true,
  });
  const page = Number(qParams.page) || 1;

  const {
    reports,
    count: totalCount,
    isLoading,
    isFetching,
    viewFile,
    downloadFile,
    archiveReport,
    refetch,
    Dialogs,
  } = useReportManager({
    associatingId,
    enabled: true,
    reportType,
    queryParams: {
      name: qParams.name || undefined,
      is_archived: qParams.is_archived,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    },
  });

  const isFiltered = !!qParams.name || qParams.is_archived !== undefined;
  const canNavigateToPreview = !!(facilityId && patientId && encounterId);

  const handleView = (report: ReportReadList) => {
    if (canNavigateToPreview) {
      navigate(
        `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/report/${report.id}`,
      );
    } else {
      viewFile(report);
    }
  };

  return (
    <>
      {Dialogs}

      <Frame spacing="sm" className="min-w-0">
        <FrameHeader className="flex-row flex-wrap items-center gap-2">
          <InputGroup className="bg-background sm:w-auto sm:max-w-xs sm:flex-1">
            <InputGroupInput
              aria-label={t("search_reports")}
              placeholder={t("search_reports")}
              value={qParams.name || ""}
              onChange={(e) => updateQuery({ name: e.target.value })}
            />
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
          </InputGroup>
          <ArchiveStatusFilter
            value={qParams.is_archived}
            onChange={(is_archived) => updateQuery({ is_archived })}
          />
          <TooltipComponent content={t("refresh")}>
            <Button
              variant="outline"
              size="icon"
              aria-label={t("refresh")}
              disabled={isFetching}
              onClick={async () => {
                await refetch();
                toast.success(t("refreshed"));
              }}
            >
              <RefreshCw className={cn(isFetching && "animate-spin")} />
            </Button>
          </TooltipComponent>
          {facility && (
            <div className="ml-auto">
              <TemplateReportSheet
                facilityId={facility.id}
                associatingId={associatingId}
                permissions={facility.permissions ?? []}
                reportType={reportType}
                trigger={
                  <Button variant="outline">
                    <Plus />
                    {t("generate_report")}
                  </Button>
                }
                onSuccess={() => refetch()}
              />
            </div>
          )}
        </FrameHeader>

        <FramePanel className="min-w-0 overflow-hidden p-0 **:data-[slot=table-container]:rounded-none **:data-[slot=table-container]:border-0">
          {isLoading ? (
            <div
              className="space-y-2 p-3"
              role="status"
              aria-label={t("loading")}
            >
              {Array.from({ length: 5 }, (_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : !reports.length ? (
            <Empty className="p-6 sm:p-10">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileText />
                </EmptyMedia>
                <EmptyTitle>{t("no_reports_found")}</EmptyTitle>
                <EmptyDescription>
                  {t(
                    isFiltered
                      ? "try_adjusting_your_filters_or_search"
                      : "no_reports_found_description",
                  )}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">{t("report_name")}</TableHead>
                  <TableHead className="hidden w-[22%] px-4 md:table-cell">
                    {t("type")}
                  </TableHead>
                  <TableHead className="hidden w-[16%] px-4 md:table-cell">
                    {t("date")}
                  </TableHead>
                  <TableHead className="w-14 pr-4 text-right md:w-40">
                    <span className="sr-only">{t("actions")}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => {
                  const Icon =
                    REPORT_TYPE_ICONS[report.report_type] ?? FileText;

                  return (
                    <TableRow
                      key={report.id}
                      className={cn(
                        "hover:bg-muted/40",
                        report.is_archived && "bg-muted/30",
                      )}
                    >
                      <TableCell className="relative py-3 pl-4">
                        <button
                          type="button"
                          onClick={() => handleView(report)}
                          aria-label={`${t("view")} ${report.name}`}
                          className="absolute inset-0 active:bg-muted/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring md:hidden"
                        />
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className={cn(
                              "hidden size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/50 text-muted-foreground md:flex",
                              report.is_archived && "opacity-60",
                            )}
                          >
                            <Icon className="size-4" />
                          </span>
                          <div className="min-w-0">
                            <div className="flex min-w-0 items-center gap-2">
                              <span
                                className={cn(
                                  "truncate font-medium",
                                  report.is_archived
                                    ? "text-muted-foreground"
                                    : "text-foreground",
                                )}
                                title={report.name}
                              >
                                {report.name}
                              </span>
                              {report.is_archived && (
                                <ArchivedBadge
                                  className="hidden md:inline-flex"
                                  reason={report.archive_reason}
                                  archivedBy={report.archived_by}
                                  archivedAt={report.archived_datetime}
                                />
                              )}
                            </div>
                            <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground md:hidden">
                              {report.is_archived && (
                                <ArchivedBadge
                                  className="relative z-10"
                                  reason={report.archive_reason}
                                  archivedBy={report.archived_by}
                                  archivedAt={report.archived_datetime}
                                />
                              )}
                              <span className="truncate">
                                {[
                                  t(report.report_type),
                                  formatDateTime(
                                    report.created_date,
                                    "DD MMM YYYY",
                                  ),
                                ].join(" · ")}
                              </span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden truncate px-4 text-muted-foreground md:table-cell">
                        {t(report.report_type)}
                      </TableCell>
                      <TableCell className="hidden px-4 text-muted-foreground md:table-cell">
                        <TooltipComponent
                          content={formatDateTime(
                            report.created_date,
                            "DD MMM YYYY, hh:mm A",
                          )}
                        >
                          <span>
                            {formatDateTime(report.created_date, "DD MMM YYYY")}
                          </span>
                        </TooltipComponent>
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <ReportRowActions
                          report={report}
                          onView={() => handleView(report)}
                          onDownload={() => downloadFile(report)}
                          onArchive={() => archiveReport(report)}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </FramePanel>

        {totalCount > 0 && (
          <FrameFooter className="flex-row flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {t("reports_result_range", {
                start: (page - 1) * PAGE_SIZE + 1,
                end: Math.min(page * PAGE_SIZE, totalCount),
                total: totalCount,
              })}
            </p>
            {totalCount > PAGE_SIZE && (
              <Pagination
                data={{ totalCount }}
                cPage={page}
                defaultPerPage={PAGE_SIZE}
                onChange={(page) => updatePage(page)}
                className=""
              />
            )}
          </FrameFooter>
        )}
      </Frame>
    </>
  );
}

interface ReportRowActionsProps {
  report: ReportReadList;
  onView: () => void;
  onDownload: () => void;
  onArchive: () => void;
}

function ReportRowActions({
  report,
  onView,
  onDownload,
  onArchive,
}: ReportRowActionsProps) {
  const { t } = useTranslation();

  if (report.is_archived) {
    // Keep the View button in the same slot as on active rows: archived
    // entries have no menu, so reserve the space the menu trigger takes.
    return (
      <div className="flex items-center justify-end gap-1.5">
        <Button
          variant="outline"
          size="sm"
          className="hidden md:inline-flex"
          onClick={onView}
        >
          <Eye />
          {t("view")}
        </Button>
        <span aria-hidden className="size-9 shrink-0" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      <Button
        variant="outline"
        size="sm"
        className="hidden md:inline-flex"
        onClick={onView}
      >
        <Eye />
        {t("view")}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={t("more_actions")}>
            <EllipsisVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-40">
          <DropdownMenuItem onSelect={onDownload}>
            <Download />
            {t("download")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={onArchive}>
            <Archive />
            {t("archive")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
