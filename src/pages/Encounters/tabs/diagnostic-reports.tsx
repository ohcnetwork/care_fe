import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { format, isToday } from "date-fns";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Menu,
  MoreVertical,
  Pin,
  Printer,
} from "lucide-react";
import { navigate, useQueryParams } from "raviger";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useInView } from "react-intersection-observer";
import {
  LabelList,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import Autocomplete from "@/components/ui/autocomplete";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { FileListTable } from "@/components/Files/FileListTable";

import { CardListSkeleton } from "@/components/Common/SkeletonLoading";

import Loading from "@/components/Common/Loading";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useBreakpoints from "@/hooks/useBreakpoints";
import { cn } from "@/lib/utils";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import { buildEncounterUrl } from "@/pages/Encounters/utils/utils";
import { DiagnosticReportResultsTable } from "@/pages/Facility/services/diagnosticReports/components/DiagnosticReportResultsTable";
import { ObservationHistorySheet } from "@/pages/Facility/services/serviceRequests/components/ObservationHistorySheet";
import activityDefinitionApi from "@/types/emr/activityDefinition/activityDefinitionApi";
import {
  DIAGNOSTIC_REPORT_STATUS_COLORS,
  DiagnosticReportRead,
} from "@/types/emr/diagnosticReport/diagnosticReport";
import diagnosticReportApi from "@/types/emr/diagnosticReport/diagnosticReportApi";
import {
  ObservationRead,
  ObservationStatus,
} from "@/types/emr/observation/observation";
import observationApi from "@/types/emr/observation/observationApi";
import { FileReadMinimal } from "@/types/files/file";
import fileApi from "@/types/files/fileApi";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { formatDateTime, formatName } from "@/Utils/utils";

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

interface DiagnosticReportDetailCardProps {
  diagnosticReport: DiagnosticReportRead;
  patientId: string;
  facilityId?: string;
}

function DiagnosticReportDetailCard({
  diagnosticReport,
  patientId,
  facilityId,
}: DiagnosticReportDetailCardProps) {
  const { t } = useTranslation();

  const [observationHistoryOpen, setObservationHistoryOpen] = useState(false);

  const { data: report, isLoading: isReportLoading } = useQuery({
    queryKey: ["diagnosticReport", diagnosticReport.id],
    queryFn: query(diagnosticReportApi.retrieveDiagnosticReport, {
      pathParams: {
        patient_external_id: patientId,
        external_id: diagnosticReport.id,
      },
    }),
    enabled: !!diagnosticReport.id && !!patientId,
  });

  // Query to fetch files for the diagnostic report
  const { data: filesData } = useQuery<PaginatedResponse<FileReadMinimal>>({
    queryKey: ["files", "diagnostic_report", report?.id],
    queryFn: query(fileApi.list, {
      queryParams: {
        file_type: "diagnostic_report",
        associating_id: report?.id,
        limit: 100,
        offset: 0,
      },
    }),
    enabled: !!report?.id,
  });

  const files = filesData?.results || [];

  if (isReportLoading) {
    return <CardListSkeleton count={1} />;
  }

  if (!report) {
    return null;
  }

  const filteredObservations = report.observations?.filter(
    (obs) => obs.status !== ObservationStatus.ENTERED_IN_ERROR,
  );

  return (
    <Card className="shadow-sm border rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
        <CardTitle className="text-base font-medium">
          <span>
            {report.service_request?.title ||
              t("diagnostic_report", { count: 1 })}
          </span>
          {report.code?.display && <span> - {report.code.display}</span>}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setObservationHistoryOpen(true);
            }}
          >
            {t("view_historic_data")}
          </Button>
          <ObservationHistoryContent
            open={observationHistoryOpen}
            setObservationHistoryOpen={setObservationHistoryOpen}
            diagnosticReport={report}
          />
          <Badge variant={DIAGNOSTIC_REPORT_STATUS_COLORS[report.status]}>
            {t(report.status)}
          </Badge>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    navigate(
                      buildEncounterUrl(
                        patientId,
                        `/diagnostic_reports/${report.id}/print`,
                        facilityId,
                      ),
                    )
                  }
                  data-shortcut-id="print-button"
                >
                  <Printer className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("print")}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {filteredObservations && filteredObservations.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label={t("test_results_actions")}
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
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0 space-y-4">
        {/* Report Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {report.service_request?.code?.display && (
            <div className="col-span-full">
              <div className="text-gray-500">{t("procedure")}</div>
              <div className="font-medium">
                {report.service_request.code.display}
                {report.service_request.code.code && (
                  <span className="text-xs text-gray-500 ml-2">
                    ({report.service_request.code.code})
                  </span>
                )}
              </div>
            </div>
          )}
          <div>
            <div className="text-gray-500">{t("category")}</div>
            <div className="font-medium">{report.category?.display || "-"}</div>
          </div>
          <div>
            <div className="text-gray-500">{t("report_date")}</div>
            <div className="font-medium">
              {format(new Date(report.created_date), "dd-MM-yyyy HH:mm")}
            </div>
          </div>
          <div>
            <div className="text-gray-500">{t("requested_by")}</div>
            <div className="font-medium">{formatName(report.requester)}</div>
          </div>
          <div>
            <div className="text-gray-500">{t("filed_by")}</div>
            <div className="font-medium">{formatName(report.created_by)}</div>
          </div>
          {report.note && (
            <div className="col-span-full">
              <div className="text-gray-500">{t("notes")}</div>
              <div className="font-medium whitespace-pre-wrap">
                {report.note}
              </div>
            </div>
          )}
          {report.conclusion && (
            <div className="col-span-full">
              <div className="text-gray-500">{t("conclusion")}</div>
              <div className="font-medium whitespace-pre-wrap">
                {report.conclusion}
              </div>
            </div>
          )}
        </div>

        {filteredObservations && filteredObservations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700">
              {t("test_results")}
            </h4>
            <DiagnosticReportResultsTable observations={filteredObservations} />
          </div>
        )}

        {files.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700">
              {t("uploaded_files")}
            </h4>
            <FileListTable
              files={files}
              type="diagnostic_report"
              associatingId={report.id}
              canEdit={false}
              showHeader={false}
            />
          </div>
        )}
      </CardContent>
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
                  diagnosticReport={selectedReport}
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

const ObservationHistoryContent = ({
  open,
  diagnosticReport,
  setObservationHistoryOpen,
}: {
  open: boolean;
  diagnosticReport: DiagnosticReportRead;
  setObservationHistoryOpen: (open: boolean) => void;
}) => {
  const { t } = useTranslation();

  const [currentEncounterOnly, setCurrentEncounterOnly] = useState(false);

  // const recordingsCount = diagnosticReport.observations?.length ?? 0;

  // const observationTimes = (diagnosticReport.observations ?? [])
  //   .map((obs) => obs.effective_datetime)
  //   .filter((d): d is string => !!d)
  //   .map((d) => new Date(d).getTime());

  // const minTime = observationTimes.length
  //   ? Math.min(...observationTimes)
  //   : null;
  // const maxTime = observationTimes.length
  //   ? Math.max(...observationTimes)
  //   : null;

  return (
    <Sheet open={open} onOpenChange={setObservationHistoryOpen}>
      <SheetContent className="w-full sm:max-w-4xl flex flex-col p-0 gap-0 overflow-y-auto h-100vh">
        <SheetHeader className="p-6 pb-4 bg-white">
          <SheetTitle className="text-gray-950 text-lg">
            {diagnosticReport.code?.display}
          </SheetTitle>
          {/* <div className="flex flex-wrap items-center gap-1.5 text-sm text-gray-500">
            <span>
              {currentEncounterOnly
                ? t("current_encounter")
                : t(
                    `encounter_class__${diagnosticReport.encounter.encounter_class}`,
                  )}
            </span>
            <span>&middot;</span>
            <span>{t("recordings_count", { count: recordingsCount })}</span>
            {minTime !== null && maxTime !== null && (
              <>
                <span>&middot;</span>
                <span>
                  {format(new Date(minTime), "d MMM")} &rarr;{" "}
                  {format(new Date(maxTime), "d MMM")}
                </span>
              </>
            )}
          </div> */}
        </SheetHeader>
        <div className="flex flex-col gap-2 overflow-y-auto p-4 flex-1 min-h-0 -mt-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start pl-2">
            <Tabs
              defaultValue={diagnosticReport.observations?.[0]?.id}
              className="min-w-0 flex-1"
            >
              <TabsList className="bg-gray-100 max-w-full justify-start overflow-x-auto">
                {diagnosticReport.observations?.map((obs) => (
                  <TabsTrigger
                    key={obs.id}
                    value={obs.id}
                    className="shrink-0 whitespace-nowrap py-3"
                  >
                    {obs.observation_definition?.title || t("observation")}
                  </TabsTrigger>
                ))}
              </TabsList>
              {diagnosticReport.observations?.map((observation) => (
                <TabsContent key={observation.id} value={observation.id}>
                  <ObservationHistoryGraph
                    observation={observation}
                    patientId={diagnosticReport.encounter.patient.id}
                    encounterId={diagnosticReport.encounter.id}
                    currentEncounterOnly={currentEncounterOnly}
                  />
                </TabsContent>
              ))}
            </Tabs>
            <div className="flex shrink-0 items-center gap-2 text-sm sm:whitespace-nowrap">
              <Checkbox
                checked={currentEncounterOnly}
                onCheckedChange={(checked) =>
                  setCurrentEncounterOnly(checked === true)
                }
              />
              <span>{t("show_current_encounter_recordings")}</span>
            </div>
          </div>

          {diagnosticReport.observations &&
            diagnosticReport.observations.length > 0 && (
              <ObservationHistoryTable
                title={
                  diagnosticReport.code?.display ||
                  diagnosticReport.service_request?.title ||
                  t("observation")
                }
                observations={diagnosticReport.observations}
                patientId={diagnosticReport.encounter.patient.id}
                encounterId={diagnosticReport.encounter.id}
                currentEncounterOnly={currentEncounterOnly}
              />
            )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

const ObservationHistoryGraph = ({
  observation,
  patientId,
  encounterId,
  currentEncounterOnly,
}: {
  observation: ObservationRead;
  patientId: string;
  encounterId: string;
  currentEncounterOnly: boolean;
}) => {
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: [
      "observations",
      patientId,
      encounterId,
      observation.main_code,
      currentEncounterOnly,
    ],
    queryFn: query(observationApi.analyse, {
      pathParams: { patientId: patientId },
      body: {
        codes: observation.main_code ? [observation.main_code] : [],
      },
    }),
    enabled: observation.main_code !== undefined,
  });

  const chartData = useMemo(() => {
    return (data?.results[0].results ?? [])
      .map((obs) => {
        if (!obs.effective_datetime) return null;
        const value = Number(obs.value?.value);
        if (isNaN(value)) return null;
        return { time: new Date(obs.effective_datetime).getTime(), value };
      })
      .filter(
        (entry): entry is { time: number; value: number } => entry !== null,
      )
      .sort((a, b) => a.time - b.time);
  }, [data]);

  // One tick per calendar day (first reading of the day) to avoid overlapping
  // date labels when multiple readings share the same day.
  const dayTicks = useMemo(
    () =>
      Array.from(
        chartData
          .reduce((acc, d) => {
            const day = format(new Date(d.time), "yyyy-MM-dd");
            if (!acc.has(day)) acc.set(day, d.time);
            return acc;
          }, new Map<string, number>())
          .values(),
      ),
    [chartData],
  );

  if (isLoading || !data) {
    return <Loading />;
  }

  const unit =
    observation.value?.unit?.display || observation.value?.unit?.code || "";

  const refRange = observation.reference_range?.[0];
  const refMin = refRange?.min;
  const refMax = refRange?.max;

  if (chartData.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-gray-500">
        {t("no_data_available")}
      </div>
    );
  }

  const values = chartData.map((d) => d.value);
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const yMin = Math.min(dataMin, refMin ?? dataMin);
  const yMax = Math.max(dataMax, refMax ?? dataMax);
  const pad = (yMax - yMin || 1) * 0.2;

  const lastIndex = chartData.length - 1;

  const renderValueLabel = (props: {
    x?: number | string;
    y?: number | string;
    value?: number | string | (number | string)[] | boolean | null;
    index?: number;
  }): React.ReactElement => {
    const x = Number(props.x);
    const y = Number(props.y);
    if (isNaN(x) || isNaN(y)) return <g />;

    if (props.index === lastIndex) {
      return (
        <g>
          <text x={x + 14} y={y - 4} fontSize={11} fill="#6b7280">
            {t("latest")}
          </text>
          <text
            x={x + 14}
            y={y + 13}
            fontSize={15}
            fontWeight={600}
            fill="#111827"
          >
            {props.value}
          </text>
        </g>
      );
    }

    return (
      <text x={x} y={y - 12} textAnchor="middle" fontSize={12} fill="#374151">
        {props.value}
      </text>
    );
  };

  return (
    <div className="relative mt-4" style={{ height: 320 }}>
      <div className="pointer-events-none absolute left-3 top-1 z-10 text-xs text-gray-500">
        ({t("ref")} {refMin ?? "-"}-{refMax ?? "-"} {unit})
      </div>
      <div className="pointer-events-none absolute right-4 top-1 z-10 text-xs text-gray-500">
        {t("newest")} →
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 32, right: 72, left: 20, bottom: 8 }}
        >
          {refMin !== undefined && refMax !== undefined && (
            <ReferenceArea
              y1={refMin}
              y2={refMax}
              fill="#eff6ff"
              fillOpacity={1}
              ifOverflow="extendDomain"
            />
          )}
          <XAxis
            dataKey="time"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            ticks={dayTicks}
            interval={0}
            tickFormatter={(value) =>
              isToday(new Date(value))
                ? t("today")
                : format(new Date(value), "d MMM")
            }
            tickLine={false}
            axisLine={{ stroke: "#6b7280" }}
            tick={{ fontSize: 12, fill: "#6b7280" }}
          />
          <YAxis
            domain={[yMin - pad, yMax + pad]}
            tick={false}
            tickLine={false}
            axisLine={{ stroke: "#6b7280" }}
            width={1}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#9ca3af"
            strokeWidth={1.5}
            dot={{ r: 4, fill: "#16a34a", stroke: "#16a34a" }}
            activeDot={{ r: 5, fill: "#16a34a" }}
            isAnimationActive={false}
          >
            <LabelList dataKey="value" content={renderValueLabel} />
          </Line>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const ObservationHistoryTable = ({
  title,
  observations,
  patientId,
  encounterId,
  currentEncounterOnly,
}: {
  title: string;
  observations: ObservationRead[];
  patientId: string;
  encounterId: string;
  currentEncounterOnly: boolean;
}) => {
  const { t } = useTranslation();

  const [abnormalOnly, setAbnormalOnly] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollBy = (offset: number) => {
    // shadcn's Table wraps the <table> in its own horizontally scrollable
    // container, so scroll that element rather than the outer wrapper.
    const container = scrollRef.current?.querySelector<HTMLElement>(
      '[data-slot="table-container"]',
    );
    container?.scrollBy({ left: offset, behavior: "smooth" });
  };

  const codes = useMemo(
    () =>
      observations
        .map((obs) => obs.main_code)
        .filter((code): code is NonNullable<typeof code> => code != null),
    [observations],
  );

  const { data, isLoading } = useQuery({
    queryKey: [
      "observations-table",
      patientId,
      encounterId,
      codes.map((c) => c.code),
      currentEncounterOnly,
    ],
    queryFn: query(observationApi.analyse, {
      pathParams: { patientId },
      body: { codes },
    }),
    enabled: codes.length > 0,
  });

  console.log("ObservationHistoryTable data:", data);

  const { days, todayDay, rows } = useMemo(() => {
    if (!data) {
      return { days: [] as string[], todayDay: undefined, rows: [] };
    }

    // Collect all unique calendar days across all groups, most recent first.
    const daySet = new Set<string>();
    for (const group of data.results) {
      for (const result of group.results) {
        if (result.effective_datetime) {
          daySet.add(format(new Date(result.effective_datetime), "yyyy-MM-dd"));
        }
      }
    }
    const days = Array.from(daySet).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime(),
    );
    const todayDay = days.find((day) => isToday(new Date(day)));

    const rows = observations.map((obs) => {
      const group = data.results.find(
        (rg) => rg.code.code === obs.main_code?.code,
      );

      const unit = obs.value?.unit?.display || obs.value?.unit?.code || "";
      const refRange = obs.reference_range?.[0];
      const refMin = refRange?.min;
      const refMax = refRange?.max;

      // For each day keep the latest reading of that day.
      const valuesByDay = new Map<
        string,
        {
          time: number;
          value?: string | null;
          abnormal: boolean;
          direction: "up" | "down" | null;
        }
      >();
      for (const result of group?.results ?? []) {
        if (!result.effective_datetime) continue;
        const time = new Date(result.effective_datetime).getTime();
        const day = format(new Date(result.effective_datetime), "yyyy-MM-dd");
        const existing = valuesByDay.get(day);
        if (existing && time <= existing.time) continue;

        // Abnormal = value falls outside the reference range.
        const numeric = Number(result.value?.value);
        let direction: "up" | "down" | null = null;
        if (!isNaN(numeric)) {
          if (refMax != null && numeric > refMax) direction = "up";
          else if (refMin != null && numeric < refMin) direction = "down";
        }

        valuesByDay.set(day, {
          time,
          value: result.value?.value,
          abnormal: direction !== null,
          direction,
        });
      }

      return {
        id: obs.id,
        title: obs.observation_definition?.title || t("observation"),
        unit,
        refMin,
        refMax,
        valuesByDay,
        hasAbnormal: Array.from(valuesByDay.values()).some((e) => e.abnormal),
      };
    });

    return { days, todayDay, rows };
  }, [data, observations, t]);

  const visibleRows = useMemo(
    () => (abnormalOnly ? rows.filter((row) => row.hasAbnormal) : rows),
    [abnormalOnly, rows],
  );

  if (isLoading || !data) {
    return <Loading />;
  }

  if (days.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center text-sm text-gray-500">
        {t("no_data_available")}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="relative flex items-center gap-3 p-4">
        <span
          aria-hidden="true"
          className="absolute top-4 left-0 inset-y-6 w-1 rounded-r-lg bg-indigo-600 h-5"
        />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-gray-950">
            {title} ({t("recordings_count", { count: days.length })})
          </h3>
          <p className="text-sm text-gray-700">
            {abnormalOnly
              ? t("showing_abnormal_readings")
              : t("showing_all_readings", { count: days.length })}
          </p>
        </div>
        <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap text-sm font-medium text-gray-700">
          <Switch checked={abnormalOnly} onCheckedChange={setAbnormalOnly} />
          {t("abnormal_only")}
        </label>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => scrollBy(-240)}
            aria-label={t("scroll_left")}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => scrollBy(240)}
            aria-label={t("scroll_right")}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div
        ref={scrollRef}
        className="overflow-x-auto border-t border-gray-200 overflow-y-auto"
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100 hover:bg-gray-50">
              <TableHead className="w-64 min-w-64 max-w-64 border-r border-gray-200 bg-gray-50 text-gray-600">
                {t("component")}
              </TableHead>
              {days.map((day) => {
                const isTodayCol = day === todayDay;
                return (
                  <TableHead
                    key={day}
                    className={cn(
                      "whitespace-nowrap border-r border-gray-200 bg-gray-100 text-center font-normal text-gray-600 last:border-r-0",
                      isTodayCol && "bg-indigo-50",
                    )}
                  >
                    {isTodayCol ? (
                      <span className="inline-flex items-center gap-1 font-semibold">
                        <div className="size-2 bg-indigo-100 rounded-full border border-indigo-700" />
                        {t("today")}
                        <Pin className="size-3" />
                      </span>
                    ) : (
                      format(new Date(day), "d MMM")
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.map((row) => (
              <TableRow key={row.id} className="hover:bg-transparent">
                <TableCell className="border-r border-gray-200">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold text-gray-950">
                      {row.title}
                    </span>
                    {(row.refMin != null || row.refMax != null) && (
                      <span className="whitespace-nowrap text-xs text-gray-500">
                        ({row.refMin ?? "-"} &ndash; {row.refMax ?? "-"}
                        {row.unit ? ` ${row.unit}` : ""})
                      </span>
                    )}
                  </div>
                </TableCell>
                {days.map((day) => {
                  const entry = row.valuesByDay.get(day);
                  const isTodayCol = day === todayDay;
                  return (
                    <TableCell
                      key={day}
                      className={cn(
                        "whitespace-nowrap border-r border-gray-200 text-center last:border-r-0",
                        isTodayCol &&
                          "border-x border-primary-100 bg-primary-50/60",
                        entry?.abnormal &&
                          "bg-orange-100 font-medium text-orange-700",
                      )}
                    >
                      <span className="inline-flex items-center gap-1">
                        {entry?.value ?? "-"}
                        {entry?.abnormal && entry.direction === "up" && (
                          <ArrowUpRight className="size-3.5" />
                        )}
                        {entry?.abnormal && entry.direction === "down" && (
                          <ArrowDownRight className="size-3.5" />
                        )}
                      </span>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
            {visibleRows.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={days.length + 1}
                  className="h-24 text-center text-sm text-gray-500"
                >
                  {t("no_abnormal_readings")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
