import { NotebookPen } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import reportApi from "@/types/emr/report/reportApi";
import { TemplateBaseRead } from "@/types/emr/template/template";
import templateApi from "@/types/emr/template/templateApi";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export const SummaryPanelReportsTab = ({
  activeTab,
}: {
  activeTab: string;
}) => {
  const { selectedEncounterId, selectedEncounterPermissions, facilityId } =
    useEncounter();
  const { t } = useTranslation();

  const canListTemplate = selectedEncounterPermissions.canListTemplate;

  const { data: templatesData } = useQuery({
    queryKey: ["templates", facilityId],
    queryFn: query(templateApi.listTemplates, {
      queryParams: {
        facility: facilityId,
        status: "active",
      },
    }),
    enabled: activeTab === "reports" && canListTemplate,
  });

  const { mutate: generateReport } = useMutation({
    mutationFn: mutate(reportApi.createReport),
    onSuccess: () => {
      toast.success(t("report_generation_started"));
    },
    onError: (error) => {
      toast.error(error.message || t("report_generation_failed"));
    },
  });

  const handleGenerateReport = (template: TemplateBaseRead) => {
    generateReport({
      template_id: template.id,
      associating_id: selectedEncounterId,
      output_format: template.default_format,
      options: JSON.stringify({}),
      force: false,
    });
  };

  const templates =
    templatesData?.results.map((template) => ({
      label: template.name,
      onClick: () => handleGenerateReport(template),
    })) || [];

  const reports = [
    {
      label: t("treatment_summary"),
      href: `../${selectedEncounterId}/treatment_summary`,
    },
    ...templates,
  ] as const satisfies { label: string; href?: string; onClick?: () => void }[];

  return (
    <div className="flex flex-col gap-2 bg-gray-100 @sm:bg-white p-2 @sm:p-3 rounded-lg border border-gray-200 @sm:shadow @sm:overflow-x-auto">
      <div className="flex pl-1 @xs:hidden">
        <h6 className="text-gray-950 font-semibold">{t("reports")}</h6>
      </div>
      <div className="flex flex-col sm:@sm:flex-row gap-3 sm:@sm:gap-4">
        {reports.map((report) =>
          "href" in report && report.href ? (
            <Button
              key={report.label}
              variant="outline"
              className="justify-start sm:@sm:justify-center sm:@sm:flex-1"
              asChild
            >
              <Link href={report.href}>
                <NotebookPen />
                {report.label}
              </Link>
            </Button>
          ) : "onClick" in report && report.onClick ? (
            <Button
              key={report.label}
              variant="outline"
              className="justify-start sm:@sm:justify-center sm:@sm:flex-1"
              onClick={report.onClick}
            >
              <NotebookPen />
              {report.label}
            </Button>
          ) : null,
        )}
      </div>
    </div>
  );
};
