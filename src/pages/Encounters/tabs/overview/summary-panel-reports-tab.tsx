import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import { PERMISSION_LIST_TEMPLATE } from "@/common/Permissions";
import { CardListSkeleton } from "@/components/Common/SkeletonLoading";
import { ClinicalListError } from "@/components/Patient/Common/ClinicalListError";
import { useHasPermission } from "@/context/PermissionContext";
import { cn } from "@/lib/utils";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import { useCurrentFacilitySilently } from "@/pages/Facility/utils/useCurrentFacility";
import templateApi from "@/types/emr/template/templateApi";
import query from "@/Utils/request/query";

interface SummaryPanelReportsTabProps {
  activeTab: string;
  title?: string;
  embedded?: boolean;
}

export const SummaryPanelReportsTab = ({
  activeTab,
  title,
  embedded = false,
}: SummaryPanelReportsTabProps) => {
  const { selectedEncounter, facilityId: routeFacilityId } = useEncounter();
  const { facility } = useCurrentFacilitySilently();
  const facilityId = selectedEncounter?.facility.id;
  const { t } = useTranslation();
  const canListTemplate = useHasPermission(
    PERMISSION_LIST_TEMPLATE,
    facility?.permissions,
  );

  const isActive = activeTab === "reports";
  const hasFacilityContext =
    !!facilityId &&
    routeFacilityId === facilityId &&
    facility?.id === facilityId;

  const {
    data: templatesData,
    isLoading: isLoadingTemplates,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["templates", facilityId, "discharge_summary"],
    queryFn: query(templateApi.listTemplates, {
      queryParams: {
        facility: facilityId,
        template_type: "discharge_summary",
        status: "active",
      },
    }),
    enabled: isActive && hasFacilityContext && canListTemplate,
  });

  const templates = templatesData?.results ?? [];

  if (!hasFacilityContext || !canListTemplate || !selectedEncounter)
    return null;

  if (isLoadingTemplates) {
    return <CardListSkeleton count={1} />;
  }

  return (
    <section
      aria-label={title ?? t("reports")}
      className="flex min-w-0 flex-col gap-3 rounded-xl border border-gray-200 bg-white p-3"
    >
      <div
        className={cn(
          "-mx-3 -mt-3 flex border-b border-gray-200 px-3 py-3",
          !embedded && "@xs:hidden",
        )}
      >
        <h3 className="min-w-0 text-sm font-bold uppercase tracking-wide text-gray-600 [overflow-wrap:anywhere]">
          {title ?? t("reports")}
        </h3>
      </div>
      {isError && (
        <ClinicalListError isFetching={isFetching} onRetry={refetch} />
      )}
      <div
        className={cn(
          "flex min-w-0 flex-col gap-3",
          !embedded && "@md:grid @md:grid-cols-2",
        )}
      >
        {!isError && templates.length === 0 && (
          <p className="text-sm text-gray-500">{t("no_templates_found")}</p>
        )}
        {templates.map((template) => (
          <Button
            key={template.id}
            variant="outline"
            className="h-auto min-h-9 justify-start w-full whitespace-normal"
            asChild
          >
            <Link
              href={`/facility/${facilityId}/patient/${selectedEncounter.patient.id}/encounter/${selectedEncounter.id}/report/template/${template.slug}`}
            >
              <FileText className="size-4 shrink-0" />
              <span className="min-w-0 text-left [overflow-wrap:anywhere]">
                {template.name}
              </span>
            </Link>
          </Button>
        ))}
      </div>
    </section>
  );
};
