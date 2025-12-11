import CareIcon from "@/CAREUI/icons/CareIcon";
import { getPermissions } from "@/common/Permissions";
import Page from "@/components/Common/Page";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/context/PermissionContext";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";
import TemplateList from "./TemplateList";

interface TemplatePageProps {
  facilityId: string;
}

export default function TemplatePage({ facilityId }: TemplatePageProps) {
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  const { facility } = useCurrentFacility();
  const { canWriteTemplate } = getPermissions(
    hasPermission,
    facility?.permissions ?? [],
  );
  return (
    <Page
      title={t("templates")}
      options={
        canWriteTemplate && (
          <Button variant="primary" asChild>
            <Link href={`/facility/${facilityId}/template/builder`}>
              <CareIcon icon="l-plus" className="mr-1" />
              <span>{t("create_template")}</span>
            </Link>
          </Button>
        )
      }
    >
      <TemplateList
        facilityId={facilityId}
        enabled={true}
        showFilters={true}
        permissions={facility?.permissions ?? []}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      />
    </Page>
  );
}
