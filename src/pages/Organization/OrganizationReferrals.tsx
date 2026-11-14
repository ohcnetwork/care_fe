import { useTranslation } from "react-i18next";

import { ReferralList } from "@/components/Referral/ReferralList";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { usePermissions } from "@/context/PermissionContext";

import EntityBadge from "./components/EntityBadge";
import OrganizationLayout, {
  RouteContext,
} from "./components/OrganizationLayout";

interface OrganizationReferralsProps {
  id: string;
  navOrganizationId?: string;
  routeContext?: RouteContext;
}

export default function OrganizationReferrals(
  props: OrganizationReferralsProps,
) {
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  return (
    <OrganizationLayout {...props}>
      {({ orgPermissions }) => (
        <div className="space-y-4 text-foreground">
          <EntityBadge
            title={t("referral_organization_incoming")}
            description={t("referral_organization_incoming_description")}
            isFetching={false}
            showCount={false}
          />
          {hasPermission("can_read_referral", orgPermissions) ? (
            <ReferralList
              scope={{
                entityType: "external_organization",
                entityId: props.id,
              }}
            />
          ) : (
            <Empty className="border border-border">
              <EmptyHeader>
                <EmptyTitle>{t("referral_list_access_denied")}</EmptyTitle>
                <EmptyDescription>
                  {t("referral_organization_read_permission")}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </div>
      )}
    </OrganizationLayout>
  );
}
