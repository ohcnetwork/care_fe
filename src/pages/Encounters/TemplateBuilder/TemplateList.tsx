import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import templateApi from "@/types/emr/template/templateApi";

import mutate from "@/Utils/request/mutate";
import { getPermissions } from "@/common/Permissions";
import { RESULTS_PER_PAGE_LIMIT } from "@/common/constants";
import { usePermissions } from "@/context/PermissionContext";
import { cn } from "@/lib/utils";
import reportApi from "@/types/emr/report/reportApi";
import { TemplateBaseRead, TemplateTypes } from "@/types/emr/template/template";
import { toast } from "sonner";
import TemplateCard from "./TemplateCard";

interface TemplateListProps {
  facilityId: string;
  permissions: string[];
  enabled: boolean;
  associatingId?: string;
  onSuccess?: () => void;
  showFilters?: boolean;
  className?: string;
}

export default function TemplateList({
  facilityId,
  associatingId,
  permissions,
  enabled,
  onSuccess,
  showFilters = true,
  className,
}: TemplateListProps) {
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();

  const { canListTemplate, canWriteTemplate, canGenerateReportFromTemplate } =
    getPermissions(hasPermission, permissions);
  const { qParams, updateQuery, Pagination } = useFilters({
    limit: RESULTS_PER_PAGE_LIMIT,
    disableCache: true,
  });

  const { data: templatesData, isLoading: isTemplatesLoading } = useQuery({
    queryKey: ["templates", facilityId, qParams],
    queryFn: query(templateApi.listTemplates, {
      queryParams: {
        facility: facilityId,
        name: qParams.name,
        template_type: qParams.template_type,
        status: qParams.status,
        limit: RESULTS_PER_PAGE_LIMIT,
        offset: ((qParams.page ?? 1) - 1) * RESULTS_PER_PAGE_LIMIT,
      },
    }),
    enabled: enabled && canListTemplate,
  });

  const { mutate: generateReport, isPending: isGenerating } = useMutation({
    mutationFn: mutate(reportApi.createReport),
    onSuccess: () => {
      toast.success(t("report_generation_started"));
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || t("report_generation_failed"));
    },
  });

  const handleGenerateReport = (template: TemplateBaseRead) => {
    generateReport({
      template_id: template.id,
      associating_id: associatingId ?? "",
      output_format: template.default_format,
      options: JSON.stringify({}),
      force: false,
    });
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      {showFilters && (
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center mt-3">
          <div className="relative flex-3 w-full sm:w-auto">
            <CareIcon
              icon="l-search"
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <Input
              type="search"
              placeholder={t("search_templates")}
              value={qParams.name || ""}
              onChange={(e) => updateQuery({ name: e.target.value })}
              className="pl-10 w-full sm:w-auto"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-center self-end w-full sm:w-[40rem]!">
            <Select
              value={qParams.status || "all"}
              onValueChange={(value) =>
                updateQuery({ status: value === "all" ? undefined : value })
              }
            >
              <SelectTrigger className="w-full sm:w-auto">
                <SelectValue placeholder={t("filter_by_status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all_statuses")}</SelectItem>
                <SelectItem value="draft">{t("draft")}</SelectItem>
                <SelectItem value="active">{t("active")}</SelectItem>
                <SelectItem value="retired">{t("archived")}</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={qParams.template_type || "all"}
              onValueChange={(value) =>
                updateQuery({
                  template_type: value === "all" ? undefined : value,
                })
              }
            >
              <SelectTrigger className="w-full sm:w-auto">
                <SelectValue placeholder={t("filter_by_type")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all_types")}</SelectItem>
                {TemplateTypes.map((templateType) => (
                  <SelectItem key={templateType} value={templateType}>
                    {t(templateType)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Template List */}
      {isTemplatesLoading ? (
        <CardGridSkeleton count={12} />
      ) : !templatesData?.results || templatesData.results.length === 0 ? (
        <EmptyState
          icon={
            <CareIcon
              icon="l-file-medical-alt"
              className="text-blue-500 text-2xl"
            />
          }
          title={t("no_templates_found")}
          description={
            qParams.name || qParams.status || qParams.template_type
              ? t("no_templates_match_search")
              : t("template_list_description")
          }
          action={
            !qParams.name &&
            !qParams.status &&
            !qParams.template_type && (
              <Button variant="outline_primary" asChild>
                <Link href={`/facility/${facilityId}/template/builder`}>
                  <CareIcon icon="l-plus" className="mr-1" />
                  <span>{t("create_first_template")}</span>
                </Link>
              </Button>
            )
          }
          className="my-4 bg-gray-50"
        />
      ) : (
        <>
          <div className={cn("gap-4 py-2", className)}>
            {templatesData.results.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                buttons={
                  <>
                    {canWriteTemplate && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        asChild
                      >
                        <Link
                          href={`/facility/${facilityId}/template/builder/${template.slug}`}
                        >
                          <CareIcon icon="l-pen" className="mr-1" />
                          <span>{t("edit")}</span>
                        </Link>
                      </Button>
                    )}
                    {associatingId && canGenerateReportFromTemplate && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleGenerateReport(template)}
                        disabled={isGenerating || template.status !== "active"}
                      >
                        {isGenerating ? t("generating") : t("generate_report")}
                      </Button>
                    )}
                  </>
                }
              />
            ))}
          </div>

          {/* Pagination */}
          {templatesData.count > 0 && (
            <div className="flex justify-center mt-4">
              <Pagination totalCount={templatesData.count} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
