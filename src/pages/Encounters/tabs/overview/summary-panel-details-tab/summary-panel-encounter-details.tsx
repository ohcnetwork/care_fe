import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Signal, SquarePen } from "lucide-react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import query from "@/Utils/request/query";
import { Avatar } from "@/components/Common/Avatar";
import {
  EncounterClassBadge,
  StatusBadge,
} from "@/pages/Encounters/EncounterProperties";
import { OverviewSidebarSheet } from "@/pages/Encounters/tabs/overview/overview-sidebar-sheet";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import {
  AccountBillingStatus,
  AccountStatus,
} from "@/types/billing/account/Account";
import accountApi from "@/types/billing/account/accountApi";
import { ENCOUNTER_PRIORITY_COLORS } from "@/types/emr/encounter/encounter";

export const SummaryPanelEncounterDetails = () => {
  const { t } = useTranslation();
  const {
    selectedEncounter: encounter,
    patientId,
    facilityId,
    patient,
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
    <div className="flex flex-col gap-2">
      <div className="xl:hidden flex flex-col sm:flex-row p-3 bg-white -mt-1 rounded-lg gap-4 shadow">
        <div className="flex flex-col gap-4 sm:border-r border-gray-200 pr-4">
          <div className="flex flex-row gap-8">
            <div className="flex flex-col gap-4">
              <div>
                <span className="text-sm font-medium text-gray-700">
                  {t("status")}:
                </span>
                <div>
                  <StatusBadge encounter={encounter} />
                </div>
              </div>

              <div>
                <span className="text-sm font-medium text-gray-700">
                  {t("encounter_class")}:
                </span>
                <div>
                  <EncounterClassBadge encounter={encounter} />
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">
                  {t("priority")}:
                </span>
                <div>
                  <Badge
                    variant={ENCOUNTER_PRIORITY_COLORS[encounter.priority]}
                  >
                    <Signal className="size-3" />
                    {t(`encounter_priority__${encounter.priority}`)}
                  </Badge>
                </div>
              </div>

              {encounter.current_location && (
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    {t("location")}:
                  </span>
                  <div>
                    {encounter.current_location?.name ? (
                      <Badge
                        variant="secondary"
                        className="inline-flex items-center gap-1.5"
                      >
                        <CareIcon icon="l-location-point" className="size-3" />
                        {encounter.current_location?.name || t("none")}
                      </Badge>
                    ) : (
                      <span>--</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <span className="text-sm font-medium text-gray-700">
                  {t("dep_and_teams")}:
                </span>
                <div className="flex flex-wrap gap-2">
                  {encounter.organizations.length > 0 ? (
                    <>
                      {encounter.organizations.map((org) => (
                        <Badge
                          key={org.id}
                          variant="blue"
                          className="capitalize"
                        >
                          {org.name}
                        </Badge>
                      ))}
                    </>
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
                    <>
                      {encounter.tags.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="secondary"
                          className="capitalize"
                          title={tag.description}
                        >
                          {tag.display}
                        </Badge>
                      ))}
                    </>
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
          </div>
          <OverviewSidebarSheet
            trigger={
              <Button
                variant="outline"
                className="hidden sm:flex flex-row w-full text-gray-950"
              >
                <SquarePen className="size-3 text-gray-950" strokeWidth={1.5} />
                <span className="font-semibold">{t("update_details")}</span>
              </Button>
            }
          />
        </div>
        <Separator className="sm:hidden" />
        <div className="flex flex-col gap-4">
          <div className="flex flex-row gap-6">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-700">
                {t("start_date")}:
              </span>
              <div className="text-sm text-gray-950 font-semibold">
                {encounter.period.start ? (
                  <>
                    {format(encounter.period.start, "dd MMM yyyy")},{" "}
                    <span className="text-gray-600">
                      {format(encounter.period.start, "hh:mma")}
                    </span>
                  </>
                ) : (
                  <span>--</span>
                )}
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-700">
                {t("end_date")}:
              </span>
              <div className="text-sm text-gray-950 font-semibold">
                {encounter.period.end ? (
                  <>
                    {format(encounter.period.end, "dd MMM yyyy")},{" "}
                    <span className="text-gray-600">
                      {format(encounter.period.end, "hh:mma")}
                    </span>
                  </>
                ) : (
                  <span>{t("ongoing")}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-700">
              {t("account")}:
            </span>
            <div className="text-sm text-gray-950 font-semibold">
              {account?.results[0]?.name || "--"}
            </div>
          </div>

          <div className="flex flex-row gap-2">
            <div className="text-sm text-gray-950 font-semibold flex flex-wrap gap-6">
              {patient?.instance_identifiers?.map((identifier) => (
                <div
                  key={identifier.config.id}
                  className="flex flex-col items-start"
                >
                  <span className="text-gray-600 md:w-auto">
                    {identifier.config.config.display}:{" "}
                  </span>
                  <span className="font-semibold">{identifier.value}</span>
                </div>
              ))}
            </div>
          </div>

          {encounter.care_team.length > 0 && (
            <div className="flex flex-row gap-2">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-gray-700">
                  {t("care_team")}:
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {encounter.care_team.length > 0 ? (
                      encounter.care_team
                        .slice(0, 3)
                        .map((member) => (
                          <Avatar
                            key={member.member.id}
                            name={member.member.first_name}
                            imageUrl={member.member.profile_picture_url}
                            className="size-10 rounded-full border border-white shadow-sm"
                          />
                        ))
                    ) : (
                      <span>--</span>
                    )}
                  </div>
                  {encounter.care_team.length > 3 && (
                    <div className="flex items-center justify-center text-sm font-medium text-gray-700 rounded-full bg-gray-100 size-10 border border-white shadow-sm -ml-4">
                      <span>+{encounter.care_team.length - 3}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <OverviewSidebarSheet
        trigger={
          <Button variant="outline" className="sm:hidden w-full text-gray-950">
            <SquarePen className="size-3 text-gray-950" strokeWidth={1.5} />
            <span className="font-semibold">{t("update_details")}</span>
          </Button>
        }
      />
    </div>
  );
};
