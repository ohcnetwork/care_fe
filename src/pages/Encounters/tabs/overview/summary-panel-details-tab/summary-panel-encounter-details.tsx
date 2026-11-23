import query from "@/Utils/request/query";
import { formatName } from "@/Utils/utils";
import TagBadge from "@/components/Tags/TagBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import {
  AccountBillingStatus,
  AccountStatus,
} from "@/types/billing/account/Account";
import accountApi from "@/types/billing/account/accountApi";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export const SummaryPanelEncounterDetails = () => {
  const { t } = useTranslation();
  const [showAllCareTeam, setShowAllCareTeam] = useState(false);
  const {
    selectedEncounter: encounter,
    patientId,
    facilityId,
  } = useEncounter();
  const { data: account } = useQuery({
    queryKey: ["accounts", patientId],
    queryFn: query(accountApi.listAccount, {
      pathParams: { facilityId: facilityId || "" },
      queryParams: {
        patient: patientId,
        status: AccountStatus.active,
        billing_status: AccountBillingStatus.open,
        limit: 1,
      },
    }),
    enabled: !!facilityId,
  });

  if (!encounter) return null;

  return (
    <div className="grid gap-3 rounded-xl border border-gray-200 bg-white p-3 sm:grid-cols-2 xl:hidden">
      <div className="flex min-w-0 flex-col gap-3 sm:border-r sm:border-gray-200 sm:pr-3">
        <div>
          <span className="text-sm font-medium text-gray-700">
            {t("dep_and_teams")}:
          </span>
          <div className="flex flex-wrap gap-2">
            {encounter.organizations.length > 0 ? (
              encounter.organizations.map((org) => (
                <Badge key={org.id} variant="blue" className="capitalize">
                  {org.name}
                </Badge>
              ))
            ) : (
              <span>--</span>
            )}
          </div>
        </div>
        <div>
          <span className="text-sm font-medium text-gray-700">
            {t("encounter_tags")}:
          </span>
          <div className="flex flex-wrap gap-2">
            {encounter.tags.length > 0 ? (
              encounter.tags.map((tag) => <TagBadge key={tag.id} tag={tag} />)
            ) : (
              <p className="text-sm text-gray-500">{t("no_tags")}</p>
            )}
          </div>
        </div>
        {encounter.hospitalization?.re_admission && (
          <div>
            <span className="text-sm font-medium text-gray-700">
              {t("hospitalisation")}:
            </span>
            <div>
              <Badge variant="blue">{t("re_admission")}</Badge>
            </div>
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-700">
            {t("account")}:
          </span>
          <div className="text-sm font-semibold text-gray-950">
            {account?.results[0]?.name || "--"}
          </div>
        </div>
        {encounter.care_team.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700">
              {t("care_team")}:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {(showAllCareTeam
                ? encounter.care_team
                : encounter.care_team.slice(0, 2)
              ).map((member) => (
                <div
                  key={member.member.id}
                  className="flex flex-col rounded-lg border border-gray-200 bg-gray-100 px-2 py-1"
                >
                  <span className="text-sm font-medium text-gray-950 md:text-base">
                    {formatName(member.member)}
                  </span>
                  <span className="text-xs text-gray-600 md:text-sm">
                    {member.role.display}
                  </span>
                </div>
              ))}
              {encounter.care_team.length > 2 && (
                <Button
                  type="button"
                  onClick={() => setShowAllCareTeam(!showAllCareTeam)}
                  variant="link"
                  size="xs"
                  className="underline"
                >
                  {showAllCareTeam
                    ? t("show_less")
                    : `+${encounter.care_team.length - 2} ${t("more")}`}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
