import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, NotebookPen, RefreshCw } from "lucide-react";
import { Link } from "raviger";
import { useEffect, useRef, useState } from "react";
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
import { useCurrentFacilitySilently } from "@/pages/Facility/utils/useCurrentFacility";
import { ReportReadList } from "@/types/emr/report/report";
import reportApi from "@/types/emr/report/reportApi";
import { TemplateBaseRead } from "@/types/emr/template/template";
import templateApi from "@/types/emr/template/templateApi";
import mutate from "@/Utils/request/mutate";
import query, { callApi } from "@/Utils/request/query";
import { formatDateTime } from "@/Utils/utils";

export const SummaryPanelReportsTab = ({
  activeTab,
}: {
  activeTab: string;
}) => {
  const { selectedEncounterId, facilityId } = useEncounter();
  const { facility } = useCurrentFacilitySilently();
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  const queryClient = useQueryClient();
  const [downloadingTemplateId, setDownloadingTemplateId] = useState<
    string | null
  >(null);
  const [generatingTemplateId, setGeneratingTemplateId] = useState<
    string | null
  >(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const generationStartTimeRef = useRef<Date | null>(null);

  const canListTemplate = hasPermission(
    PERMISSION_LIST_TEMPLATE,
    facility?.permissions,
  );

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

  const { data: reportsData, isLoading: isLoadingReports } = useQuery({
    queryKey: ["reports", selectedEncounterId],
    queryFn: query(reportApi.listReports, {
      queryParams: {
        associating_id: selectedEncounterId,
        upload_completed: "true",
        report_type: "discharge_summary",
        is_archived: "false",
        limit: 50,
      },
    }),
    enabled: activeTab === "reports" && !!selectedEncounterId,
  });

  const templates = templatesData?.results || [];
  const generatedReports = reportsData?.results || [];
  const isLoading = isLoadingTemplates || isLoadingReports;

  const getReportForTemplate = (templateId: string) =>
    generatedReports.find((report) => report.template?.id === templateId);

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
    generationStartTimeRef.current = null;
  };

  const downloadFile = async (report: ReportReadList) => {
    const data = await queryClient.fetchQuery({
      queryKey: ["report", report.id],
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
    const link = document.createElement("a");
    link.href = url;
    link.download = report.name || report.report_type || "report";
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const fetchFreshReportForTemplate = async (templateSlug: string) => {
    await queryClient.invalidateQueries({
      queryKey: ["reports", selectedEncounterId],
    });

    const data = await queryClient.fetchQuery({
      queryKey: [
        "reports",
        selectedEncounterId,
        "template",
        templateSlug,
        "fresh",
        Date.now(),
      ],
      queryFn: query(reportApi.listReports, {
        queryParams: {
          associating_id: selectedEncounterId,
          upload_completed: "true",
          report_type: "discharge_summary",
          is_archived: "false",
          template: templateSlug,
          limit: 1,
        },
      }),
    });

    return data?.results?.[0];
  };

  const pollGenerationStatus = async (template: TemplateBaseRead) => {
    try {
      const response = await callApi(reportApi.createReport, {
        body: {
          template_id: template.id,
          associating_id: selectedEncounterId,
          output_format: template.default_format,
          options: JSON.stringify({}),
          force: false,
          status_check: true,
        },
      });

      if (!response || Object.keys(response).length === 0) {
        stopPolling();

        const newReport = await fetchFreshReportForTemplate(template.slug);

        const isNewReport =
          newReport &&
          generationStartTimeRef.current &&
          new Date(newReport.created_date) > generationStartTimeRef.current;

        if (isNewReport) {
          await downloadFile(newReport);
          toast.success(t("file_download_completed"));
        } else {
          toast.error(t("report_generation_failed"));
        }

        await queryClient.invalidateQueries({
          queryKey: ["reports", selectedEncounterId],
        });
        setGeneratingTemplateId(null);
      }
    } catch {
      // Continue polling on error
    }
  };

  const startPolling = (template: TemplateBaseRead) => {
    if (pollingIntervalRef.current || pollingTimeoutRef.current) {
      return;
    }

    pollingIntervalRef.current = setInterval(
      () => pollGenerationStatus(template),
      2000,
    );

    pollingTimeoutRef.current = setTimeout(() => {
      stopPolling();
      setGeneratingTemplateId(null);
      toast.error(t("report_generation_taking_longer"));
    }, 10000);
  };

  useEffect(() => stopPolling, []);

  const { mutate: generateReport } = useMutation({
    mutationFn: mutate(reportApi.createReport),
    onError: (error) => {
      toast.error(error.message || t("report_generation_failed"));
      stopPolling();
      setGeneratingTemplateId(null);
    },
  });

  const handleDownload = async (report: ReportReadList, templateId: string) => {
    setDownloadingTemplateId(templateId);
    try {
      await downloadFile(report);
      toast.success(t("file_download_completed"));
    } catch {
      toast.error(t("file_download_failed"));
    } finally {
      setDownloadingTemplateId(null);
    }
  };

  const handleGenerate = (template: TemplateBaseRead) => {
    if (generatingTemplateId || pollingIntervalRef.current) {
      toast.info(t("report_generation_in_progress"));
      return;
    }

    setGeneratingTemplateId(template.id);
    generationStartTimeRef.current = new Date();
    generateReport(
      {
        template_id: template.id,
        associating_id: selectedEncounterId,
        output_format: template.default_format,
        options: JSON.stringify({}),
        force: false,
      },
      {
        onSuccess: () => {
          toast.success(t("report_generation_started"));
          startPolling(template);
        },
      },
    );
  };

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
          const latestReport = getReportForTemplate(template.id);
          const isGenerating = generatingTemplateId === template.id;
          const isDownloading = downloadingTemplateId === template.id;

          return latestReport ? (
            <ButtonGroup key={template.id} className="w-full">
              <TooltipComponent
                content={`${t("download_latest_report")} (${formatDateTime(latestReport.created_date)})`}
              >
                <Button
                  variant="outline"
                  className="justify-start sm:@sm:justify-center min-w-0 flex-1"
                  onClick={() => handleDownload(latestReport, template.id)}
                  disabled={isDownloading || isGenerating}
                >
                  <Download className="shrink-0" />
                  <span className="truncate">{template.name}</span>
                </Button>
              </TooltipComponent>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={() => handleGenerate(template)}
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
              onClick={() => handleGenerate(template)}
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
