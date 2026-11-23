import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import Loading from "@/components/Common/Loading";
import PageHeadTitle from "@/components/Common/PageHeadTitle";
import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";
import { PrintTemplateEditor } from "@/components/Facility/PrintTemplateEditor";

import { getPermissions } from "@/common/Permissions";
import { usePermissions } from "@/context/PermissionContext";
import { useShortcutSubContext } from "@/context/ShortcutContext";
import facilityApi from "@/types/facility/facilityApi";
import query from "@/Utils/request/query";

interface PrintTemplatesSettingsProps {
  facilityId: string;
}

export function PrintTemplatesSettings({
  facilityId,
}: PrintTemplatesSettingsProps) {
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  useShortcutSubContext(undefined);
  const { data: facility, isLoading } = useQuery({
    queryKey: ["facility", facilityId],
    queryFn: query(facilityApi.get, { pathParams: { facilityId } }),
  });
  const { canUpdateFacility } = getPermissions(
    hasPermission,
    facility?.root_org_permissions ?? [],
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6 pt-4 text-foreground">
      <PageHeadTitle title={t("print_templates")} />
      <header className="space-y-2">
        <h1 className="text-3xl font-bold leading-9 tracking-tight">
          {t("print_templates")}
        </h1>
        <p className="text-muted-foreground">
          {t("print_templates_description")}
        </p>
      </header>
      {isLoading ? (
        <Loading />
      ) : !facility ? (
        <ErrorPage forError="PAGE_LOAD_ERROR" />
      ) : !canUpdateFacility ? (
        <p role="alert">{t("no_permission_to_view_page")}</p>
      ) : (
        <PrintTemplateEditor key={facility.id} facility={facility} />
      )}
    </div>
  );
}
