import dayjs from "dayjs";
import { SearchIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon, { IconName } from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TooltipComponent } from "@/components/ui/tooltip";

import Loading from "@/components/Common/Loading";
import { FilterBadges, FilterButton } from "@/components/Files/FileFilters";
import { EmptyState } from "@/components/ui/empty-state";

import useFilters from "@/hooks/useFilters";
import useReportManager from "@/hooks/useReportManager";

import queryClient from "@/Utils/request/queryClient";
import TemplateReportSheet from "@/pages/Encounters/TemplateBuilder/TemplateReportSheet";
import { useCurrentFacilitySilently } from "@/pages/Facility/utils/useCurrentFacility";
import {
  ReportRead,
  ReportReadList,
  ReportType,
} from "@/types/emr/report/report";
import { toast } from "sonner";

interface ReportTabProps {
  associatingId: string;
  reportType?: ReportType;
}

export function ReportSubTab({ associatingId, reportType }: ReportTabProps) {
  const { t } = useTranslation();
  const { facility } = useCurrentFacilitySilently();
  const { qParams, updateQuery, Pagination } = useFilters({
    limit: 15,
    disableCache: true,
  });

  const {
    reports,
    isLoading: reportsLoading,
    viewFile,
    downloadFile,
    archiveReport,
    refetch,
    Dialogs,
  } = useReportManager({
    associatingId,
    enabled: true,
    qParams,
    reportType,
  });

  const [searchTerm, setSearchTerm] = useState("");

  // Filter reports based on search term and archived status
  const filteredReports = reports.filter((report) => {
    const matchesSearch = report.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getReportTypeIcon = (reportType: string): IconName => {
    const iconMap: Record<string, IconName> = {
      discharge_summary: "l-file-medical-alt",
    };
    return iconMap[reportType] || "l-file-alt";
  };

  const DetailButtons = ({ report }: { report: ReportReadList }) => {
    return (
      <div className="flex flex-row gap-2 justify-end">
        <Button
          onClick={() => viewFile(report)}
          variant="secondary"
          className="w-auto flex flex-row justify-stretch items-center"
        >
          <CareIcon icon="l-eye" className="mr-1" />
          <span>{t("view")}</span>
        </Button>
        <div className="flex flex-row items-center justify-end gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary">
                <CareIcon icon="l-ellipsis-h" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild className="text-primary-900">
                <Button
                  size="sm"
                  onClick={() => downloadFile(report)}
                  variant="ghost"
                  className="w-full flex flex-row justify-stretch items-center"
                >
                  <CareIcon icon="l-arrow-circle-down" className="mr-1" />
                  <span>{t("download")}</span>
                </Button>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="text-primary-900">
                <Button
                  size="sm"
                  onClick={() => archiveReport(report as unknown as ReportRead)}
                  variant="ghost"
                  className="w-full flex flex-row justify-stretch items-center"
                >
                  <CareIcon icon="l-archive-alt" className="mr-1" />
                  <span>{t("archive")}</span>
                </Button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  const getArchivedMessage = (report: ReportReadList) => {
    return (
      <div className="flex flex-row gap-2 justify-end">
        <span className="text-gray-200/90 self-center uppercase font-bold">
          {t("archived")}
        </span>
        <Button
          variant="secondary"
          onClick={() => {
            viewFile(report);
          }}
        >
          <span className="flex flex-row items-center gap-1">
            <CareIcon icon="l-archive-alt" />
            {t("view")}
          </span>
        </Button>
      </div>
    );
  };

  const RenderCards = () => (
    <div className="xl:hidden flex flex-col gap-3 pt-3 px-2">
      {filteredReports &&
        filteredReports.length > 0 &&
        filteredReports.map((report) => {
          return (
            <Card
              key={report.id}
              className={cn(
                report.is_archived ? "bg-white/50 opacity-70" : "bg-white",
              )}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="p-2 rounded-full bg-gray-100 shrink-0">
                      <CareIcon
                        icon={getReportTypeIcon(report.report_type)}
                        className="text-xl"
                      />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate w-full">
                        {report.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {t(report.report_type)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">{t("date")}</div>
                    <div className="font-medium">
                      {dayjs(report.created_date).format(
                        "DD MMM YYYY, hh:mm A",
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  {report.is_archived ? (
                    getArchivedMessage(report)
                  ) : (
                    <DetailButtons report={report} />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
    </div>
  );

  const RenderTable = () => (
    <div className="hidden -mt-2 xl:block">
      <Table className="border-separate border-spacing-y-3 mx-2 lg:max-w-[calc(100%-16px)]">
        <TableHeader>
          <TableRow className="shadow rounded overflow-hidden">
            <TableHead className="w-[25%] bg-white rounded-l">
              {t("report_name")}
            </TableHead>
            <TableHead className="w-[15%] rounded-y bg-white">
              {t("type")}
            </TableHead>
            <TableHead className="w-[20%] rounded-y bg-white">
              {t("date")}
            </TableHead>
            <TableHead className="w-[20%] text-right rounded-r bg-white"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredReports &&
            filteredReports.length > 0 &&
            filteredReports.map((report) => {
              return (
                <TableRow
                  key={report.id}
                  className={cn("shadow rounded-md overflow-hidden group")}
                >
                  <TableCell
                    className={cn(
                      "font-medium rounded-l-md rounded-y-md group-hover:bg-transparent",
                      report.is_archived ? "bg-white/50" : "bg-white",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="p-2 rounded-full bg-gray-100 shrink-0">
                        <CareIcon
                          icon={getReportTypeIcon(report.report_type)}
                          className="text-xl"
                        />
                      </span>
                      {report.name && report.name.length > 30 ? (
                        <TooltipComponent content={report.name}>
                          <span className="text-gray-900 truncate block">
                            {report.name}
                          </span>
                        </TooltipComponent>
                      ) : (
                        <span className="text-gray-900 truncate block">
                          {report.name}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell
                    className={cn(
                      "rounded-y-md group-hover:bg-transparent",
                      report.is_archived ? "bg-white/50" : "bg-white",
                    )}
                  >
                    {t(report.report_type)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "rounded-y-md group-hover:bg-transparent",
                      report.is_archived ? "bg-white/50" : "bg-white",
                    )}
                  >
                    <TooltipComponent
                      content={dayjs(report.created_date).format(
                        "DD MMM YYYY, hh:mm A",
                      )}
                    >
                      <span>
                        {dayjs(report.created_date).format("DD MMM YYYY")}
                      </span>
                    </TooltipComponent>
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right rounded-r-md rounded-y-md group-hover:bg-transparent",
                      report.is_archived ? "bg-white/50" : "bg-white",
                    )}
                  >
                    {report.is_archived ? (
                      getArchivedMessage(report)
                    ) : (
                      <div className="flex flex-row gap-2 justify-end">
                        <DetailButtons report={report} />
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
        </TableBody>
      </Table>
    </div>
  );

  if (reportsLoading) {
    return <Loading />;
  }

  return (
    <div className="flex flex-col">
      {/* Header with search and actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 border-b">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-1 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder={t("search_reports")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <FilterButton
            onFilterChange={(filter) => updateQuery(filter)}
            activeLabel={t("active_reports")}
            archivedLabel={t("archived_reports")}
            includeArchivedParam
          />
          <Button
            variant="outline_primary"
            className="min-w-24 sm:min-w-28"
            onClick={async () => {
              await queryClient.invalidateQueries({
                queryKey: ["reports", associatingId],
              });
              toast.success(t("refreshed"));
            }}
          >
            <CareIcon icon="l-sync" className="mr-2" />
            {t("refresh")}
          </Button>
        </div>
        {facility && (
          <TemplateReportSheet
            facilityId={facility.id}
            associatingId={associatingId}
            permissions={facility.permissions ?? []}
            reportType={reportType}
            trigger={
              <Button variant="outline_primary">
                <CareIcon icon="l-plus" className="mr-1" />
                <span>{t("generate_report")}</span>
              </Button>
            }
            onSuccess={() => {
              refetch();
            }}
          />
        )}
      </div>

      <FilterBadges
        isArchived={qParams.is_archived}
        onClearFilter={() =>
          updateQuery({ is_archived: undefined, include_archived: false })
        }
        activeLabel="active_reports"
        archivedLabel="archived_reports"
      />

      {!reportsLoading && filteredReports.length === 0 ? (
        <EmptyState
          icon={<CareIcon icon="l-file-alt" className="text-primary size-6" />}
          title={t("no_reports_found")}
          description={t("no_reports_found_description")}
        />
      ) : (
        <>
          <RenderCards />
          <RenderTable />
        </>
      )}

      {/* Pagination */}
      {filteredReports.length > 0 && (
        <div className="flex justify-center p-4">
          <Pagination totalCount={filteredReports.length} />
        </div>
      )}

      {/* Dialogs */}
      {Dialogs}
    </div>
  );
}
