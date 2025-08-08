import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Signal, SquarePen } from "lucide-react";
import { Link } from "raviger";
import React from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { Avatar } from "@/components/Common/Avatar";
import TagAssignmentSheet from "@/components/Tags/TagAssignmentSheet";

import query from "@/Utils/request/query";
import { StatusBadge } from "@/pages/Encounters/EncounterProperties";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import {
  AccountBillingStatus,
  AccountStatus,
} from "@/types/billing/account/Account";
import accountApi from "@/types/billing/account/accountApi";
import {
  ENCOUNTER_CLASSES_COLORS,
  ENCOUNTER_CLASS_ICONS,
  ENCOUNTER_PRIORITY_COLORS,
} from "@/types/emr/encounter/encounter";
import { getTagHierarchyDisplay } from "@/types/emr/tagConfig/tagConfig";

import { Account } from "./summary-panel-details-tab/account";
import { AuditLogs } from "./summary-panel-details-tab/auditlogs";
import { DepartmentsAndTeams } from "./summary-panel-details-tab/department-and-team";
import { DischargeDetails } from "./summary-panel-details-tab/discharge-summary";
import { EmptyState } from "./summary-panel-details-tab/empty-state";
import { Questionnaires } from "./summary-panel-details-tab/forms";
import { HospitalizationDetails } from "./summary-panel-details-tab/hospitalisation";
import { Locations } from "./summary-panel-details-tab/locations";
import { ManageCareTeam } from "./summary-panel-details-tab/manage-care-team";

