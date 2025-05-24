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
        ) : !reportTemplateData?.results ||
          reportTemplateData?.results?.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-10 border border-dashed border-gray-300 rounded-lg bg-gray-50 my-4">
            <div className="text-center space-y-5 max-w-md">
              <div className="mx-auto bg-white p-4 rounded-full w-16 h-16 flex items-center justify-center border border-gray-200 shadow-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-blue-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h4 className="text-xl font-semibold text-gray-800 mb-2">
                  {t("no_templates_found", "No templates found")}
                </h4>
                <p className="text-gray-600 mb-6">
                  {t(
                    "report_template_description",
                    "Report templates help you create standardized formats for patient reports and clinical documentation.",
                  )}
                </p>
              </div>
              {canManageTemplate ? (
                <Button
                  variant="default"
                  size="default"
                  className="w-full sm:w-auto"
                  asChild
                >
                  <Link
                    href={`/reportbuilder/new`}
                    className="flex items-center gap-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {t("create_new_report")}
                  </Link>
                </Button>
              ) : (
                <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-md border border-amber-200">
                  {t(
                    "template_permission_notice",
                    "You don't have permission to create templates. Please contact your administrator.",
                  )}
                </p>
              )}
            </div>
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
