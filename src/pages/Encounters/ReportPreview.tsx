import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ChevronLeft,
  Download,
  FileText,
  Loader2,
  Printer,
  RefreshCw,
} from "lucide-react";
import { Link } from "raviger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import Page from "@/components/Common/Page";
import { cn } from "@/lib/utils";
import { ReportReadList } from "@/types/emr/report/report";
import reportApi from "@/types/emr/report/reportApi";
import templateApi from "@/types/emr/template/templateApi";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { formatDateTime } from "@/Utils/utils";

interface ReportPreviewByTemplateProps {
  facilityId: string;
  patientId: string;
  encounterId: string;
  templateSlug: string;
  reportId?: undefined;
}

interface ReportPreviewByReportProps {
  facilityId: string;
  patientId: string;
  encounterId: string;
  reportId: string;
  templateSlug?: undefined;
}

type ReportPreviewProps =
  | ReportPreviewByTemplateProps
  | ReportPreviewByReportProps;

const downloadFileFromUrl = async (
  signedUrl: string,
  filename: string,
): Promise<void> => {
  const response = await fetch(signedUrl);
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
};

export default function ReportPreview({
  facilityId,
  patientId,
  encounterId,
  templateSlug,
  reportId,
}: ReportPreviewProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedReportId, setSelectedReportId] = useState<string | null>(
    reportId ?? null,
  );
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStartTime, setGenerationStartTime] = useState<number | null>(
    null,
  );

  const backUrl = `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/updates`;

  // When opened by reportId, fetch that report to derive the template
  const { data: initialReport, isLoading: isLoadingInitialReport } = useQuery({
    queryKey: ["report", reportId],
    queryFn: query(reportApi.retrieveReport, {
      pathParams: { id: reportId! },
    }),
    enabled: !!reportId && !templateSlug,
  });

  // Resolve template slug: either from props or from the initial report's template
  const resolvedTemplateId = templateSlug
    ? undefined
    : initialReport?.template?.id;

  // Fetch template by slug (when templateSlug is provided)
  const { data: templateBySlug, isLoading: isLoadingTemplateBySlug } = useQuery(
    {
      queryKey: ["template", templateSlug],
      queryFn: query(templateApi.retrieveTemplate, {
        pathParams: { slug: templateSlug! },
      }),
      enabled: !!templateSlug,
    },
  );

  // Derive template info from whichever source is available
  const template = templateBySlug;
  const templateId = template?.id ?? resolvedTemplateId;
  const templateName =
    template?.name ?? initialReport?.template?.name ?? t("report");
  const isLoadingTemplate = templateSlug
    ? isLoadingTemplateBySlug
    : isLoadingInitialReport;

  // Fetch all reports for this encounter + template
  const { data: reportsData, isLoading: isLoadingReports } = useQuery({
    queryKey: ["reports", encounterId, templateId],
    queryFn: query(reportApi.listReports, {
      queryParams: {
        associating_id: encounterId,
        upload_completed: "true",
        report_type: "discharge_summary",
        is_archived: "false",
        ...(templateSlug ? { template: templateSlug } : {}),
        limit: 50,
      },
    }),
    enabled: !!encounterId && !!templateId,
  });

  const allReports = reportsData?.results || [];
  const reports = allReports.filter(
    (report) => report.template?.id === templateId,
  );
  const latestReport = reports[0];

  // Auto-generate if no reports exist
  const { mutate: generateReport } = useMutation({
    mutationFn: mutate(reportApi.createReport),
    onSuccess: () => {
      toast.success(t("report_generation_started"));
    },
    onError: (error) => {
      toast.error(error.message || t("report_generation_failed"));
      setIsGenerating(false);
      setGenerationStartTime(null);
    },
  });

  // Auto-generate when template loaded but no reports exist (only in template-slug mode)
  useEffect(() => {
    if (
      template &&
      templateSlug &&
      !isLoadingReports &&
      reports.length === 0 &&
      !isGenerating
    ) {
      setIsGenerating(true);
      setGenerationStartTime(Date.now());
      generateReport({
        template_id: template.id,
        associating_id: encounterId,
        output_format: template.default_format,
        options: JSON.stringify({}),
        force: false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template?.id, isLoadingReports, reports.length]);

  // Poll for report generation status
  const { data: generationStatusData } = useQuery<
    PaginatedResponse<ReportReadList>
  >({
    queryKey: [
      "report-generation-status",
      encounterId,
      templateId,
      generationStartTime,
    ],
    queryFn: query(reportApi.listReports, {
      queryParams: {
        associating_id: encounterId,
        upload_completed: "true",
        report_type: "discharge_summary",
        is_archived: "false",
        limit: 1,
      },
    }),
    enabled: isGenerating && !!generationStartTime && !!encounterId,
    refetchInterval: (query) => {
      if (generationStartTime && Date.now() - generationStartTime > 30000) {
        setIsGenerating(false);
        setGenerationStartTime(null);
        toast.error(t("report_generation_failed"));
        return false;
      }

      const latestReport = query.state.data?.results?.[0];
      const hasNewReport =
        latestReport &&
        latestReport.template?.id === templateId &&
        generationStartTime &&
        new Date(latestReport.created_date).getTime() > generationStartTime;

      return hasNewReport ? false : 2000;
    },
  });

  // Handle when generation completes
  useEffect(() => {
    const latestGenerated = generationStatusData?.results?.[0];
    if (
      !latestGenerated ||
      !isGenerating ||
      !generationStartTime ||
      !templateId
    ) {
      return;
    }

    if (
      latestGenerated.template?.id !== templateId ||
      new Date(latestGenerated.created_date).getTime() <= generationStartTime
    ) {
      return;
    }

    setIsGenerating(false);
    setGenerationStartTime(null);
    queryClient.invalidateQueries({
      queryKey: ["reports", encounterId, templateId],
    });
  }, [
    generationStatusData?.results,
    isGenerating,
    generationStartTime,
    templateId,
    encounterId,
    queryClient,
  ]);

  // Select latest report by default
  useEffect(() => {
    if (latestReport && !selectedReportId) {
      setSelectedReportId(latestReport.id);
    }
  }, [latestReport, selectedReportId]);

  // Fetch the selected report's signed URL and load PDF
  const selectedReport = reports.find((r) => r.id === selectedReportId);

  const { data: reportDetail } = useQuery({
    queryKey: ["report", selectedReportId],
    queryFn: query(reportApi.retrieveReport, {
      pathParams: { id: selectedReportId! },
    }),
    enabled: !!selectedReportId,
  });

  // Load PDF blob when report detail changes
  useEffect(() => {
    if (!reportDetail?.read_signed_url) {
      setPdfBlobUrl(null);
      return;
    }

    let cancelled = false;
    setIsLoadingPdf(true);

    const loadPdf = async () => {
      try {
        const response = await fetch(reportDetail.read_signed_url);
        const blob = await response.blob();
        if (!cancelled) {
          const url = URL.createObjectURL(blob);
          setPdfBlobUrl(url);
        }
      } catch {
        if (!cancelled) {
          toast.error(t("file_download_failed"));
        }
      } finally {
        if (!cancelled) {
          setIsLoadingPdf(false);
        }
      }
    };

    loadPdf();

    return () => {
      cancelled = true;
    };
  }, [reportDetail?.read_signed_url, t]);

  // Cleanup blob URLs
  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfBlobUrl]);

  const handleDownload = async () => {
    if (!reportDetail?.read_signed_url || !selectedReport) return;
    const filename =
      selectedReport.name || selectedReport.report_type || "report";
    await downloadFileFromUrl(reportDetail.read_signed_url, filename);
    toast.success(t("file_download_completed"));
  };

  const handlePrint = () => {
    if (!pdfBlobUrl) return;
    const printWindow = window.open(pdfBlobUrl);
    if (printWindow) {
      printWindow.addEventListener("load", () => {
        printWindow.print();
      });
    }
  };

  const handleRegenerate = () => {
    if (!template || !templateId || isGenerating) return;
    setIsGenerating(true);
    setGenerationStartTime(Date.now());
    setSelectedReportId(null);
    setPdfBlobUrl(null);
    generateReport({
      template_id: templateId,
      associating_id: encounterId,
      output_format: template.default_format,
      options: JSON.stringify({}),
      force: false,
    });
  };

  const isInitialLoading = isLoadingTemplate || isLoadingReports;

  if (isInitialLoading) {
    return (
      <Page title={t("report")}>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="size-8 animate-spin text-gray-400" />
        </div>
      </Page>
    );
  }

  if (!templateId) {
    return (
      <Page title={t("report")}>
        <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-gray-200 border-dashed p-4 text-gray-500">
          {t("template_not_found")}
        </div>
      </Page>
    );
  }

  return (
    <Page
      title={templateName}
      options={
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={backUrl}>
              <ChevronLeft className="size-4" />
              {t("back")}
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={handleRegenerate}
            disabled={isGenerating || !template}
          >
            <RefreshCw
              className={cn("size-4", isGenerating && "animate-spin")}
            />
            {t("regenerate")}
          </Button>
          <Button
            variant="outline"
            onClick={handlePrint}
            disabled={!pdfBlobUrl || isLoadingPdf}
          >
            <Printer className="size-4" />
            {t("print")}
          </Button>
          <Button
            variant="primary"
            onClick={handleDownload}
            disabled={!reportDetail?.read_signed_url}
          >
            <Download className="size-4" />
            {t("download")}
          </Button>
        </div>
      }
    >
      <div className="flex gap-4 mt-4 h-[calc(100vh-10rem)]">
        {/* Left sidebar - Historical reports */}
        <div className="w-64 shrink-0 flex flex-col border border-gray-200 rounded-lg bg-white overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-700">
              {t("reports")}
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {reports.length === 0 && !isGenerating ? (
              <div className="flex flex-col items-center justify-center p-4 text-gray-400 text-sm">
                <FileText className="size-8 mb-2" />
                {t("no_reports_found")}
              </div>
            ) : (
              <div className="flex flex-col">
                {reports.map((report) => (
                  <button
                    key={report.id}
                    onClick={() => setSelectedReportId(report.id)}
                    className={cn(
                      "flex flex-col gap-1 px-3 py-2.5 text-left border-b border-gray-100 transition-colors hover:bg-gray-50",
                      selectedReportId === report.id && "bg-primary-50",
                    )}
                  >
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {report.name || templateName}
                    </span>
                    <span className="text-xs text-gray-500">
                      {format(
                        new Date(report.created_date),
                        "dd MMM yyyy, hh:mm a",
                      )}
                    </span>
                    {report.uploaded_by && (
                      <span className="text-xs text-gray-400">
                        {formatDateTime(report.created_date)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main content - PDF Preview */}
        <div className="flex-1 flex flex-col rounded-lg border border-gray-200 bg-white overflow-hidden">
          {isGenerating ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-500">
              <Loader2 className="size-10 animate-spin text-primary-500" />
              <p className="text-sm font-medium">{t("generating_report")}</p>
              <p className="text-xs text-gray-400">
                {t("report_generation_in_progress")}
              </p>
            </div>
          ) : isLoadingPdf ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="size-8 animate-spin text-gray-400" />
            </div>
          ) : pdfBlobUrl ? (
            <iframe
              src={pdfBlobUrl}
              className="flex-1 w-full"
              title={selectedReport?.name || templateName}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400">
              <FileText className="size-12" />
              <p className="text-sm">{t("no_reports_found")}</p>
              <Button variant="outline" onClick={handleRegenerate}>
                {t("generate_report")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}
