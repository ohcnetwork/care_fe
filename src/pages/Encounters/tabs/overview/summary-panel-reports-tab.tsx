import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, NotebookPen, RefreshCw } from "lucide-react";
import { Link } from "raviger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { TooltipComponent } from "@/components/ui/tooltip";

import { PERMISSION_LIST_TEMPLATE } from "@/common/Permissions";
import { CardListSkeleton } from "@/components/Common/SkeletonLoading";
import { usePermissions } from "@/context/PermissionContext";
import { cn } from "@/lib/utils";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import { ReportReadList } from "@/types/emr/report/report";
import reportApi from "@/types/emr/report/reportApi";
import { TemplateBaseRead } from "@/types/emr/template/template";
import templateApi from "@/types/emr/template/templateApi";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { formatDateTime } from "@/Utils/utils";

export const SummaryPanelReportsTab = ({
  activeTab,
}: {
  activeTab: string;
}) => {
  const { selectedEncounterId, facilityId } = useEncounter();
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  const queryClient = useQueryClient();
  const [downloadingTemplateId, setDownloadingTemplateId] = useState<
    string | null
  >(null);
  const [generatingTemplateId, setGeneratingTemplateId] = useState<
    string | null
  >(null);
  const [previousReportCount, setPreviousReportCount] = useState<number | null>(
    null,
  );

  const canListTemplate = hasPermission(PERMISSION_LIST_TEMPLATE);

  const { data: templatesData, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ["templates", facilityId],
    queryFn: query(templateApi.listTemplates, {
      queryParams: {
        facility: facilityId,
        template_type: "discharge_summary",
        status: "active",
      },
    }),
    enabled: activeTab === "reports" && canListTemplate,
  });

  const isPolling =
    activeTab === "reports" &&
    generatingTemplateId !== null &&
    previousReportCount !== null;

  const { data: reportsData, isLoading: isLoadingReports } = useQuery({
    queryKey: ["reports", selectedEncounterId],
    queryFn: query(reportApi.listReports, {
      queryParams: {
        associating_id: selectedEncounterId,
        upload_completed: "true",
        report_type: "discharge_summary",
        is_archived: "false",
      },
    }),
    enabled: activeTab === "reports" && !!selectedEncounterId,
    refetchInterval: isPolling ? 2000 : false,
  });

  const generatedReports = reportsData?.results || [];

  const getLatestReportForTemplate = (templateId: string) => {
    return generatedReports.find(
      (report) => report.template?.id === templateId,
    );
  };

  const fetchAndDownload = async (report: ReportReadList) => {
    const data = await queryClient.fetchQuery({
      queryKey: ["report", report.id],
      queryFn: query(reportApi.retrieveReport, {
        pathParams: { id: report.id },
      }),
    });

    if (!data?.read_signed_url) {
      throw new Error("Download URL not available");
    }

    const response = await fetch(data?.read_signed_url || "");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = report.name || report.report_type || "report";
    link.click();
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (
      isPolling &&
      reportsData?.count !== undefined &&
      reportsData.count > previousReportCount
    ) {
      const newReport = reportsData.results?.find(
        (r) => r.template?.id === generatingTemplateId,
      );
      if (newReport) {
        fetchAndDownload(newReport).then(
          () => toast.success(t("file_download_completed")),
          () => toast.error(t("file_download_failed")),
        );
      }
      setGeneratingTemplateId(null);
      setPreviousReportCount(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportsData?.count]);

  useEffect(() => {
    if (!isPolling) return;

    const timeoutId = setTimeout(() => {
      setGeneratingTemplateId(null);
      setPreviousReportCount(null);
      toast.error(t("report_generation_taking_longer"));
    }, 10000);

    return () => clearTimeout(timeoutId);
  }, [isPolling, t]);

  const downloadReport = async (report: ReportReadList, templateId: string) => {
    setDownloadingTemplateId(templateId);
    try {
      await fetchAndDownload(report);
      toast.success(t("file_download_completed"));
    } catch {
      toast.error(t("file_download_failed"));
    } finally {
      setDownloadingTemplateId(null);
    }
  };

  const { mutate: generateReport } = useMutation({
    mutationFn: mutate(reportApi.createReport),
    onSuccess: () => {
      toast.success(t("report_generation_started"));
      setPreviousReportCount(reportsData?.count ?? 0);
    },
    onError: (error) => {
      toast.error(error.message || t("report_generation_failed"));
      setGeneratingTemplateId(null);
    },
  });

  const handleGenerateReport = (template: TemplateBaseRead) => {
    setGeneratingTemplateId(template.id);
    generateReport({
      template_id: template.id,
      associating_id: selectedEncounterId,
      output_format: template.default_format,
      options: JSON.stringify({}),
      force: false,
    });
  };

  const templates = templatesData?.results || [];
  const isLoading = isLoadingTemplates || isLoadingReports;

  if (isLoading) {
    return <CardListSkeleton count={1} />;
  }

  return (
    <div className="flex flex-col gap-2 bg-gray-100 @sm:bg-white p-2 @sm:p-3 rounded-lg border border-gray-200 @sm:shadow @sm:overflow-x-auto">
      <div className="flex pl-1 @xs:hidden">
        <h6 className="text-gray-950 font-semibold">{t("reports")}</h6>
      </div>
      <div className="flex flex-col sm:@sm:flex-row gap-3 sm:@sm:gap-4">
        <Button
          variant="outline"
          className="justify-start sm:@sm:justify-center w-full"
          asChild
        >
          <Link href={`../${selectedEncounterId}/treatment_summary`}>
            <NotebookPen />
            {t("treatment_summary")}
          </Link>
        </Button>

        {templates.map((template) => {
          const latestReport = getLatestReportForTemplate(template.id);
          const isGenerating = generatingTemplateId === template.id;
          return latestReport ? (
            <ButtonGroup key={template.id} className="w-full">
              <TooltipComponent
                content={`${t("download_latest_report")} (${formatDateTime(latestReport.created_date)})`}
              >
                <Button
                  variant="outline"
                  className="justify-start sm:@sm:justify-center min-w-0 flex-1"
                  onClick={() => downloadReport(latestReport, template.id)}
                  disabled={
                    downloadingTemplateId === template.id || isGenerating
                  }
                >
                  <Download className="shrink-0" />
                  <span className="truncate">{template.name}</span>
                </Button>
              </TooltipComponent>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={() => handleGenerateReport(template)}
                disabled={isGenerating}
                aria-label={t("regenerate_report")}
                title={t("regenerate_report")}
              >
                <RefreshCw
                  className={cn("size-4", isGenerating && "animate-spin")}
                />
              </Button>
            </ButtonGroup>
          ) : (
            <Button
              key={template.id}
              variant="outline"
              className="justify-start sm:@sm:justify-center w-full"
              onClick={() => handleGenerateReport(template)}
              disabled={isGenerating}
            >
              <NotebookPen className="shrink-0" />
              <span className="truncate">{template.name}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};
