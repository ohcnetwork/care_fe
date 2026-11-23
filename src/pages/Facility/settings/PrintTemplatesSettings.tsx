import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import {
  Muted,
  CareUIPageTitle as PageTitle,
} from "@/components/ui/typography";

import Loading from "@/components/Common/Loading";
import PageHeadTitle from "@/components/Common/PageHeadTitle";
import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";
import { PrintTemplateList } from "@/components/Facility/PrintTemplateList";

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
      <header>
        <PageTitle>{t("print_templates")}</PageTitle>
        <Muted className="mt-2 max-w-2xl">
          {t("print_templates_description")}
        </Muted>
      </header>
      {isLoading ? (
        <Loading />
      ) : !facility ? (
        <ErrorPage forError="PAGE_LOAD_ERROR" />
      ) : !canUpdateFacility ? (
        <p role="alert">{t("no_permission_to_view_page")}</p>
      ) : (
        <PrintTemplateList key={facility.id} facility={facility} />
      )}
    </div>
  );
}
