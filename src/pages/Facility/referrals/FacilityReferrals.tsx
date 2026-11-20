import { useQuery } from "@tanstack/react-query";
import { useQueryParams } from "raviger";
import { useTranslation } from "react-i18next";

import Page from "@/components/Common/Page";
import { ReferralList } from "@/components/Referral/ReferralList";
import {
  Muted,
  CareUIPageTitle as PageTitle,
} from "@/components/ui/typography";

import facilityOrganizationApi from "@/types/facilityOrganization/facilityOrganizationApi";
import query from "@/Utils/request/query";

interface FacilityReferralsProps {
  facilityId: string;
}

export default function FacilityReferrals({
  facilityId,
}: FacilityReferralsProps) {
  const { t } = useTranslation();
  const [queryParams] = useQueryParams();
  const departmentId =
    queryParams.referralDestination === "facility"
      ? null
      : queryParams.referralDepartment || null;
  const { data: department } = useQuery({
    queryKey: ["facilityOrganization", facilityId, departmentId],
    queryFn: query(facilityOrganizationApi.get, {
      pathParams: { facilityId, organizationId: departmentId ?? "" },
      silent: true,
    }),
    enabled: !!departmentId,
  });

  return (
    <Page title={t("referrals")} hideTitleOnPage>
      <div className="space-y-6 px-3 pb-6 md:px-0">
        <header className="space-y-2">
          <PageTitle>{t("referrals")}</PageTitle>
          <Muted className="max-w-3xl">
            {t("facility_referrals_description")}
          </Muted>
        </header>
        <ReferralList
          departmentFilter={{ facilityId, departmentId, department }}
          filterDescription={t(
            departmentId
              ? "referral_department_scope_incoming"
              : "referral_facility_scope_incoming",
          )}
          scope={
            departmentId
              ? {
                  entityType: "internal_organization",
                  entityId: departmentId,
                }
              : { entityType: "facility", entityId: facilityId }
          }
        />
      </div>
    </Page>
  );
}
