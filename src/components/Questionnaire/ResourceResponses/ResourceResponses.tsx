import {
  AlertCircle,
  ArrowDownWideNarrow,
  Building2,
  Loader2,
  MapPin,
  Monitor,
  RefreshCw,
} from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import Pagination from "@/components/Common/Pagination";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import ResourceResponseFilters from "./ResourceResponseFilters";
import ResourceResponseViewer from "./ResourceResponseViewer";
import { ResourceResponseSubjectType } from "./types";

import { ResourceResponseTable } from "./ResourceResponseTable";
import { ResourceResponsesEmptyState } from "./ResourceResponsesEmptyState";
import { useResourceResponseParams } from "./useResourceResponseParams";
import { useResourceResponseQueries } from "./useResourceResponseQueries";

interface ResourceResponsesProps {
  facilityId: string;
  subjectType: ResourceResponseSubjectType;
  subjectId: string;
  subjectName?: string;
  contextHref?: string;
}

const PAGE_SIZE = 20;

export function ResourceResponses({
  facilityId,
  subjectType,
  subjectId,
  subjectName,
  contextHref,
}: ResourceResponsesProps) {
  const { t } = useTranslation();
  const {
    page,
    responseId,
    filters,
    hasFilters,
    updateParams,
    handleFiltersChange,
    clearFilters,
  } = useResourceResponseParams();
  const {
    subjectQuery,
    resolvedSubjectName,
    responsesQuery,
    responses,
    responseFromList,
    detailQuery,
    selectedResponse,
    selectedIndex,
  } = useResourceResponseQueries({
    facilityId,
    subjectType,
    subjectId,
    subjectName,
    page,
    pageSize: PAGE_SIZE,
    responseId,
    filters,
  });
  const SubjectIcon = {
    location: MapPin,
    device: Monitor,
    facility: Building2,
  }[subjectType];
  const isLoading = subjectQuery.isPending || responsesQuery.isLoading;
  const isError = subjectQuery.isError || responsesQuery.isError;
  const isUpdating = responsesQuery.isFetching && !isLoading;
  const totalCount = responsesQuery.data?.count ?? 0;
  const handleRefresh = () =>
    void (subjectQuery.isError
      ? subjectQuery.refetch()
      : responsesQuery.refetch());
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success(t("response_link_copied"));
    } catch {
      toast.error(t("response_link_copy_failed"));
    }
  };

  return (
    <>
      <div className="space-y-5" data-cy={`${subjectType}-responses-page`}>
        <div className="space-y-2">
          {contextHref && subjectQuery.data && (
            <Link
              basePath="/"
              href={contextHref}
              className="inline-flex max-w-full items-center gap-1.5 rounded-sm text-sm font-medium text-neutral-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            >
              <SubjectIcon
                className="size-4 shrink-0 text-neutral-400"
                aria-hidden="true"
              />
              <span className="break-words">{resolvedSubjectName}</span>
            </Link>
          )}
          <p className="text-sm text-neutral-600">
            {t(`${subjectType}_responses_description`)}
          </p>
        </div>

        <div className="overflow-hidden rounded-[10px] border border-neutral-200 bg-white shadow-xs">
          <div className="border-b border-neutral-200">
            <ResourceResponseFilters
              facilityId={facilityId}
              subjectType={subjectType}
              value={filters}
              onChange={handleFiltersChange}
            />
          </div>
          <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3">
            <div
              className="flex items-center gap-2.5"
              role="status"
              aria-live="polite"
            >
              <h2 className="text-sm font-semibold text-neutral-950">
                {hasFilters ? t("matching_submissions") : t("all_submissions")}
              </h2>
              {!isLoading && !isError && !responsesQuery.isPlaceholderData && (
                <Badge
                  variant="secondary"
                  size="xs"
                  className="h-5 rounded-sm border-neutral-400/40 bg-neutral-100 px-2 py-0 text-neutral-700 tabular-nums"
                >
                  {totalCount}
                </Badge>
              )}
              {isUpdating && (
                <Loader2
                  className="size-3.5 animate-spin text-neutral-500"
                  aria-label={t("updating_results")}
                />
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-xs text-neutral-500">
                <ArrowDownWideNarrow className="size-3.5" aria-hidden="true" />
                {t("newest_first")}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="size-12 text-neutral-700 hover:bg-neutral-200/75 focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 md:size-10 [&_svg]:size-5"
                aria-label={t("refresh")}
                title={t("refresh")}
                disabled={responsesQuery.isFetching || subjectQuery.isFetching}
                onClick={handleRefresh}
              >
                <RefreshCw className="size-4" />
              </Button>
            </div>
          </div>

          {isError ? (
            <div className="p-5">
              <Alert variant="destructive">
                <AlertCircle />
                <AlertDescription>
                  <p>{t(`error_loading_${subjectType}_responses`)}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 h-12 border-neutral-400 text-sm text-neutral-950 shadow-md hover:bg-neutral-200/75 focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 md:h-10"
                    onClick={handleRefresh}
                  >
                    {t("try_again")}
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          ) : isLoading ? (
            <div className="p-4">
              <TableSkeleton count={5} />
            </div>
          ) : responses.length === 0 ? (
            <ResourceResponsesEmptyState
              facilityId={facilityId}
              subjectType={subjectType}
              subjectId={subjectId}
              hasFilters={hasFilters}
              page={page}
              disabled={!subjectQuery.data || subjectQuery.isError}
              onClearFilters={clearFilters}
              onFirstPage={() => updateParams({ page: undefined })}
            />
          ) : (
            <ResourceResponseTable
              responses={responses}
              responseId={responseId}
              isUpdating={isUpdating}
              isPlaceholderData={responsesQuery.isPlaceholderData}
              onSelect={(id) => updateParams({ response: id })}
            />
          )}

          {!isError &&
            !isLoading &&
            responsesQuery.data &&
            responses.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 px-4 py-3">
                <p className="text-xs text-neutral-500" aria-live="polite">
                  {t("response_results_range", {
                    start: (page - 1) * PAGE_SIZE + 1,
                    end: Math.min(page * PAGE_SIZE, totalCount),
                    total: totalCount,
                  })}
                </p>
                <Pagination
                  data={{ totalCount }}
                  defaultPerPage={PAGE_SIZE}
                  cPage={page}
                  onChange={(nextPage) =>
                    updateParams({
                      page: nextPage === 1 ? undefined : String(nextPage),
                      response: undefined,
                    })
                  }
                  className="flex items-center [&_button]:h-12 [&_button]:min-w-12 [&_button]:focus-visible:ring-0 [&_button]:focus-visible:outline-2 [&_button]:focus-visible:outline-offset-2 [&_button]:focus-visible:outline-indigo-500 md:[&_button]:h-10 md:[&_button]:min-w-10 [&_button.bg-primary-700]:bg-emerald-800 [&_button.bg-primary-700]:hover:bg-emerald-900 [&_button.bg-gray-100]:bg-neutral-100 [&_button.bg-gray-100]:text-neutral-950 [&_button.bg-gray-100]:hover:bg-neutral-200/75 [&_nav]:border-neutral-300"
                />
              </div>
            )}
        </div>
      </div>

      <ResourceResponseViewer
        open={!!responseId}
        response={selectedResponse}
        subjectType={subjectType}
        subjectName={resolvedSubjectName}
        isLoading={
          !subjectQuery.isError &&
          (subjectQuery.isPending ||
            (!responseFromList && detailQuery.isPending))
        }
        error={
          subjectQuery.isError || (!responseFromList && detailQuery.isError)
        }
        onRetry={() =>
          void (subjectQuery.isError
            ? subjectQuery.refetch()
            : detailQuery.refetch())
        }
        onClose={() => updateParams({ response: undefined }, true)}
        onCopyLink={handleCopyLink}
        position={selectedIndex >= 0 ? selectedIndex + 1 : undefined}
        total={responses.length}
        onPrevious={
          selectedIndex > 0 && !responsesQuery.isPlaceholderData
            ? () =>
                updateParams(
                  { response: responses[selectedIndex - 1].id },
                  true,
                )
            : undefined
        }
        onNext={
          selectedIndex >= 0 &&
          selectedIndex < responses.length - 1 &&
          !responsesQuery.isPlaceholderData
            ? () =>
                updateParams(
                  { response: responses[selectedIndex + 1].id },
                  true,
                )
            : undefined
        }
      />
    </>
  );
}
