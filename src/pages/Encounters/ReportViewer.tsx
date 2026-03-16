import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  Dot,
  Download,
  FileText,
  History,
  Loader,
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
import { ReportReadList } from "@/types/emr/report/report";
import reportApi from "@/types/emr/report/reportApi";
import { TemplateBaseRead } from "@/types/emr/template/template";
import templateApi from "@/types/emr/template/templateApi";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import mutate from "@/Utils/request/mutate";
import query, { callApi } from "@/Utils/request/query";
import { formatDateTime, relativeTime } from "@/Utils/utils";

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 30000;

interface ReportViewerProps {
  encounterId: string;
  templateSlug?: string;
  reportId?: string;
}

export default function ReportViewer({
  encounterId,
  templateSlug,
  reportId,
}: ReportViewerProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { facility } = useCurrentFacilitySilently();
  const { hasPermission } = usePermissions();

  const [selectedReportId, setSelectedReportId] = useState<string | null>(
    reportId || null,
  );
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

  const { data: initialReport } = useQuery({
    queryKey: ["report", reportId],
    queryFn: query(reportApi.retrieveReport, {
      pathParams: { id: reportId! },
    }),
    enabled: !!reportId && !templateSlug,
  });

  const effectiveTSlug =
    templateSlug ||
    (initialReport?.template as Partial<TemplateBaseRead> | undefined)?.slug;

  const { data: template, isLoading: isLoadingTemplate } = useQuery({
    queryKey: ["template", effectiveTSlug],
    queryFn: query(templateApi.retrieveTemplate, {
      pathParams: { slug: effectiveTSlug! },
    }),
    enabled: canListTemplate && !!effectiveTSlug,
  });

  const {
    data: reportsData,
    isLoading: isLoadingReports,
    refetch: refetchReports,
  } = useQuery({
    queryKey: ["reports", encounterId, "template", effectiveTSlug],
    queryFn: query(reportApi.listReports, {
      queryParams: {
        associating_id: encounterId,
        upload_completed: "true",
        report_type: "discharge_summary",
        is_archived: "false",
        template: effectiveTSlug,
        limit: 50,
      },
    }),
    enabled: !!encounterId && !!effectiveTSlug,
  });

  const reports = useMemo(
    () => reportsData?.results ?? [],
    [reportsData?.results],
  );

  const selectedReport = reports.find((r) => r.id === selectedReportId);
  const selectedReportIndex = reports.findIndex(
    (r) => r.id === selectedReportId,
  );

  const handleSelectReport = useCallback((reportId: string) => {
    setSelectedReportId(reportId);
    setDrawerOpen(false);
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
          queryKey: [
            "reports",
            encounterId,
            "template",
            effectiveTSlug,
            "fresh",
          ],
          queryFn: query(reportApi.listReports, {
            queryParams: {
              associating_id: encounterId,
              upload_completed: "true",
              report_type: "discharge_summary",
              is_archived: "false",
              template: effectiveTSlug,
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
    [encounterId, effectiveTSlug, stopPolling, queryClient, refetchReports, t],
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
        if (!pdfUrl) {
          throw new Error("Download URL not available");
        }

        const response = await fetch(pdfUrl);
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
    [pdfUrl, t],
  );

  const handlePrint = useCallback(async () => {
    if (!pdfUrl) return;

    try {
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const iframe = document.createElement("iframe");
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
        }, 10000);
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
          action={
            <BackButton>
              <ChevronLeft /> {t("back")}
            </BackButton>
          }
          className="mt-4"
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
          <BackButton size="icon" aria-label={t("back")}>
            <ChevronLeft className="size-4" />
          </BackButton>
          <h3 className="text-gray-800 truncate">{template.name}</h3>
        </div>
      }
      options={
        <div className="flex justify-end gap-2 w-full flex-wrap">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => generateReport(template)}
              disabled={isGenerating || !canGenerateReport}
              aria-label={t("regenerate")}
            >
              <RefreshCw
                className={cn("size-4", isGenerating && "animate-spin")}
              />
              <span>{t("regenerate")}</span>
            </Button>

            <Button
              variant="outline"
              onClick={handlePrint}
              aria-label={t("print")}
              disabled={!pdfUrl}
            >
              <Printer className="size-4" />
              <span className="hidden md:inline">{t("print")}</span>
              <ShortcutBadge actionId="print-button" />
            </Button>

            <Button
              onClick={() => selectedReport && handleDownload(selectedReport)}
              aria-label={t("download")}
              disabled={!selectedReport || !pdfUrl}
            >
              <Download className="size-4" />
              <span className="hidden md:inline">{t("download")}</span>
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] gap-0 mt-2 bg-white rounded-lg border">
        {/* Mobile: Drawer trigger */}
        {reports.length > 0 && (
          <div className="lg:hidden mb-2">
            <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
              <DrawerTrigger className="w-full">
                <ReportHistoryTrigger
                  selectedReport={selectedReport}
                  template={template}
                  isLatest={selectedReportIndex === 0 && reports.length > 0}
                />
              </DrawerTrigger>
              <DrawerContent className="max-h-[85vh]">
                <DrawerHeader className="border-b py-2">
                  <DrawerTitle className="text-lg font-semibold">
                    {t("report_history")}
                  </DrawerTitle>
                </DrawerHeader>
                <div className="overflow-y-auto py-2 mx-2">
                  <ReportList
                    reports={reports}
                    isGenerating={isGenerating}
                    selectedReportId={selectedReportId}
                    onSelectReport={handleSelectReport}
                  />
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        )}

        {/* Desktop: Sidebar */}
        {reports.length > 0 && (
          <div
            className={cn(
              "hidden lg:flex shrink-0 border-r flex-col transition-all duration-200",
              sidebarOpen ? "w-72" : "w-0 overflow-hidden border-r-0",
            )}
          >
            <div className="flex items-center justify-between px-4 py-3 h-11 border-b">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <History className="size-4" />
                {t("report_history")}
              </div>
              <span className="text-xs text-gray-400">
                {reports.length} {t("version")}
              </span>
            </div>

            <div className="flex-1 px-3 py-2 overflow-auto">
              <ReportList
                reports={reports}
                isGenerating={isGenerating}
                selectedReportId={selectedReportId}
                onSelectReport={setSelectedReportId}
              />
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          {selectedReport && (
            <div className="items-center justify-between border-b pr-3 pl-1 h-11 hidden lg:flex">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0"
                  onClick={() => setSidebarOpen((v) => !v)}
                  aria-label={
                    sidebarOpen ? t("close_sidebar") : t("open_sidebar")
                  }
                >
                  {sidebarOpen ? (
                    <PanelLeftClose className="size-4" />
                  ) : (
                    <PanelLeftOpen className="size-4" />
                  )}
                </Button>

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
              </div>
            </div>
          )}
          <div className="flex-1 overflow-hidden flex items-start justify-center">
            {isLoadingDetail && (
              <div className="flex items-center justify-center h-full w-full">
                <Loader className="size-8 animate-spin text-gray-400" />
              </div>
            )}

            {!selectedReportId && !isGenerating && (
              <EmptyState
                icon={<FileText className="size-6 text-gray-400" />}
                title={t("no_reports_found")}
                description={t("no_reports_found_description")}
                action={
                  canGenerateReport ? (
                    <Button
                      variant="primary"
                      onClick={() => generateReport(template)}
                      aria-label={t("generate_report")}
                    >
                      <RefreshCw className="size-4" />
                      {t("generate_report")}
                    </Button>
                  ) : undefined
                }
                className="size-full"
              />
            )}

            {isGenerating && !pdfUrl && (
              <EmptyState
                icon={<Loader className="size-6 animate-spin opacity-30" />}
                title={t("generating_report")}
                description={t("report_generation_please_wait")}
                className="size-full"
              />
            )}

            {pdfUrl && !isLoadingDetail && (
              <object
                key={selectedReportId}
                data={pdfUrl}
                type="application/pdf"
                className="h-full w-full border-0"
                title={t("report_preview")}
              >
                <EmptyState
                  icon={<FileText className="size-6 text-gray-400" />}
                  title={t("pdf_preview_not_supported")}
                  description={t("pdf_preview_not_supported_description")}
                  action={
                    <Button
                      variant="primary"
                      onClick={() => window.open(pdfUrl, "_blank")}
                      aria-label={t("open_pdf")}
                    >
                      <Download className="size-4" />
                      {t("open_pdf")}
                    </Button>
                  }
                  className="size-full"
                />
              </object>
            )}
          </div>
        </div>
      </div>
    </Page>
  );
}

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

function ReportList({
  reports,
  selectedReportId,
  onSelectReport,
}: {
  reports: ReportReadList[];
  isGenerating: boolean;
  selectedReportId: string | null;
  onSelectReport: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {reports.map((report) => {
        const isSelected = selectedReportId === report.id;

        return (
          <Card
            key={report.id}
            onClick={() => onSelectReport(report.id)}
            className={cn(
              "rounded-md relative cursor-pointer transition-colors w-full bg-gray-50 hover:bg-gray-100 shadow-none",
              isSelected && "bg-white border-primary-600 shadow-md",
            )}
          >
            {isSelected && (
              <ArrowRight className="absolute text-primary-700 right-3 size-4 inset-y-1/2 -translate-y-1/2" />
            )}
            <CardContent
              className={cn(
                "flex flex-col px-3 py-2.5 gap-1",
                isSelected && "pr-8",
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "text-sm font-medium text-gray-700 truncate",
                    isSelected && "text-gray-900",
                  )}
                >
                  {report.name}
                </span>
              </div>
              <span className="flex gap-1 items-center text-xs text-gray-500">
                {formatDateTime(report.created_date, "DD MMM YYYY, hh:mm a")}
                <Dot className="size-2.5 shrink-0 text-gray-700" />
                {relativeTime(report.created_date)}
              </span>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
