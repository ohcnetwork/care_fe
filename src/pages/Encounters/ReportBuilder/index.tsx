import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import Page from "@/components/Common/Page";

import { getPermissions } from "@/common/Permissions";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { usePermissions } from "@/context/PermissionContext";
import reportTemplateApi from "@/types/reportTemplate/reportTemplateApi";

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
  const { data: reportTemplateData } = useQuery({
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          {reportTemplateData?.results?.map((reportTemplate) => (
            <Card
              key={reportTemplate.id}
              className="flex flex-col justify-between gap-2 rounded-md bg-gray-100 p-3"
            >
              <div className="flex flex-col sm:flex-row justify-between">
                <span>{reportTemplate.slug}</span>
                <span className="text-xs text-gray-500">
                  {t(reportTemplate.type.toString())}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 justify-between">
                <div className="flex flex-row gap-2 justify-start">
                  {reportTemplate?.facility ? (
                    <Badge variant="primary" className="text-xs">
                      {t("facility")}
                    </Badge>
                  ) : (
                    <Badge
                      variant="primary"
                      className="bg-blue-100 border-blue-300"
                    >
                      {t("instance")}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
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
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Page>
  );
}
