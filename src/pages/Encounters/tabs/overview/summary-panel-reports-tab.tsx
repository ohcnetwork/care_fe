import { useQuery } from "@tanstack/react-query";
import { Download, NotebookPen, RefreshCw } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { TooltipComponent } from "@/components/ui/tooltip";

import {
  PERMISSION_GENERATE_REPORT_FROM_TEMPLATE,
  PERMISSION_LIST_TEMPLATE,
} from "@/common/Permissions";
import { CardListSkeleton } from "@/components/Common/SkeletonLoading";
import { usePermissions } from "@/context/PermissionContext";
import useReportGeneration from "@/hooks/useReportGeneration";
import { cn } from "@/lib/utils";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import { useCurrentFacilitySilently } from "@/pages/Facility/utils/useCurrentFacility";
import reportApi from "@/types/emr/report/reportApi";
import templateApi from "@/types/emr/template/templateApi";
import query from "@/Utils/request/query";
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

  const canListTemplate = hasPermission(
    PERMISSION_LIST_TEMPLATE,
    facility?.permissions,
  );

  const canGenerateReport = hasPermission(
    PERMISSION_GENERATE_REPORT_FROM_TEMPLATE,
    facility?.permissions,
  );

  const isActive = activeTab === "reports";

  const { data: templatesData, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ["templates", facilityId],
    queryFn: query(templateApi.listTemplates, {
      queryParams: {
        facility: facilityId,
        template_type: "discharge_summary",
        status: "active",
      },
    }),
    enabled: isActive && canListTemplate,
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
    enabled: isActive && !!selectedEncounterId,
  });

  const { generatingTemplateId, downloadingTemplateId, generate, download } =
    useReportGeneration({ encounterId: selectedEncounterId });

  const templates = templatesData?.results ?? [];
  const reports = reportsData?.results ?? [];

  const getReportForTemplate = (templateId: string) =>
    reports.find((report) => report.template?.id === templateId);

  if (isLoadingTemplates || isLoadingReports) {
    return <CardListSkeleton count={1} />;
  }

  return (
    <div className="flex flex-col gap-2 bg-gray-100 @sm:bg-white p-2 @sm:p-3 rounded-lg border border-gray-200 @sm:shadow @sm:overflow-x-auto">
      <div className="flex pl-1 @xs:hidden">
        <h6 className="text-gray-950 font-semibold">{t("reports")}</h6>
      </div>
      <div className="flex flex-col @md:grid @md:grid-cols-2 gap-3">
        <Button variant="outline" className="justify-start w-full" asChild>
          <Link href={`../${selectedEncounterId}/treatment_summary`}>
            <NotebookPen />
            {t("treatment_summary")}
          </Link>
        </Button>

        {templates.map((template) => {
          const latestReport = getReportForTemplate(template.id);
          const isGenerating = generatingTemplateId === template.id;
          const isDownloading = downloadingTemplateId === template.id;

          return (
            <ButtonGroup key={template.id} className="w-full">
              <Button
                variant="outline"
                className="justify-start min-w-0 flex-1"
                onClick={() => generate(template)}
                disabled={isGenerating || !canGenerateReport}
              >
                <RefreshCw
                  className={cn(
                    "size-4 shrink-0",
                    isGenerating && "animate-spin",
                  )}
                />

                <span className="truncate">{template.name}</span>
              </Button>
              {latestReport && !isGenerating && (
                <TooltipComponent
                  content={`${t("download_latest_report")} (${formatDateTime(latestReport.created_date)})`}
                >
                  <Button
                    variant="outline"
                    className="shrink-0"
                    onClick={() => download(latestReport, template.id)}
                    disabled={isDownloading}
                    aria-label={t("download_latest_report")}
                  >
                    <Download className="size-4" />
                  </Button>
                </TooltipComponent>
              )}
            </ButtonGroup>
          );
        })}
      </div>
    </div>
  );
};
