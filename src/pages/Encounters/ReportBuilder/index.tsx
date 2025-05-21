import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import Page from "@/components/Common/Page";
import { CardListSkeleton } from "@/components/Common/SkeletonLoading";

import { getPermissions } from "@/common/Permissions";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { usePermissions } from "@/context/PermissionContext";
import reportTemplateApi from "@/types/reportTemplate/reportTemplateApi";

import ReportCard from "./ReportCard";

interface ReportBuilderListProps {
  facilityId: string;
}

export default function ReportBuilderList({
  facilityId,
}: ReportBuilderListProps) {
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();

  const { data: facilityData } = useQuery({
    queryKey: ["facility", facilityId],
    queryFn: query(routes.getPermittedFacility, {
      pathParams: { id: facilityId },
    }),
  });

  const { canManageTemplate, canListTemplate } = getPermissions(
    hasPermission,
    facilityData?.permissions ?? [],
  );
  const { data: reportTemplateData, isLoading: isReportTemplateLoading } =
    useQuery({
      queryKey: ["report-templates", facilityId],
      queryFn: query(reportTemplateApi.list, {
        queryParams: {
          facility: facilityId,
        },
      }),
      enabled: canListTemplate,
    });

  return (
    <Page title={t("available_templates")} hideTitleOnPage className="p-0">
      <div className="container mx-auto">
        <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-2">
          <h3>{t("available_templates")}</h3>
          {canManageTemplate && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="w-full sm:w-auto"
            >
              <Link href={`/reportbuilder/new`}>{t("create_new_report")}</Link>
            </Button>
          )}
        </div>

        {isReportTemplateLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <CardListSkeleton count={5} />
          </div>
        ) : reportTemplateData?.results?.length === 0 ? (
          <div className="text-center text-gray-500 p-5">
            {t("no_templates_found")}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            {reportTemplateData?.results?.map((reportTemplate) => (
              <ReportCard
                key={reportTemplate.id}
                template={reportTemplate}
                buttons={
                  <>
                    {canManageTemplate && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        asChild
                      >
                        <Link href={`/reportbuilder/${reportTemplate.id}`}>
                          {t("edit_template")}
                        </Link>
                      </Button>
                    )}
                  </>
                }
              />
            ))}
          </div>
        )}
      </div>
    </Page>
  );
}
