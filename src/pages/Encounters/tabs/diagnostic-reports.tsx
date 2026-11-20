import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { ArrowRight, Menu } from "lucide-react";
import { useQueryParams } from "raviger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useInView } from "react-intersection-observer";

import Autocomplete from "@/components/ui/autocomplete";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { ScrollArea } from "@/components/ui/scroll-area";

import { CardListSkeleton } from "@/components/Common/SkeletonLoading";

import useBreakpoints from "@/hooks/useBreakpoints";
import { cn } from "@/lib/utils";
import { DiagnosticReportDetailCard } from "@/pages/Encounters/DiagnosticReportDetailCard";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import activityDefinitionApi from "@/types/emr/activityDefinition/activityDefinitionApi";
import {
  DIAGNOSTIC_REPORT_STATUS_COLORS,
  DiagnosticReportRead,
} from "@/types/emr/diagnosticReport/diagnosticReport";
import diagnosticReportApi from "@/types/emr/diagnosticReport/diagnosticReportApi";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { formatDateTime } from "@/Utils/utils";

interface LeftCardProps {
  report: DiagnosticReportRead;
  isActive: boolean;
  onClick: () => void;
}

function LeftCard({ report, isActive, onClick }: LeftCardProps) {
  const { t } = useTranslation();

  return (
    <Card
      onClick={onClick}
      className={cn(
        "cursor-pointer p-3 text-sm border hover:border-primary-500 transition-colors rounded-md",
        isActive && "border-primary-600 bg-primary-50",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="font-medium pb-1 truncate">
            {report.service_request?.title ||
              t("diagnostic_report", { count: 1 })}
          </div>
          <div className="text-xs text-gray-600">
            {formatDateTime(report.created_date)}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge
              variant={DIAGNOSTIC_REPORT_STATUS_COLORS[report.status]}
              className="text-xs"
            >
              {t(report.status)}
            </Badge>
            {report.category?.display && (
              <span className="text-xs text-gray-500">
                {report.category.display}
              </span>
            )}
          </div>
        </div>
        {isActive && <ArrowRight className="size-4 text-gray-500 ml-2" />}
      </div>
    </Card>
  );
}

interface LeftPanelProps {
  reports: DiagnosticReportRead[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  selectedReportId?: string;
  selectedActivityDefinition?: string;
  facilityId: string;
  onReportClick: (report: DiagnosticReportRead) => void;
  onActivityDefinitionChange: (activityDefinition: string | undefined) => void;
  scrollRef: (node?: Element | null) => void;
}

function LeftPanel({
  reports,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  selectedReportId,
  selectedActivityDefinition,
  facilityId,
  onReportClick,
  onActivityDefinitionChange,
  scrollRef,
}: LeftPanelProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: activityDefinitionsData, isLoading: isSearching } = useQuery({
    queryKey: ["activityDefinitions", facilityId, searchQuery],
    queryFn: query.debounced(activityDefinitionApi.listActivityDefinition, {
      pathParams: { facilityId },
      queryParams: {
        title: searchQuery || undefined,
        limit: 50,
      },
    }),
    enabled: !!facilityId,
  });

  const activityDefinitions = activityDefinitionsData?.results || [];

  const options = activityDefinitions.map((activityDef) => ({
    label: activityDef.title,
    value: activityDef.title,
  }));

  return (
    <>
      {facilityId && (
        <div className="relative w-full pb-2">
          <Autocomplete
            value={selectedActivityDefinition || ""}
            onChange={(value) => onActivityDefinitionChange(value || undefined)}
            onSearch={setSearchQuery}
            options={options}
            isLoading={isSearching}
            placeholder={t("all")}
            inputPlaceholder={t("search")}
            noOptionsMessage={t("no_results_found")}
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <CardListSkeleton count={6} />
        ) : (
          <ul className="grid gap-2">
            {reports.map((report) => (
              <li key={report.id}>
                <LeftCard
                  report={report}
                  isActive={selectedReportId === report.id}
                  onClick={() => onReportClick(report)}
                />
              </li>
            ))}
            <div ref={scrollRef} />
            {isFetchingNextPage && <CardListSkeleton count={3} />}
            {!hasNextPage && reports.length > 0 && (
              <div className="border-b border-gray-300 pb-2" />
            )}
          </ul>
        )}
      </div>
    </>
  );
}

const LIMIT = 14;

interface DiagnosticReportsTabProps {
  patientId: string;
  encounterId?: string;
  facilityId?: string;
}

export const DiagnosticReportsTab = ({
  patientId,
  encounterId,
  facilityId,
}: DiagnosticReportsTabProps) => {
  const { t } = useTranslation();
  const { ref, inView } = useInView();

  const [qParams, setQueryParams] = useQueryParams<{
    reportId?: string;
    activityDefinition?: string;
  }>();

  const { reportId, activityDefinition } = qParams;

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const isMobile = useBreakpoints({ default: true, md: false });

  const {
    data: reportsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: [
      "infinite-diagnosticReports",
      patientId,
      encounterId,
      activityDefinition,
    ],
    queryFn: async ({ pageParam = 0, signal }) => {
      const response = await query(diagnosticReportApi.listDiagnosticReports, {
        pathParams: { patient_external_id: patientId },
        queryParams: {
          encounter: encounterId,
          limit: LIMIT,
          offset: pageParam,
        },
      })({ signal });
      return response as PaginatedResponse<DiagnosticReportRead>;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const currentOffset = allPages.length * LIMIT;
      return currentOffset < lastPage.count ? currentOffset : null;
    },
  });

  const allReports = reportsData?.pages.flatMap((page) => page.results) ?? [];

  const reports = activityDefinition
    ? allReports.filter((r) => r.service_request?.title === activityDefinition)
    : allReports;

  const selectedReport = reports.find((r) => r.id === reportId) || reports[0];

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  const handleReportClick = (report: DiagnosticReportRead) => {
    setQueryParams({ ...qParams, reportId: report.id });
    if (isMobile) setIsDrawerOpen(false);
  };

  const handleActivityDefinitionChange = (
    newActivityDefinition: string | undefined,
  ) => {
    if (newActivityDefinition) {
      setQueryParams({ ...qParams, activityDefinition: newActivityDefinition });
    } else {
      const { activityDefinition: _activityDefinition, ...rest } = qParams;
      setQueryParams(rest);
    }
  };

  if (!isLoading && reports.length === 0) {
    return (
      <EmptyState
        title={t("no_diagnostic_reports_found")}
        description={t("no_diagnostic_reports_found_description")}
        action={
          activityDefinition ? (
            <Button
              variant="outline"
              onClick={() => handleActivityDefinitionChange(undefined)}
            >
              {t("remove_filter")}
            </Button>
          ) : undefined
        }
        className="size-full"
      />
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-full">
      <div className="hidden md:flex md:w-1/4 flex-col gap-3 pt-1 md:h-full md:overflow-y-auto pr-3">
        <LeftPanel
          reports={reports}
          isLoading={isLoading}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={!!hasNextPage}
          selectedReportId={selectedReport?.id}
          selectedActivityDefinition={activityDefinition}
          facilityId={facilityId || ""}
          onReportClick={handleReportClick}
          onActivityDefinitionChange={handleActivityDefinitionChange}
          scrollRef={ref}
        />
      </div>

      {isMobile && (
        <div className="p-3 border-b md:hidden flex justify-center">
          <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <DrawerTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                <Menu className="size-4 mr-2" />
                {t("ENCOUNTER_TAB__diagnostic_reports")}
              </Button>
            </DrawerTrigger>
            <DrawerContent
              className="h-[85vh]"
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <ScrollArea className="h-full">
                <div className="p-3 h-full">
                  <LeftPanel
                    reports={reports}
                    isLoading={isLoading}
                    isFetchingNextPage={isFetchingNextPage}
                    hasNextPage={!!hasNextPage}
                    selectedReportId={selectedReport?.id}
                    selectedActivityDefinition={activityDefinition}
                    facilityId={facilityId || ""}
                    onReportClick={handleReportClick}
                    onActivityDefinitionChange={handleActivityDefinitionChange}
                    scrollRef={ref}
                  />
                </div>
              </ScrollArea>
            </DrawerContent>
          </Drawer>
        </div>
      )}

      {/* Right Panel - Report Details */}
      <div className="flex-1 h-full overflow-y-auto">
        <ScrollArea className="h-full">
          <div className="space-y-4 p-3">
            {isLoading ? (
              <CardListSkeleton count={1} />
            ) : (
              selectedReport && (
                <DiagnosticReportDetailCard
                  reportId={selectedReport.id}
                  patientId={patientId}
                  facilityId={facilityId}
                />
              )
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export const EncounterDiagnosticReportsTab = () => {
  const {
    selectedEncounterId: encounterId,
    facilityId,
    patientId,
  } = useEncounter();

  return (
    <DiagnosticReportsTab
      patientId={patientId}
      encounterId={encounterId}
      facilityId={facilityId}
    />
  );
};
