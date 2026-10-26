import { GitPullRequestArrow, Settings2 } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { buttonVariants } from "@/components/ui/button";

import { usePermissions } from "@/context/PermissionContext";
import { Organization } from "@/types/organization/organization";

export function OrganizationReferralLinks({
  organization,
}: {
  organization: Organization;
}) {
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  const base =
    organization.org_type === "role" ? "responsibilities" : "organization";
  const canRead = hasPermission("can_read_referral", organization.permissions);
  const canManage = hasPermission(
    "can_manage_referral_availability",
    organization.permissions,
  );
  if (!canRead && !canManage) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {canRead && (
        <Link
          href={`/${base}/${organization.id}/referrals`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <GitPullRequestArrow className="size-4" />
          {t("referrals")}
        </Link>
      )}
      {canManage && (
        <Link
          href={`/${base}/${organization.id}/settings/referrals`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <Settings2 className="size-4" />
          {t("referral_availability_settings")}
        </Link>
      )}
    </div>
  );
}
