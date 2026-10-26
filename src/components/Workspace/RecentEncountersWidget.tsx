import { useQuery } from "@tanstack/react-query";
import { MapPin, Users } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { ClinicalListError } from "@/components/Patient/Common/ClinicalListError";
import { EncounterAccordionLayout } from "@/components/Patient/EncounterAccordionLayout";

import useAuthUser from "@/hooks/useAuthUser";
import {
  ENCOUNTER_CLASS_ICONS,
  ENCOUNTER_STATUS_COLORS,
} from "@/types/emr/encounter/encounter";
import encounterApi from "@/types/emr/encounter/encounterApi";
import { recentEncountersConfigSchema } from "@/types/workspace/widgetConfigSchemas";
import query from "@/Utils/request/query";
import { formatDateTime, formatName } from "@/Utils/utils";

interface RecentEncountersWidgetProps {
  patientId: string;
  facilityId?: string;
  selectedEncounterId?: string;
  title?: string;
  showEmpty?: boolean;
  config?: Record<string, unknown>;
}

export function RecentEncountersWidget({
  patientId,
  facilityId,
  selectedEncounterId,
  title,
  showEmpty = false,
  config = {},
}: RecentEncountersWidgetProps) {
  const { t } = useTranslation();
  const user = useAuthUser();
  const parsedConfig = recentEncountersConfigSchema.safeParse(config);
  const {
    care_team,
    care_team_user,
    encounter_class: encounterClass,
    status,
    exclude_current: excludeCurrent = false,
    limit = 5,
  } = parsedConfig.data ?? {};
  // A specific username is an explicit author choice; "mine" follows the viewer.
  const careTeamUser =
    care_team_user ?? (care_team === "mine" ? user.username : undefined);
  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: [
      "encounters",
      patientId,
      "recent-widget",
      { careTeamUser, encounterClass, status, excludeCurrent, limit },
    ],
    queryFn: query(encounterApi.list, {
      queryParams: {
        patient: patientId,
        care_team_user: careTeamUser,
        encounter_class: encounterClass,
        status,
        // Fetch one extra so dropping the current encounter keeps the count.
        limit: excludeCurrent ? limit + 1 : limit,
        ordering: "-created_date",
      },
      silent: true,
    }),
    enabled: parsedConfig.success,
  });

  const heading = title ?? t("workspace_recent_encounters");
  if (!parsedConfig.success) {
    return (
      <section aria-label={heading}>
        <Alert variant="destructive">
          <AlertDescription>
            {t("encounter_widget_config_invalid")}
          </AlertDescription>
        </Alert>
      </section>
    );
  }
  const encounters = (data?.results ?? [])
    .filter(
      (encounter) => !excludeCurrent || encounter.id !== selectedEncounterId,
    )
    .slice(0, limit);
  if (!isLoading && !isError && !encounters.length && !showEmpty) return null;
  const patientPath = facilityId
    ? `/facility/${facilityId}/patient/${patientId}`
    : `/patient/${patientId}`;

  return (
    <section aria-label={heading} className="min-w-0">
      <EncounterAccordionLayout
        title={heading}
        readOnly
        presentation="panel"
        className="min-w-0 overflow-hidden"
        actionButton={
          <Link
            href={`${patientPath}/encounters`}
            className="text-xs font-medium text-primary-700 underline-offset-2 hover:underline"
          >
            {t("workspace_encounters_see_all")}
          </Link>
        }
      >
        {isLoading ? (
          <div role="status" aria-label={t("loading")}>
            <Skeleton className="h-24 w-full" />
          </div>
        ) : isError ? (
          <ClinicalListError isFetching={isFetching} onRetry={refetch} />
        ) : !encounters.length ? (
          <p className="px-2 py-5 text-sm text-soft-foreground">
            {t(
              careTeamUser
                ? "workspace_encounters_none_for_care_team"
                : "no_encounters_found",
            )}
          </p>
        ) : (
          <ul className="@container divide-y divide-soft-border">
            {encounters.map((encounter) => {
              const ClassIcon =
                ENCOUNTER_CLASS_ICONS[encounter.encounter_class];
              const isCurrent = encounter.id === selectedEncounterId;
              const [lead, ...others] = encounter.care_team;
              const href =
                facilityId && encounter.facility.id === facilityId
                  ? `/facility/${facilityId}/patient/${patientId}/encounter/${encounter.id}/updates`
                  : `/organization/organizationId/patient/${patientId}/encounter/${encounter.id}/updates`;
              return (
                <li
                  key={encounter.id}
                  className={cn(
                    "flex flex-col gap-1.5 py-2.5 @md:flex-row @md:items-center @md:gap-3",
                    isCurrent && "-mx-2 rounded-md bg-primary-50/60 px-2",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-foreground">
                      <ClassIcon
                        className="size-4 shrink-0 text-soft-foreground"
                        aria-hidden="true"
                      />
                      <time
                        dateTime={
                          encounter.period.start ?? encounter.created_date
                        }
                      >
                        {formatDateTime(
                          encounter.period.start ?? encounter.created_date,
                          "DD MMM YYYY",
                        )}
                      </time>
                      <span
                        aria-hidden="true"
                        className="text-disabled-foreground"
                      >
                        ·
                      </span>
                      <span>
                        {t(`encounter_class__${encounter.encounter_class}`)}
                      </span>
                      {isCurrent && (
                        <Badge
                          variant="primary"
                          size="xs"
                          className="rounded-sm"
                        >
                          {t("current_encounter")}
                        </Badge>
                      )}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-soft-foreground">
                      <span className="flex min-w-0 items-center gap-1">
                        <Users className="size-3 shrink-0" aria-hidden="true" />
                        <span className="truncate">
                          {lead
                            ? `${formatName(lead.member)}${
                                lead.role.display
                                  ? ` (${lead.role.display})`
                                  : ""
                              }${others.length ? ` +${others.length}` : ""}`
                            : t("workspace_encounters_no_care_team")}
                        </span>
                      </span>
                      {encounter.current_location && (
                        <span className="flex min-w-0 items-center gap-1">
                          <MapPin
                            className="size-3 shrink-0"
                            aria-hidden="true"
                          />
                          <span className="truncate">
                            {encounter.current_location.name}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center justify-between gap-3 @md:justify-end">
                    <Badge
                      variant={ENCOUNTER_STATUS_COLORS[encounter.status]}
                      size="xs"
                      className="rounded-sm"
                    >
                      {t(`encounter_status__${encounter.status}`)}
                    </Badge>
                    {!isCurrent && (
                      <Link
                        href={href}
                        className="text-xs font-medium text-primary-700 underline-offset-2 hover:underline"
                      >
                        {t("workspace_encounters_see_encounter")}
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </EncounterAccordionLayout>
    </section>
  );
}
