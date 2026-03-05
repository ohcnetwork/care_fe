import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronLeft,
  Clock,
  Download,
  FileText,
  History,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  Printer,
  RefreshCw,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  PERMISSION_GENERATE_REPORT_FROM_TEMPLATE,
  PERMISSION_LIST_TEMPLATE,
} from "@/common/Permissions";
import BackButton from "@/components/Common/BackButton";
import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import { EmptyState } from "@/components/ui/empty-state";
import { usePermissions } from "@/context/PermissionContext";
import { cn } from "@/lib/utils";
import { useCurrentFacilitySilently } from "@/pages/Facility/utils/useCurrentFacility";
import { ReportRead, ReportReadList } from "@/types/emr/report/report";
import reportApi from "@/types/emr/report/reportApi";
import { TemplateBaseRead } from "@/types/emr/template/template";
import templateApi from "@/types/emr/template/templateApi";
import mutate from "@/Utils/request/mutate";
import query, { callApi } from "@/Utils/request/query";
import { formatDateTime, formatName, relativeTime } from "@/Utils/utils";

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 30000;

interface ReportViewerProps {
  facilityId: string;
  patientId: string;
  encounterId: string;
  templateSlug: string;
}

export default function ReportViewer({
  facilityId: _facilityId,
  patientId: _patientId,
  encounterId,
  templateSlug,
}: ReportViewerProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { facility } = useCurrentFacilitySilently();
  const { hasPermission } = usePermissions();

  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [autoGenTriggered, setAutoGenTriggered] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const generationStartRef = useRef<Date | null>(null);

  const canGenerateReport = hasPermission(
    PERMISSION_GENERATE_REPORT_FROM_TEMPLATE,
    facility?.permissions,
  );
  const canListTemplate = hasPermission(
    PERMISSION_LIST_TEMPLATE,
    facility?.permissions,
  );

  const { data: template, isLoading: isLoadingTemplate } = useQuery({
    queryKey: ["template", templateSlug],
    queryFn: query(templateApi.retrieveTemplate, {
      pathParams: { slug: templateSlug },
    }),
    enabled: canListTemplate,
  });

  const {
    data: reportsData,
    isLoading: isLoadingReports,
    refetch: refetchReports,
  } = useQuery({
    queryKey: ["reports", encounterId, "template", templateSlug],
    queryFn: query(reportApi.listReports, {
      queryParams: {
        associating_id: encounterId,
        upload_completed: "true",
        report_type: "discharge_summary",
        is_archived: "false",
        template: templateSlug,
        limit: 50,
      },
    }),
    enabled: !!encounterId,
  });

  const reports = useMemo(
    () => reportsData?.results ?? [],
    [reportsData?.results],
  );

  const selectedReport = reports.find((r) => r.id === selectedReportId);
  const selectedReportIndex = reports.findIndex(
    (r) => r.id === selectedReportId,
  );

  // Handler to select report and close drawer on mobile
  const handleSelectReport = useCallback((reportId: string) => {
    setSelectedReportId(reportId);
    setDrawerOpen(false); // Close drawer on mobile after selection
  }, []);

  useEffect(() => {
    if (reports.length > 0 && !selectedReportId) {
      setSelectedReportId(reports[0].id);
    }
  }, [reports, selectedReportId]);

  const { data: reportDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ["report", selectedReportId],
    queryFn: query(reportApi.retrieveReport, {
      pathParams: { id: selectedReportId! },
    }),
    enabled: !!selectedReportId,
  });

  useEffect(() => {
    setPdfUrl(null);
    if (reportDetail?.read_signed_url) {
      setPdfUrl(reportDetail.read_signed_url);
    }
  }, [selectedReportId, reportDetail]);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
    generationStartRef.current = null;
  }, []);

  useEffect(() => stopPolling, [stopPolling]);

  const pollStatus = useCallback(
    async (tmpl: TemplateBaseRead) => {
      try {
        const response = await callApi(reportApi.createReport, {
          body: {
            template_id: tmpl.id,
            associating_id: encounterId,
            output_format: tmpl.default_format,
            options: JSON.stringify({}),
            force: false,
            status_check: true,
          },
        });

        if (response && Object.keys(response).length > 0) return;

        const startTime = generationStartRef.current;
        stopPolling();

        const freshData = await queryClient.fetchQuery({
          queryKey: ["reports", encounterId, "template", templateSlug, "fresh"],
          queryFn: query(reportApi.listReports, {
            queryParams: {
              associating_id: encounterId,
              upload_completed: "true",
              report_type: "discharge_summary",
              is_archived: "false",
              template: templateSlug,
              limit: 1,
            },
          }),
        });

        const newReport = freshData?.results?.[0];
        const isNewReport =
          newReport &&
          startTime &&
          new Date(newReport.created_date) > startTime;

        if (isNewReport) {
          await refetchReports();
          setSelectedReportId(newReport.id);
          toast.success(t("report_generation_completed"));
        } else {
          toast.error(t("report_generation_failed"));
        }

        setIsGenerating(false);
      } catch {
        // Continue polling on transient errors
      }
    },
    [encounterId, templateSlug, stopPolling, queryClient, refetchReports, t],
  );

  const startPolling = useCallback(
    (tmpl: TemplateBaseRead) => {
      if (pollIntervalRef.current || pollTimeoutRef.current) return;

      pollIntervalRef.current = setInterval(
        () => pollStatus(tmpl),
        POLL_INTERVAL_MS,
      );

      pollTimeoutRef.current = setTimeout(() => {
        stopPolling();
        setIsGenerating(false);
        toast.error(t("report_generation_taking_longer"));
      }, POLL_TIMEOUT_MS);
    },
    [pollStatus, stopPolling, t],
  );

  const { mutate: triggerGeneration } = useMutation({
    mutationFn: mutate(reportApi.createReport),
    onError: (error) => {
      toast.error(error.message || t("report_generation_failed"));
      stopPolling();
      setIsGenerating(false);
    },
  });

  const generateReport = useCallback(
    (tmpl: TemplateBaseRead) => {
      if (isGenerating) {
        toast.info(t("report_generation_in_progress"));
        return;
      }

      setIsGenerating(true);
      generationStartRef.current = new Date();

      triggerGeneration(
        {
          template_id: tmpl.id,
          associating_id: encounterId,
          output_format: tmpl.default_format,
          options: JSON.stringify({}),
          force: false,
        },
        {
          onSuccess: () => {
            toast.success(t("report_generation_started"));
            startPolling(tmpl);
          },
        },
      );
    },
    [isGenerating, encounterId, triggerGeneration, startPolling, t],
  );

  // Auto-generate report on first load if none exist
  useEffect(() => {
    const shouldAutoGenerate =
      !isLoadingReports &&
      !isLoadingTemplate &&
      template &&
      reports.length === 0 &&
      !autoGenTriggered &&
      canGenerateReport;

    if (shouldAutoGenerate) {
      setAutoGenTriggered(true);
      generateReport(template);
    }
  }, [
    isLoadingReports,
    isLoadingTemplate,
    template,
    reports.length,
    autoGenTriggered,
    canGenerateReport,
    generateReport,
  ]);

  const handleDownload = useCallback(
    async (report: ReportReadList) => {
      try {
        const data: ReportRead = await queryClient.fetchQuery({
          queryKey: ["report", report.id, "download"],
          queryFn: query(reportApi.retrieveReport, {
            pathParams: { id: report.id },
          }),
        });

        if (!data?.read_signed_url) {
          throw new Error("Download URL not available");
        }

        const response = await fetch(data.read_signed_url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = report.name || report.report_type || "report";
        anchor.click();
        window.URL.revokeObjectURL(url);
        toast.success(t("file_download_completed"));
      } catch {
        toast.error(t("file_download_failed"));
      }
    },
    [queryClient, t],
  );

  const handlePrint = useCallback(async () => {
    if (!pdfUrl) return;

    try {
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "none";
      iframe.style.opacity = "0";
      iframe.src = blobUrl;

      iframe.onload = () => {
        try {
          iframe.contentWindow?.print();
        } catch {
          window.open(blobUrl, "_blank");
        }
        setTimeout(() => {
          document.body.removeChild(iframe);
          window.URL.revokeObjectURL(blobUrl);
        }, 60000);
      };

      document.body.appendChild(iframe);
    } catch {
      toast.error(t("PRINTABLE_QR_CODE__print_error"));
    }
  }, [pdfUrl, t]);

  if (isLoadingTemplate || isLoadingReports) {
    return <Loading />;
  }

  if (!template) {
    return (
      <Page title={t("reports")}>
        <EmptyState
          icon={<FileText className="size-6 text-gray-400" />}
          title={t("template_not_found")}
          className="my-16"
        />
      </Page>
    );
  }

  // Render Main UI
  return (
    <Page
      title={template.name}
      hideTitleOnPage
      componentRight={
        <div className="flex gap-2 items-center">
          <BackButton size="icon">
            <ChevronLeft className="size-4" />
          </BackButton>
          <h4 className="text-gray-800 truncate">{template.name}</h4>
        </div>
      }
      options={
        <div className="flex justify-end gap-2 w-full flex-wrap">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateReport(template)}
              disabled={isGenerating || !canGenerateReport}
            >
              <RefreshCw
                className={cn("size-4", isGenerating && "animate-spin")}
              />
              <span>
                {isGenerating ? t("generating_report") : t("regenerate_report")}
              </span>
            </Button>

            {pdfUrl && (
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="size-4" />
                <span className="hidden sm:inline">{t("print")}</span>
              </Button>
            )}

            {selectedReport && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(selectedReport)}
              >
                <Download className="size-4" />
                <span className="hidden sm:inline">{t("download")}</span>
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="flex flex-col lg:flex-row h-[calc(100vh-10rem)] gap-0 mt-2">
        {/* Mobile: Drawer trigger */}
        <div className="lg:hidden mb-2">
          <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
            <DrawerTrigger className="w-full">
              <ReportHistoryTrigger
                selectedReport={selectedReport}
                template={template}
                isLatest={selectedReportIndex === 0 && reports.length > 0}
              />
            </DrawerTrigger>
            <DrawerContent className="px-4 max-h-[85vh]">
              <DrawerHeader className="py-1.5">
                <DrawerTitle className="text-lg font-semibold flex items-center gap-2">
                  <History className="size-5" />
                  {t("report_history")}
                </DrawerTitle>
              </DrawerHeader>
              <ScrollArea className="overflow-y-auto pb-4 pr-2">
                <ReportList
                  reports={reports}
                  isGenerating={isGenerating}
                  selectedReportId={selectedReportId}
                  onSelectReport={handleSelectReport}
                />
              </ScrollArea>
            </DrawerContent>
          </Drawer>
        </div>

        {/* Desktop: Sidebar */}
        <div
          className={cn(
            "hidden lg:flex shrink-0 flex-col border-r bg-gray-50/50 transition-all duration-200",
            sidebarOpen ? "w-72" : "w-0 overflow-hidden border-r-0",
          )}
        >
          <div className="flex items-center justify-between px-4 py-3 h-11 border-b bg-white">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <History className="size-4" />
              {t("report_history")}
            </div>
            <span className="text-xs text-gray-400">
              {reports.length} {t("version")}
            </span>
          </div>

          <div className="flex-1 px-3 py-2 overflow-auto bg-white">
            <ReportList
              reports={reports}
              isGenerating={isGenerating}
              selectedReportId={selectedReportId}
              onSelectReport={setSelectedReportId}
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          <div className="items-center justify-between border-b bg-white px-3 py-2 h-11 hidden lg:flex">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0"
                onClick={() => setSidebarOpen((v) => !v)}
              >
                {sidebarOpen ? (
                  <PanelLeftClose className="size-4" />
                ) : (
                  <PanelLeftOpen className="size-4" />
                )}
              </Button>

              {selectedReport && (
                <div className="flex items-center gap-2 text-sm text-gray-500 min-w-0">
                  <span className="font-medium text-gray-700 truncate">
                    {selectedReport.name || template.name}
                  </span>
                  {selectedReportIndex === 0 && reports.length > 0 && (
                    <Badge variant="green" size="sm" className="shrink-0">
                      {t("latest")}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-hidden bg-gray-100/50 flex items-start justify-center">
            {isLoadingDetail && (
              <div className="flex items-center justify-center h-full w-full">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="size-8 animate-spin text-gray-400" />
                  <p className="text-sm text-gray-400">{t("loading")}</p>
                </div>
              </div>
            )}

            {!selectedReportId && !isGenerating && (
              <div className="flex items-center justify-center h-full w-full">
                <EmptyState
                  icon={<FileText className="size-6 text-gray-400" />}
                  title={t("no_reports_found")}
                  description={t("no_reports_found_description")}
                  action={
                    canGenerateReport ? (
                      <Button
                        variant="primary"
                        onClick={() => generateReport(template)}
                      >
                        <RefreshCw className="size-4" />
                        {t("generate_report")}
                      </Button>
                    ) : undefined
                  }
                  className="size-full border-none rounded-none"
                />
              </div>
            )}

            {isGenerating && !pdfUrl && (
              <div className="flex items-center justify-center h-full w-full">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="rounded-full bg-primary/10 p-4">
                    <Loader2 className="size-8 animate-spin text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-medium text-gray-700">
                      {t("generating_report")}
                    </p>
                    <p className="text-sm text-gray-400 max-w-xs">
                      {t("report_generation_please_wait")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {pdfUrl && !isLoadingDetail && (
              <iframe
                key={selectedReportId}
                src={pdfUrl}
                className="h-full w-full border-0"
                title={t("report_preview")}
              />
            )}
          </div>
        </div>
      </div>
    </Page>
  );
}

// Report History Trigger Component (Mobile)
function ReportHistoryTrigger({
  selectedReport,
  template,
  isLatest,
}: {
  selectedReport: ReportReadList | undefined;
  template: TemplateBaseRead;
  isLatest: boolean;
}) {
  const { t } = useTranslation();

  if (!selectedReport) {
    return (
      <Card className="relative rounded-md cursor-pointer w-full bg-gray-50 border-gray-200">
        <CardContent className="flex items-center justify-between px-4 py-3 gap-2">
          <div className="flex flex-col items-start gap-1">
            <span className="text-sm font-medium text-gray-600">
              {t("select_report")}
            </span>
          </div>
          <ChevronDown className="size-5 text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative rounded-md cursor-pointer w-full bg-white border-primary-600">
      <CardContent className="flex items-center justify-between px-4 py-3 gap-2">
        <div className="absolute right-0 h-8 w-1 bg-primary-600 rounded-l inset-y-1/2 -translate-y-1/2" />
        <div className="flex flex-col items-start gap-1 min-w-0 flex-1">
          <span className="flex text-sm font-semibold text-gray-900 truncate w-full items-start">
            {selectedReport.name || template.name}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {formatDateTime(selectedReport.created_date)}
            </span>
            {isLatest && (
              <Badge variant="primary" size="sm">
                {t("latest")}
              </Badge>
            )}
          </div>
        </div>
        <ChevronDown className="size-5 text-gray-400 shrink-0" />
      </CardContent>
    </Card>
  );
}

// Report List Component
function ReportList({
  reports,
  isGenerating,
  selectedReportId,
  onSelectReport,
}: {
  reports: ReportReadList[];
  isGenerating: boolean;
  selectedReportId: string | null;
  onSelectReport: (id: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-1.5">
      {isGenerating && (
        <div className="mb-2 flex items-center gap-2.5 rounded-lg bg-primary/5 border border-primary/10 px-3 py-2.5 text-sm text-primary">
          <Loader2 className="size-4 animate-spin shrink-0" />
          <span className="font-medium">{t("generating_report")}</span>
        </div>
      )}

      {reports.length === 0 && !isGenerating && (
        <div className="flex flex-col items-center gap-2 py-12 text-center text-gray-400">
          <FileText className="size-8" />
          <p className="text-sm">{t("no_reports_found")}</p>
        </div>
      )}

      {reports.map((report, index) => {
        const uploaderName = report.uploaded_by
          ? formatName(report.uploaded_by)
          : undefined;
        const isSelected = selectedReportId === report.id;
        const isLatest = index === 0;

        return (
          <Card
            key={report.id}
            onClick={() => onSelectReport(report.id)}
            className={cn(
              "rounded-md relative cursor-pointer transition-colors w-full",
              isSelected
                ? "bg-white border-primary-600 shadow-md"
                : "bg-gray-100 hover:bg-gray-100 shadow-none",
            )}
          >
            {isSelected && (
              <div className="absolute right-0 h-8 w-1 bg-primary-600 rounded-l inset-y-1/2 -translate-y-1/2" />
            )}
            <CardContent className="flex flex-col px-3 py-2.5 gap-1">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "font-medium truncate text-sm",
                    isSelected ? "text-gray-900" : "text-gray-600",
                  )}
                >
                  {formatDateTime(report.created_date)}
                </span>
                {isLatest && (
                  <Badge variant="primary" size="sm">
                    {t("latest")}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Clock className="size-3 shrink-0" />
                <span className="truncate">
                  {relativeTime(report.created_date)}
                </span>
                {uploaderName && (
                  <>
                    <span>·</span>
                    <span className="truncate">{uploaderName}</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
