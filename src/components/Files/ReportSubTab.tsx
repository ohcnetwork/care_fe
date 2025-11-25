import dayjs from "dayjs";
import { SearchIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon, { IconName } from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
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

import useFilters from "@/hooks/useFilters";
import useReportManager from "@/hooks/useReportManager";

import { formatName } from "@/Utils/utils";
import TemplateReportSheet from "@/pages/Encounters/TemplateBuilder/TemplateReportSheet";
import { EncounterRead } from "@/types/emr/encounter/encounter";
import { PatientRead } from "@/types/emr/patient/patient";
import { ReportRead, ReportReadList } from "@/types/emr/report/report";

interface ReportTabProps {
  encounter?: EncounterRead;
  patient?: PatientRead;
  associatingId: string;
  canEdit?: boolean;
  permissions?: string[];
}

export function ReportSubTab({
  encounter,
  patient,
  associatingId,
  canEdit = false,
  permissions = [],
}: ReportTabProps) {
  const { t } = useTranslation();
  const { qParams, updateQuery, Pagination } = useFilters({
    limit: 15,
    disableCache: true,
  });

  const {
    reports,
    isLoading: reportsLoading,
    downloadReport,
    archiveReport,
    refetch,
    Dialogs,
  } = useReportManager({
    associatingId,
    enabled: true,
  });

  const [searchTerm, setSearchTerm] = useState("");

  // Filter reports based on search term and archived status
  const filteredReports = reports.filter((report) => {
    const matchesSearch = report.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesArchived =
      qParams.is_archived === undefined
        ? !report.is_archived
        : qParams.is_archived === "true"
          ? report.is_archived
          : !report.is_archived;
    return matchesSearch && matchesArchived;
  });

  const getReportTypeIcon = (reportType: string): IconName => {
    const iconMap: Record<string, IconName> = {
      discharge_summary: "l-file-medical-alt",
      lab_report: "l-flask",
      prescription: "l-prescription-bottle",
    };
    return iconMap[reportType] || "l-file-alt";
  };

  const DetailButtons = ({ report }: { report: ReportReadList }) => {
    return (
      <div className="flex flex-row items-center justify-end gap-2">
        <Button
          variant="secondary"
          onClick={() => downloadReport(report.id)}
          size="sm"
        >
          <span className="flex flex-row items-center gap-1">
            <CareIcon icon="l-arrow-circle-down" />
            {t("download")}
          </span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm">
              <CareIcon icon="l-ellipsis-h" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canEdit && (
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
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  const getArchivedMessage = (report: ReportReadList) => {
    return (
      <div className="flex flex-col items-end gap-1">
        <Badge variant="destructive" className="text-xs">
          {t("archived")}
        </Badge>
        {report.archived_by && (
          <span className="text-xs text-gray-500">
            {t("by")} {formatName(report.archived_by)}
          </span>
        )}
        {report.archived_datetime && (
          <span className="text-xs text-gray-500">
            {dayjs(report.archived_datetime).format("DD MMM YYYY, hh:mm A")}
          </span>
        )}
      </div>
    );
  };

  const FilterButton = () => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" className="text-sm text-secondary-800">
            <span className="flex flex-row items-center gap-1">
              <CareIcon icon="l-filter" />
              <span>{t("filter")}</span>
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-[calc(100vw-2.5rem)] sm:w-[calc(100%-2rem)]"
        >
          <DropdownMenuItem
            className="text-primary-900"
            onClick={() => {
              updateQuery({ is_archived: "false" });
            }}
          >
            <span>{t("active_reports")}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-primary-900"
            onClick={() => {
              updateQuery({ is_archived: "true" });
            }}
          >
            <span>{t("archived_reports")}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const FilterBadges = () => {
    if (typeof qParams.is_archived === "undefined") return null;
    return (
      <div className="flex flex-row gap-2 mt-2 mx-2">
        <Badge
          variant="outline"
          className="cursor-pointer"
          onClick={() => updateQuery({ is_archived: undefined })}
        >
          {t(
            qParams.is_archived === "false"
              ? "active_reports"
              : "archived_reports",
          )}
          <CareIcon icon="l-times-circle" className="ml-1" />
        </Badge>
      </div>
    );
  };

  const RenderCards = () => (
    <div className="xl:hidden flex flex-col gap-3 pt-3 px-2">
      {filteredReports && filteredReports.length > 0
        ? filteredReports.map((report) => {
            return (
              <Card
                key={report.id}
                className={cn(
                  report.is_archived ? "bg-white/50 opacity-70" : "bg-white",
                )}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="p-2 rounded-full bg-gray-100 shrink-0">
                        <CareIcon
                          icon={getReportTypeIcon(report.report_type)}
                          className="text-xl"
                        />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
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
                    <div>
                      <div className="text-gray-500">{t("uploaded_by")}</div>
                      <div className="font-medium">
                        {report.uploaded_by
                          ? formatName(report.uploaded_by)
                          : "-"}
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
          })
        : !reportsLoading && (
            <div className="text-center py-8 text-gray-500">
              {t("no_reports_found")}
            </div>
          )}
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
            <TableHead className="w-[20%] rounded-y bg-white">
              {t("uploaded_by")}
            </TableHead>
            <TableHead className="w-[20%] text-right rounded-r bg-white"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredReports && filteredReports.length > 0
            ? filteredReports.map((report) => {
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
                        "rounded-y-md group-hover:bg-transparent",
                        report.is_archived ? "bg-white/50" : "bg-white",
                      )}
                    >
                      {report.uploaded_by
                        ? formatName(report.uploaded_by)
                        : "-"}
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
                        <DetailButtons report={report} />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            : !reportsLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    {t("no_reports_found")}
                  </TableCell>
                </TableRow>
              )}
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
          <FilterButton />
        </div>
        {encounter && (
          <TemplateReportSheet
            facilityId={encounter.facility?.id || ""}
            encounterId={encounter.id}
            patientId={patient?.id}
            associatingId={associatingId}
            reportType="discharge_summary"
            permissions={permissions}
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

      <FilterBadges />

      {/* Report List */}
      <RenderCards />
      <RenderTable />

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
