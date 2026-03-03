import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
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
import { Separator } from "@/components/ui/separator";

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [autoGenTriggered, setAutoGenTriggered] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

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

  // Fetch the template by slug
  const { data: template, isLoading: isLoadingTemplate } = useQuery({
    queryKey: ["template", templateSlug],
    queryFn: query(templateApi.retrieveTemplate, {
      pathParams: { slug: templateSlug },
    }),
    enabled: canListTemplate,
  });

  // Fetch all reports for this template + encounter
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

  // Select the latest report by default
  useEffect(() => {
    if (reports.length > 0 && !selectedReportId) {
      setSelectedReportId(reports[0].id);
    }
  }, [reports, selectedReportId]);

  // Fetch selected report detail (to get signed URL)
  const selectedReport = reports.find((r) => r.id === selectedReportId);
  const selectedReportIndex = reports.findIndex(
    (r) => r.id === selectedReportId,
  );

  const { data: reportDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ["report", selectedReportId],
    queryFn: query(reportApi.retrieveReport, {
      pathParams: { id: selectedReportId! },
    }),
    enabled: !!selectedReportId,
  });

  // Clear PDF URL when switching reports to avoid stale state
  useEffect(() => {
    setPdfUrl(null);
  }, [selectedReportId]);

  // When report detail loads, set the PDF URL
  useEffect(() => {
    if (reportDetail?.read_signed_url) {
      setPdfUrl(reportDetail.read_signed_url);
    }
  }, [reportDetail]);

  // Polling helpers
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

        // Non-empty response means still generating
        if (response && Object.keys(response).length > 0) return;

        // Capture startTime before stopPolling clears it
        const startTime = generationStartRef.current;
        stopPolling();

        // Refetch reports and auto-select the new one
        const freshData = await queryClient.fetchQuery({
          queryKey: [
            "reports",
            encounterId,
            "template",
            templateSlug,
            "fresh",
            Date.now(),
          ],
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
        const isNew =
          newReport &&
          startTime &&
          new Date(newReport.created_date) > startTime;

        if (isNew) {
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

  // Auto-generate report if no reports exist
  useEffect(() => {
    if (
      !isLoadingReports &&
      !isLoadingTemplate &&
      template &&
      reports.length === 0 &&
      !autoGenTriggered &&
      canGenerateReport
    ) {
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
          // Fallback: open in new tab if iframe print fails
          window.open(blobUrl, "_blank");
        }
        // Clean up after a delay to allow print dialog to use the blob
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

  return (
    <div>
      <Page
        title={template.name}
        hideTitleOnPage
        options={
          <div className="flex justify-between items-center gap-2 w-full">
            <div className="flex gap-3 items-center">
              <BackButton size="sm">
                <ArrowLeft className="size-4" />
                <span>{t("back")}</span>
              </BackButton>
              <h3 className="text-gray-800">{template.name}</h3>
            </div>
            <div className="flex gap-2">
              {/* Regenerate */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateReport(template)}
                disabled={isGenerating || !canGenerateReport}
              >
                <RefreshCw
                  className={cn("size-4", isGenerating && "animate-spin")}
                />
                {isGenerating ? t("generating_report") : t("regenerate_report")}
              </Button>

              {/* Print */}
              {pdfUrl && (
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="size-4" />
                  {t("print")}
                </Button>
              )}

              {/* Download */}
              {selectedReport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(selectedReport)}
                >
                  <Download className="size-4" />
                  {t("download")}
                </Button>
              )}
            </div>
          </div>
        }
      >
        <div className="flex h-[calc(100vh-10rem)] gap-0 mt-2">
          {/* Sidebar */}
          <div
            className={cn(
              "shrink-0 flex flex-col border-r bg-gray-50/50 transition-all duration-200",
              sidebarOpen ? "w-72" : "w-0 overflow-hidden border-r-0",
            )}
          >
            {/* Sidebar header */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <History className="size-4" />
                {t("report_history")}
              </div>
              <span className="text-xs text-gray-400">
                {reports.length}{" "}
                {reports.length === 1 ? t("version") : t("version")}
              </span>
            </div>
            <Separator />

            {/* Generation in-progress indicator */}
            {isGenerating && (
              <div className="mx-3 mt-3 flex items-center gap-2.5 rounded-lg bg-primary/5 border border-primary/10 px-3 py-2.5 text-sm text-primary">
                <Loader2 className="size-4 animate-spin shrink-0" />
                <span className="font-medium">{t("generating_report")}</span>
              </div>
            )}

            {/* Report versions list */}
            <div className="flex-1 px-3 py-2 overflow-auto">
              <div className="flex flex-col gap-1.5">
                {reports.length === 0 && !isGenerating && (
                  <div className="flex flex-col items-center gap-2 py-12 text-center text-gray-400">
                    <FileText className="size-8" />
                    <p className="text-sm">{t("no_reports_found")}</p>
                  </div>
                )}
                {reports.map((report, index) => {
                  const isSelected = selectedReportId === report.id;
                  const isLatest = index === 0;
                  const uploaderName = report.uploaded_by
                    ? formatName(report.uploaded_by)
                    : undefined;

                  return (
                    <button
                      key={report.id}
                      onClick={() => setSelectedReportId(report.id)}
                      className={cn(
                        "group relative flex flex-col gap-1 rounded-lg px-3 py-2.5 text-left text-sm transition-all w-full",
                        isSelected
                          ? "bg-white shadow-sm ring-1 ring-gray-200"
                          : "hover:bg-white/60",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "font-medium truncate text-sm",
                            isSelected
                              ? "text-gray-900"
                              : "text-gray-600 group-hover:text-gray-900",
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
                        <span>{relativeTime(report.created_date)}</span>
                        {formatDateTime(report.created_date)}
                        {uploaderName && (
                          <>
                            <span>·</span>
                            <span className="truncate">{uploaderName}</span>
                          </>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main content area */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0">
            {/* Viewer toolbar */}
            <div className="flex items-center justify-between border-b bg-white px-3 py-2">
              <div className="flex items-center gap-2">
                {/* Sidebar toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => setSidebarOpen((v) => !v)}
                >
                  {sidebarOpen ? (
                    <PanelLeftClose className="size-4" />
                  ) : (
                    <PanelLeftOpen className="size-4" />
                  )}
                </Button>

                <Separator orientation="vertical" className="h-5" />

                {/* Report meta info */}
                {selectedReport && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="font-medium text-gray-700 truncate max-w-48">
                      {selectedReport.name || template.name}
                    </span>
                    {selectedReportIndex === 0 && reports.length > 0 && (
                      <Badge variant="green" size="sm" className="shrink-0">
                        {t("latest")}
                      </Badge>
                    )}
                    <span className="text-gray-300 hidden sm:inline">·</span>
                    <span className="text-xs text-gray-400 hidden sm:inline">
                      {formatDateTime(selectedReport.created_date)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* PDF content area */}
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
    </div>
  );
}
