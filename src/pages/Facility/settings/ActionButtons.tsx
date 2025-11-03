import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { getPermissions } from "@/common/Permissions";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/context/PermissionContext";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";

interface ActionButtonsProps {
  editPath: string;
  viewPath: string;
}

export function ActionButtons({ editPath, viewPath }: ActionButtonsProps) {
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  const { facility } = useCurrentFacility();
  const { canWriteTokenCategory } = getPermissions(
    hasPermission,
    facility?.permissions ?? [],
  );

  return (
    <>
      <Button variant="outline" size="sm" asChild className="w-19 h-9 lg:h-8">
        <Link basePath="/" href={viewPath}>
          <CareIcon icon="l-eye" className="size-5 text-xl" />
          {t("view")}
        </Link>
      </Button>
      {canWriteTokenCategory && (
        <Button variant="outline" size="sm" asChild className="w-19 h-9 lg:h-8">
          <Link basePath="/" href={editPath}>
            <CareIcon icon="l-edit" className="size-5 text-sm" />
            {t("edit")}
          </Link>
        </Button>
      )}
    </>
  );
}
