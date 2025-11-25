import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import Page from "@/components/Common/Page";
import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import reportApi from "@/types/emr/report/reportApi";
import templateApi from "@/types/emr/template/templateApi";

import TemplateCard from "./TemplateCard";

interface TemplateListProps {
  facilityId: string;
}

export default function TemplateList({ facilityId }: TemplateListProps) {
  const { t } = useTranslation();
  const { qParams, updateQuery, Pagination } = useFilters({
    limit: 12,
  });

  const { data: templatesData, isLoading: isTemplatesLoading } = useQuery({
    queryKey: ["templates", facilityId, qParams],
    queryFn: query(templateApi.listTemplates, {
      queryParams: {
        facility: facilityId,
        name: qParams.name,
        template_type: qParams.template_type,
        status: qParams.status,
        limit: qParams.limit,
        offset: ((qParams.page || 1) - 1) * qParams.limit,
      },
    }),
  });

  const { data: reportTypes } = useQuery({
    queryKey: ["reportTypes"],
    queryFn: query(reportApi.getReportTypes),
  });

  return (
    <Page
      title={t("templates")}
      options={
        <Button variant="primary" asChild>
          <Link href={`/facility/${facilityId}/template/builder`}>
            <CareIcon icon="l-plus" className="mr-1" />
            <span>{t("create_template")}</span>
          </Link>
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Search and Filters */}
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
                {reportTypes &&
                  Object.entries(reportTypes).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value.display_name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Template List */}
        {isTemplatesLoading ? (
          <CardGridSkeleton count={12} />
        ) : !templatesData?.results || templatesData.results.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-10 border border-dashed border-gray-300 rounded-lg bg-gray-50 my-4">
            <div className="text-center max-w-md">
              <div className="flex flex-row items-center justify-center gap-2">
                <div className="bg-gray-50 p-2 rounded-full size-10 flex items-center justify-center border border-gray-200 shadow-sm">
                  <CareIcon
                    icon="l-file-medical-alt"
                    className="text-blue-500 text-2xl"
                  />
                </div>
                <h4 className="text-xl font-normal text-gray-800">
                  {t("no_templates_found")}
                </h4>
              </div>
              <p className="text-gray-600 text-sm mt-4">
                {qParams.name || qParams.status || qParams.template_type
                  ? t("no_templates_match_search")
                  : t("template_list_description")}
              </p>
              {!qParams.name && !qParams.status && !qParams.template_type && (
                <Button variant="outline_primary" className="mt-4" asChild>
                  <Link href={`/facility/${facilityId}/template/builder`}>
                    <CareIcon icon="l-plus" className="mr-1" />
                    <span>{t("create_first_template")}</span>
                  </Link>
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 py-2">
              {templatesData.results.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  buttons={
                    <>
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
    </Page>
  );
}
