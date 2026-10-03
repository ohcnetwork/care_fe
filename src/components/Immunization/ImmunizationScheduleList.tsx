import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, ChevronDown, Syringe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

import mutate from "@/Utils/request/mutate";
import { formatDateTime } from "@/Utils/utils";
import {
  IMMUNIZATION_FORECAST_STATUS,
  IMMUNIZATION_FORECAST_STATUS_COLORS,
  ImmunizationForecastStatus,
  ImmunizationRecommendationRead,
  ImmunizationRecommendationUpdate,
} from "@/types/emr/immunizationRecommendation/immunizationRecommendation";
import immunizationRecommendationApi from "@/types/emr/immunizationRecommendation/immunizationRecommendationApi";

import {
  codingsLabel,
  compareRecommendations,
  doseLabel,
  forecastDisplayStatus,
} from "./immunizationUtils";

const ACTIVE_STATUSES = new Set(["overdue", "due", "upcoming"]);

/** The update API replaces the editable fields, so resend the stored ones. */
function statusUpdate(
  recommendation: ImmunizationRecommendationRead,
  forecast_status: ImmunizationForecastStatus,
): ImmunizationRecommendationUpdate {
  return {
    codes: recommendation.codes ?? undefined,
    diseases: recommendation.diseases ?? undefined,
    earliest_date: recommendation.earliest_date ?? undefined,
    due_date: recommendation.due_date ?? undefined,
    overdue_date: recommendation.overdue_date ?? undefined,
    description: recommendation.description ?? undefined,
    series: recommendation.series ?? undefined,
    dose_number: recommendation.dose_number ?? undefined,
    series_number: recommendation.series_number ?? undefined,
    forecast_status,
  };
}

interface ImmunizationScheduleListProps {
  patientId: string;
  recommendations: ImmunizationRecommendationRead[];
  isLoading: boolean;
  canUpdateStatus: boolean;
  canRecord: boolean;
  onRecord: (recommendation: ImmunizationRecommendationRead) => void;
}

export function ImmunizationScheduleList({
  patientId,
  recommendations,
  isLoading,
  canUpdateStatus,
  canRecord,
  onRecord,
}: ImmunizationScheduleListProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  // Groups only organise a schedule; the patient is given recommendations.
  const items = recommendations
    .filter((recommendation) => !recommendation.is_group)
    .map((recommendation) => ({
      recommendation,
      status: forecastDisplayStatus(recommendation),
    }))
    .sort(
      (a, b) =>
        Number(!ACTIVE_STATUSES.has(a.status)) -
          Number(!ACTIVE_STATUSES.has(b.status)) ||
        compareRecommendations(a.recommendation, b.recommendation),
    );

  if (!items.length) {
    return (
      <EmptyState
        icon={<CalendarClock className="size-6 text-primary" />}
        title={t("immunization_schedule_empty")}
        description={t("immunization_schedule_empty_hint")}
        className="shadow-none"
      />
    );
  }

  return (
    <ul
      className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white"
      aria-label={t("immunization_schedule")}
    >
      {items.map(({ recommendation, status }) => (
        <ScheduleItem
          key={recommendation.id}
          patientId={patientId}
          recommendation={recommendation}
          status={status}
          canUpdateStatus={canUpdateStatus}
          canRecord={canRecord && ACTIVE_STATUSES.has(status)}
          onRecord={() => onRecord(recommendation)}
        />
      ))}
    </ul>
  );
}

interface ScheduleItemProps {
  patientId: string;
  recommendation: ImmunizationRecommendationRead;
  status: ReturnType<typeof forecastDisplayStatus>;
  canUpdateStatus: boolean;
  canRecord: boolean;
  onRecord: () => void;
}

function ScheduleItem({
  patientId,
  recommendation,
  status,
  canUpdateStatus,
  canRecord,
  onRecord,
}: ScheduleItemProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const vaccine =
    codingsLabel(recommendation.codes) || t("immunization_unspecified_vaccine");
  const dose = doseLabel(t, recommendation);
  const diseases = codingsLabel(recommendation.diseases);
  const dates = (
    [
      ["earliest_date", "immunization_earliest"],
      ["due_date", "immunization_due"],
      ["overdue_date", "immunization_overdue"],
    ] as const
  ).filter(([field]) => recommendation[field]);

  const { mutate: updateStatus, isPending } = useMutation({
    mutationFn: mutate(immunizationRecommendationApi.update, {
      pathParams: { patientId, id: recommendation.id },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["immunization-recommendations", patientId],
      });
      toast.success(t("immunization_recommendation_updated"));
    },
  });

  return (
    <li
      className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between"
      aria-label={vaccine}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 rounded-md bg-primary-50 p-2 text-primary-700">
          <Syringe className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="break-words font-medium text-gray-950">
              {vaccine}
            </span>
            <Badge variant={IMMUNIZATION_FORECAST_STATUS_COLORS[status]}>
              {t(`immunization_forecast__${status}`)}
            </Badge>
          </div>
          {(recommendation.series || dose || diseases) && (
            <p className="text-sm text-gray-600">
              {[
                recommendation.series,
                dose,
                diseases &&
                  t("immunization_protects_against", { diseases: diseases }),
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
          {dates.length > 0 && (
            <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
              {dates.map(([field, label]) => (
                <div key={field} className="flex gap-1">
                  <dt>{t(label)}:</dt>
                  <dd className="font-medium text-gray-700">
                    {formatDateTime(recommendation[field]!, "DD MMM YYYY")}
                  </dd>
                </div>
              ))}
            </dl>
          )}
          {recommendation.description && (
            <p className="text-xs text-gray-500">
              {recommendation.description}
            </p>
          )}
        </div>
      </div>
      {(canRecord || canUpdateStatus) && (
        <div className="flex shrink-0 items-center gap-2 self-end sm:self-start">
          {canRecord && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onRecord}
              aria-label={t("immunization_record_dose_for", { name: vaccine })}
            >
              {t("immunization_record_dose")}
            </Button>
          )}
          {canUpdateStatus && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={isPending}
                  aria-label={t("immunization_update_status_for", {
                    name: vaccine,
                  })}
                >
                  {t("status")}
                  <ChevronDown className="size-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {t("immunization_forecast_status")}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                  value={recommendation.forecast_status}
                  onValueChange={(value) => {
                    const next = value as ImmunizationForecastStatus;
                    if (next !== recommendation.forecast_status)
                      updateStatus(statusUpdate(recommendation, next));
                  }}
                >
                  {IMMUNIZATION_FORECAST_STATUS.map((option) => (
                    <DropdownMenuRadioItem key={option} value={option}>
                      {t(`immunization_forecast__${option}`)}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}
    </li>
  );
}
