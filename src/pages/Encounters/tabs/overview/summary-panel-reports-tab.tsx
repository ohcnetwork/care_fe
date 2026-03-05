import { useQuery } from "@tanstack/react-query";
import { FileText, NotebookPen } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import { PERMISSION_LIST_TEMPLATE } from "@/common/Permissions";
import { CardListSkeleton } from "@/components/Common/SkeletonLoading";
import { usePermissions } from "@/context/PermissionContext";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import { useCurrentFacilitySilently } from "@/pages/Facility/utils/useCurrentFacility";
import templateApi from "@/types/emr/template/templateApi";
import query from "@/Utils/request/query";

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

  const templates = templatesData?.results ?? [];

  if (isLoadingTemplates) {
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

        {templates.map((template) => (
          <Button
            key={template.id}
            variant="outline"
            className="justify-start w-full"
            asChild
          >
            <Link
              href={`../${selectedEncounterId}/report/template/${template.slug}`}
            >
              <FileText className="size-4 shrink-0" />
              <span className="truncate">{template.name}</span>
            </Link>
          </Button>
        ))}
      </div>
    </div>
  );
};
