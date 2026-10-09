import { History } from "lucide-react";
import { Link, useFullPath, useQueryParams } from "raviger";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { EncounterAccordionLayout } from "@/components/Patient/EncounterAccordionLayout";

import { ClinicalListError } from "./ClinicalListError";

interface ClinicalListQueryState {
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  refetch: () => unknown;
  fetchNextPage: () => unknown;
}

interface ClinicalListPanelProps {
  title: string;
  facilityId?: string;
  patientId: string;
  encounterId?: string;
  readOnly: boolean;
  className?: string;
  presentation: "default" | "panel";
  questionnaire: "allergy_intolerance" | "symptom" | "diagnosis";
  history: "allergies" | "symptoms" | "diagnoses";
  emptyMessage: string;
  hasData: boolean;
  showEmpty: boolean;
  queryState: ClinicalListQueryState;
  children: ReactNode;
}

/** Shared presentation for clinical lists in any encounter layout. */
export function ClinicalListPanel({
  title,
  facilityId,
  patientId,
  encounterId,
  readOnly,
  className,
  presentation,
  questionnaire,
  history,
  emptyMessage,
  hasData,
  showEmpty,
  queryState,
  children,
}: ClinicalListPanelProps) {
  const { t } = useTranslation();
  const fullPath = useFullPath();
  const [queryParams] = useQueryParams<Record<string, string>>();
  const search = new URLSearchParams(queryParams).toString();
  const sourceUrl = search ? `${fullPath}?${search}` : fullPath;
  const editSearch = new URLSearchParams({
    return_page: fullPath.split("/").pop() ?? "updates",
  });
  const patientPath = facilityId
    ? `/facility/${facilityId}/patient/${patientId}`
    : `/patient/${patientId}`;

  if (!queryState.isLoading && !queryState.isError && !hasData && !showEmpty) {
    return null;
  }

  return (
    <section aria-label={title} className="min-w-0">
      <EncounterAccordionLayout
        title={title}
        readOnly={readOnly}
        presentation={presentation}
        className={cn("min-w-0 overflow-hidden", className)}
        editLink={
          !readOnly && encounterId
            ? `${patientPath}/encounter/${encounterId}/questionnaire/${questionnaire}?${editSearch}`
            : undefined
        }
        actionButton={
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="hover:bg-transparent text-gray-500 hover:text-gray-500"
          >
            <Link
              href={`${patientPath}/history/${history}?sourceUrl=${encodeURIComponent(sourceUrl)}`}
              aria-label={t("view_history")}
            >
              <History className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        }
      >
        {queryState.isLoading ? (
          <div
            className="space-y-2 p-2"
            role="status"
            aria-label={t("loading")}
          >
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : (
          <div className="space-y-3">
            {queryState.isError && (
              <ClinicalListError
                isFetching={queryState.isFetching}
                onRetry={queryState.refetch}
              />
            )}
            {hasData ? (
              <div className="@container/clinical-widget">{children}</div>
            ) : (
              !queryState.isError && (
                <p className="px-2 py-5 text-sm text-gray-500">
                  {emptyMessage}
                </p>
              )
            )}
            {queryState.hasNextPage && (
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  disabled={queryState.isFetchingNextPage}
                  onClick={() => queryState.fetchNextPage()}
                >
                  {queryState.isFetchingNextPage
                    ? t("loading")
                    : t("load_more")}
                </Button>
              </div>
            )}
          </div>
        )}
      </EncounterAccordionLayout>
    </section>
  );
}
