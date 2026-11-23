import { ClinicalListError } from "@/components/Patient/Common/ClinicalListError";
import { FileText } from "lucide-react";
import { useTranslation } from "react-i18next";

import { HrefLink } from "@/lib/router/HrefLink";
import { cn } from "@/lib/utils";

import { appendReferralNativeContext } from "@/components/Referral/referralNativeNavigation";
import { Skeleton } from "@/components/ui/skeleton";

import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";

import { useQuestionnaireFavorites } from "./useQuestionnaireFavorites";

interface FavoriteFormsQuickActionsProps extends React.ComponentProps<"div"> {
  showEmpty?: boolean;
  returnPage?: string;
}

export const FavoriteFormsQuickActions = ({
  title,
  showEmpty = false,
  returnPage,
  ...props
}: FavoriteFormsQuickActionsProps) => {
  const { t } = useTranslation();
  const {
    selectedEncounterId: encounterId,
    patientId,
    facilityId,
  } = useEncounter();

  const {
    data: favorites = [],
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useQuestionnaireFavorites(facilityId);

  if (!isLoading && !isError && !favorites.length && !showEmpty) return null;

  return (
    <div
      {...props}
      role="region"
      aria-label={title ?? t("favorite_forms")}
      className={cn("flex min-w-0 flex-col gap-2", props.className)}
    >
      {title && (
        <h2 className="text-sm font-semibold text-gray-600">{title}</h2>
      )}
      {isError && (
        <ClinicalListError isFetching={isFetching} onRetry={refetch} />
      )}
      {isLoading ? (
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
      ) : favorites.length ? (
        <div className="flex flex-wrap gap-2">
          {favorites.map((form) => (
            <HrefLink
              key={form.id}
              href={appendReferralNativeContext(
                `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/${form.id}${returnPage ? `?${new URLSearchParams({ return_page: returnPage })}` : ""}`,
                window.location.search,
              )}
              className="inline-flex min-w-0 w-auto items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-gray-200 shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-colors text-sm font-medium text-gray-700"
            >
              <FileText className="size-3.5 shrink-0 text-gray-500" />
              <span className="min-w-0 break-words">{form.title}</span>
            </HrefLink>
          ))}
        </div>
      ) : !isError ? (
        <p className="text-sm text-gray-500">{t("no_favorites_yet")}</p>
      ) : null}
    </div>
  );
};
