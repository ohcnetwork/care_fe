import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, FileText, NotebookPen, RefreshCw } from "lucide-react";
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
import { useCurrentFacilitySilently } from "@/pages/Facility/utils/useCurrentFacility";
import { ReportReadList } from "@/types/emr/report/report";
import reportApi from "@/types/emr/report/reportApi";
import { TemplateBaseRead } from "@/types/emr/template/template";
import templateApi from "@/types/emr/template/templateApi";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";

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
  const [generatingTemplateId, setGeneratingTemplateId] = useState<
    string | null
  >(null);
  const [generationStartTime, setGenerationStartTime] = useState<number | null>(
    null,
  );

  const resetGenerationState = () => {
    setGeneratingTemplateId(null);
    setGenerationStartTime(null);
  };

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

  // Poll for report generation status with timeout
  const { data: generationStatusData } = useQuery<
    PaginatedResponse<ReportReadList>
  >({
    queryKey: [
      "report-generation-status",
      selectedEncounterId,
      generatingTemplateId,
    ],
    queryFn: query(reportApi.listReports, {
      queryParams: {
        associating_id: selectedEncounterId,
        upload_completed: "true",
        report_type: "discharge_summary",
        is_archived: "false",
        limit: 1,
      },
    }),
    enabled: !!generatingTemplateId && !!selectedEncounterId,
    refetchInterval: (query) => {
      if (generationStartTime && Date.now() - generationStartTime > 10000) {
        resetGenerationState();
        toast.error(t("report_generation_failed"));
        return false;
      }

      const latestReport = query.state.data?.results?.[0];
      const hasNewReport =
        latestReport &&
        latestReport.template?.id === generatingTemplateId &&
        generationStartTime &&
        new Date(latestReport.created_date).getTime() > generationStartTime;

      return hasNewReport ? false : 2000;
    },
  });

  useEffect(() => {
    const latestReport = generationStatusData?.results?.[0];
    const latestReportId = latestReport?.id;

    if (
      !latestReportId ||
      !latestReport ||
      !generatingTemplateId ||
      !generationStartTime
    ) {
      return;
    }

    if (
      latestReport.template?.id !== generatingTemplateId ||
      new Date(latestReport.created_date).getTime() <= generationStartTime
    ) {
      return;
    }

    const downloadNewReport = async () => {
      try {
        const reportData = await queryClient.fetchQuery({
          queryKey: ["report", latestReportId],
          queryFn: query(reportApi.retrieveReport, {
            pathParams: { id: latestReportId },
          }),
        });

        if (reportData?.read_signed_url) {
          const filename =
            latestReport.name || latestReport.report_type || "report";
          await downloadFileFromUrl(reportData.read_signed_url, filename);
          toast.success(t("file_download_completed"));
        }

        await queryClient.invalidateQueries({
          queryKey: ["reports", selectedEncounterId],
        });
        resetGenerationState();
      } catch (error) {
        console.error("Error downloading report:", error);
        toast.error(t("file_download_failed"));
      }
    };

    downloadNewReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    generatingTemplateId,
    generationStartTime,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    generationStatusData?.results?.[0]?.id,
    selectedEncounterId,
  ]);

  const { mutate: generateReport } = useMutation({
    mutationFn: mutate(reportApi.createReport),
    onSuccess: () => {
      toast.success(t("report_generation_started"));
    },
    onError: (error) => {
      toast.error(error.message || t("report_generation_failed"));
      resetGenerationState();
    },
  });

  const { mutate: downloadReport } = useMutation({
    mutationFn: async (report: ReportReadList) => {
      const data = await queryClient.fetchQuery({
        queryKey: ["report", report.id],
        queryFn: query(reportApi.retrieveReport, {
          pathParams: { id: report.id },
        }),
      });

      const filename = report.name || report.report_type || "report";
      await downloadFileFromUrl(data.read_signed_url, filename);
    },
    onSuccess: () => {
      toast.success(t("file_download_completed"));
    },
    onError: () => {
      toast.error(t("file_download_failed"));
    },
  });

  const handleGenerate = (template: TemplateBaseRead) => {
    if (generatingTemplateId) {
      toast.info(t("report_generation_in_progress"));
      return;
    }

    setGeneratingTemplateId(template.id);
    setGenerationStartTime(Date.now());
    generateReport({
      template_id: template.id,
      associating_id: selectedEncounterId,
      output_format: template.default_format,
      options: JSON.stringify({}),
      force: false,
    });
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

          return (
            <ButtonGroup key={template.id} className="w-full">
              <Button
                variant="outline"
                className="justify-start sm:@sm:justify-center min-w-0 flex-1"
                asChild
              >
                <Link
                  href={`../${selectedEncounterId}/reports/${template.slug}`}
                >
                  {latestReport ? (
                    <FileText className="shrink-0" />
                  ) : (
                    <NotebookPen className="shrink-0" />
                  )}
                  <span className="truncate">{template.name}</span>
                </Link>
              </Button>
              {latestReport && (
                <>
                  <TooltipComponent content={t("download_latest_report")}>
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      onClick={() => downloadReport(latestReport)}
                      disabled={isGenerating}
                    >
                      <Download className="size-4" />
                    </Button>
                  </TooltipComponent>
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={() => handleGenerate(template)}
                    disabled={isGenerating}
                    aria-label={t("regenerate")}
                    title={t("regenerate")}
                  >
                    <RefreshCw
                      className={cn("size-4", isGenerating && "animate-spin")}
                    />
                  </Button>
                </>
              )}
            </ButtonGroup>
          );
        })}
      </div>
    </div>
  );
};