export const SummaryPanelDetailTab = () => {
  const { t } = useTranslation();
  const {
    selectedEncounter: encounter,
    canWriteSelectedEncounter: canEdit,
    patientId,
    facilityId,
    patient,
  } = useEncounter();
  const queryClient = useQueryClient();

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
  const EncounterClassIcon = ENCOUNTER_CLASS_ICONS[encounter.encounter_class];

  return (
    <div>
      <div className="flex flex-col gap-2">
        <div className="hidden @xs:flex flex-col sm:flex-row p-3 bg-white -mt-1 rounded-lg gap-4 shadow">
          <div className="flex flex-col gap-4 sm:border-r border-gray-200 pr-4">
            <div className="flex flex-row gap-14">
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
                    <Badge
                      variant={
                        ENCOUNTER_CLASSES_COLORS[encounter.encounter_class]
                      }
                    >
                      <EncounterClassIcon className="size-3" />
                      <span className="whitespace-nowrap">
                        {t(`encounter_class__${encounter.encounter_class}`)}
                      </span>
                    </Badge>
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

                <div>
                  <span className="text-sm font-medium text-gray-700">
                    {t("hospitalisation")}:
                  </span>
                  <div>
                    <Badge variant="blue">
                      {encounter.hospitalization?.re_admission
                        ? t("re_admission")
                        : t("new_admission")}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              className="hidden @sm:flex flex-row w-full text-gray-950"
              asChild
            >
              <Link
                href={`/facility/${encounter.facility.id}/patient/${encounter.patient.id}/encounter/${encounter.id}/questionnaire/encounter`}
              >
                <SquarePen className="size-3 text-gray-950" strokeWidth={1.5} />
                <span className="font-semibold">{t("update_details")}</span>
              </Link>
            </Button>
          </div>

          <Separator className="sm:hidden" />

          <div className="flex flex-row -mt-2 sm:mt-0 gap-5">
            <div className="flex flex-col gap-2">
              <div>
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
              <div>
                <span className="text-sm font-medium text-gray-700">
                  {t("hospital_identifier")}
                </span>
                <div className="text-sm text-gray-950 font-semibold">
                  {encounter.external_identifier || "--"}
                </div>
              </div>

              <div>
                <span className="text-sm font-medium text-gray-700">
                  {t("account")}:
                </span>
                <div className="text-sm text-gray-950 font-semibold">
                  {account?.results[0]?.name || "--"}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div>
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
                    <span>--({t("ongoing")})</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-gray-700">
                  {t("patient_id_abha")}:
                </span>
                <div className="text-sm text-gray-950 font-semibold flex flex-wrap gap-2">
                  {patient?.instance_identifiers.map((identifier) => (
                    <Badge key={identifier.config.id} variant="secondary">
                      {identifier.value}
                    </Badge>
                  )) || <span>--</span>}
                </div>
              </div>

              <div>
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
                            className="size-8 rounded-full"
                          />
                        ))
                    ) : (
                      <span>--</span>
                    )}
                  </div>
                  {encounter.care_team.length > 3 && (
                    <span className="text-sm font-medium text-gray-600">
                      +{encounter.care_team.length - 3}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          className="sm:hidden w-full text-gray-950"
          asChild
        >
          <Link
            href={`/facility/${encounter.facility.id}/patient/${encounter.patient.id}/encounter/${encounter.id}/questionnaire/encounter`}
          >
            <SquarePen className="size-3 text-gray-950" strokeWidth={1.5} />
            <span className="font-semibold">{t("update_details")}</span>
          </Link>
        </Button>
      </div>
      <div className="@xs:hidden xl:flex flex-col gap-4">
        <div className="flex flex-wrap gap-2 border bg-gray-100 border-gray-200 rounded-md p-1">
          <div className="flex items-center justify-between w-full p-2 text-gray-950">
            <span className="font-semibold ">{t("encounter_details")}</span>
            <Button variant="ghost" size="xs" asChild>
              <Link
                href={`/facility/${encounter.facility.id}/patient/${encounter.patient.id}/encounter/${encounter.id}/questionnaire/encounter`}
              >
                <SquarePen
                  className="size-4 text-gray-950 cursor-pointer"
                  strokeWidth={1.5}
                />
              </Link>
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 justify-between bg-white w-full p-2 rounded-md shadow">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">{t("status")}: </span>
              <div>
                <StatusBadge encounter={encounter} />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">
                {t("encounter_class")}:{" "}
              </span>
              <div>
                <Badge
                  variant={ENCOUNTER_CLASSES_COLORS[encounter.encounter_class]}
                  size="sm"
                >
                  <EncounterClassIcon className="size-3" />
                  <span className="whitespace-nowrap">
                    {t(`encounter_class__${encounter.encounter_class}`)}
                  </span>
                </Badge>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">{t("priority")}: </span>
              <div>
                <Badge
                  variant={ENCOUNTER_PRIORITY_COLORS[encounter.priority]}
                  size="sm"
                >
                  <span className="whitespace-nowrap">
                    {t(`encounter_priority__${encounter.priority}`)}
                  </span>
                </Badge>
              </div>
            </div>
            <Separator className="my-2" />
            <div className="hidden md:flex flex-col gap-1">
              <div>
                <span className="text-sm font-medium text-gray-700">
                  {t("start_date")}:
                </span>
                <div className="text-sm text-gray-950 font-semibold">
                  {encounter.period.start ? (
                    <>
                      {format(encounter.period.start, "dd MMM yyyy")}
                      <div className="text-gray-600">
                        {format(encounter.period.start, "hh:mma")}
                      </div>
                    </>
                  ) : (
                    <span>--</span>
                  )}
                </div>
              </div>
            </div>

            <div className="hidden md:flex flex-col gap-1">
              <div>
                <span className="text-sm font-medium text-gray-700">
                  {t("end_date")}:
                </span>
                <div className="text-sm text-gray-950 font-semibold">
                  {encounter.period.end ? (
                    <>
                      {format(encounter.period.end, "dd MMM yyyy")},
                      <div className="text-gray-600">
                        {format(encounter.period.end, "hh:mma")}
                      </div>
                    </>
                  ) : (
                    <span>--({t("ongoing")})</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <Button variant="outline" className="w-full" asChild>
            <Link
              href={`/facility/${encounter.facility.id}/patient/${encounter.patient.id}/encounter/${encounter.id}/questionnaire/encounter`}
            >
              <SquarePen className="size-3 text-gray-950" strokeWidth={1.5} />
              <span className="text-gray-950">{t("update_details")}</span>
            </Link>
          </Button>
        </div>
        <div className="bg-gray-100 rounded-md border border-gray-200 p-1">
          <div className="flex items-center justify-between w-full">
            <span className="font-semibold text-gray-950 p-2">
              {t("encounter_tags")}
            </span>
            {canEdit && (
              <TagAssignmentSheet
                entityType="encounter"
                entityId={encounter.id}
                currentTags={encounter.tags}
                onUpdate={() => {
                  queryClient.invalidateQueries({
                    queryKey: ["encounter", encounter.id],
                  });
                }}
                trigger={
                  <Button variant="ghost" size="xs">
                    <SquarePen
                      className="size-3 text-gray-950"
                      strokeWidth={1.5}
                    />
                  </Button>
                }
                canWrite={canEdit}
              />
            )}
          </div>
          <div className="flex flex-wrap bg-white w-full p-2 rounded-md gap-2 shadow">
            {encounter.tags.length > 0 ? (
              <>
                {encounter.tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="capitalize"
                    title={tag.description}
                  >
                    {getTagHierarchyDisplay(tag)}
                  </Badge>
                ))}
              </>
            ) : (
              <EmptyState message={t("no_tags")} />
            )}
          </div>
        </div>
        <div className="bg-gray-100 rounded-md p-2 border border-gray-200">
          {canEdit && <Questionnaires encounter={encounter} />}
        </div>
        <div className="bg-gray-100 rounded-md w-full border border-gray-200">
          <Locations canEdit={canEdit} encounter={encounter} />
        </div>
        <div className="bg-gray-100 rounded-md w-full border border-gray-200">
          <ManageCareTeam />
        </div>
        <div className="bg-gray-100 rounded-md w-full border border-gray-200">
          <DepartmentsAndTeams canEdit={canEdit} encounter={encounter} />
        </div>
        <div className="bg-gray-100 rounded-md w-full border border-gray-200">
          <DischargeDetails encounter={encounter} />
        </div>
        <div className="bg-gray-100 rounded-md w-full border border-gray-200">
          <HospitalizationDetails encounter={encounter} />
        </div>
        <div className="bg-gray-100 rounded-md w-full border border-gray-200">
          <Account encounter={encounter} canEdit={canEdit} />
        </div>
        <div>
          <AuditLogs encounter={encounter} />
        </div>
      </div>
    </div>
  );
};
