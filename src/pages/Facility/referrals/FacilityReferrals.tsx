import { useQuery } from "@tanstack/react-query";
import { useQueryParams } from "raviger";
import { useTranslation } from "react-i18next";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/careui/tabs";
import {
  Muted,
  CareUIPageTitle as PageTitle,
} from "@/components/careui/typography";
import Page from "@/components/Common/Page";
import { ReferralList } from "@/components/Referral/ReferralList";

import { REFERRAL_DIRECTIONS } from "@/types/emr/referral/referral";
import facilityOrganizationApi from "@/types/facilityOrganization/facilityOrganizationApi";
import query from "@/Utils/request/query";

interface FacilityReferralsProps {
  facilityId: string;
}

export default function FacilityReferrals({
  facilityId,
}: FacilityReferralsProps) {
  const { t } = useTranslation();
  const [queryParams, setQueryParams] = useQueryParams();
  const direction =
    REFERRAL_DIRECTIONS.find(
      (value) => value === queryParams.referralDirection,
    ) ?? "all";
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
    <Page title={t("referrals")} hideTitleOnPage className="careui">
      <div className="space-y-6 px-3 pb-6 md:px-0">
        <header className="space-y-2">
          <PageTitle>{t("referrals")}</PageTitle>
          <Muted className="max-w-3xl">
            {t("facility_referrals_description")}
          </Muted>
        </header>
        <Tabs
          value={direction}
          onValueChange={(value) => {
            if (!REFERRAL_DIRECTIONS.some((direction) => direction === value))
              return;
            setQueryParams(
              {
                referralDirection: String(value),
                referralPage: "1",
                referralScope: null,
              },
              { overwrite: false, replace: true },
            );
          }}
          className="min-w-0 gap-5"
        >
          <div className="border-b border-cui-border">
            <TabsList variant="line" aria-label={t("referrals")}>
              <TabsTrigger value="all">{t("all_referrals")}</TabsTrigger>
              <TabsTrigger value="incoming">{t("incoming")}</TabsTrigger>
              <TabsTrigger value="outgoing">{t("outgoing")}</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value={direction} className="min-w-0">
            <ReferralList
              departmentFilter={{ facilityId, departmentId, department }}
              filterDescription={t(
                `referral_${departmentId ? "department" : "facility"}_scope_${direction}`,
              )}
              scope={
                departmentId
                  ? {
                      entityType: "internal_organization",
                      entityId: departmentId,
                      direction,
                    }
                  : { entityType: "facility", entityId: facilityId, direction }
              }
            />
          </TabsContent>
        </Tabs>
      </div>
    </Page>
  );
}
