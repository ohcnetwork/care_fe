import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowDownWideNarrow,
  Building2,
  ChevronRight,
  ClipboardList,
  FileText,
  Loader2,
  MapPin,
  Monitor,
  RefreshCw,
  SearchX,
} from "lucide-react";
import { Link, useQueryParams } from "raviger";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Avatar } from "@/components/Common/Avatar";
import Pagination from "@/components/Common/Pagination";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";
import { ResourceFormPicker } from "@/components/Questionnaire/ResourceFormPicker";

import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { formatDateTime, formatName } from "@/Utils/utils";
import { DeviceDetail } from "@/types/device/device";
import deviceApi from "@/types/device/deviceApi";
import { FacilityRead } from "@/types/facility/facility";
import facilityApi from "@/types/facility/facilityApi";
import { LocationRead } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";
import { QuestionnaireResponseStatus } from "@/types/questionnaire/questionnaireResponse";
import resourceQuestionnaireResponseApi, {
  ResourceQuestionnaireResponse,
} from "@/types/questionnaire/resourceQuestionnaireResponseApi";

import ResourceResponseFilters, {
  ResourceResponseFilterValues,
} from "./ResourceResponseFilters";
import ResourceResponseViewer from "./ResourceResponseViewer";
import { getResponsePreview } from "./response";
import { ResourceResponseSubjectType } from "./types";

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
  const [params, setParams] = useQueryParams();
  const parsedPage = Number(params.page);
  const page =
    Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const responseId = params.response || undefined;
  const filters: ResourceResponseFilterValues = {
    questionnaire: params.questionnaire || undefined,
    questionnaireTitle: params.questionnaire_title || undefined,
    createdBy: params.created_by || undefined,
    creatorName: params.creator_name || undefined,
    status: Object.values(QuestionnaireResponseStatus).includes(params.status)
      ? (params.status as QuestionnaireResponseStatus)
      : undefined,
  };
  const hasFilters = !!(
    filters.questionnaire ||
    filters.createdBy ||
    filters.status
  );

  const updateParams = (
    patch: Record<string, string | undefined>,
    replace = false,
  ) => {
    setParams(
      Object.fromEntries(
        Object.entries({ ...params, ...patch }).filter(
          ([, value]) => value !== undefined && value !== "",
        ),
      ),
      { replace },
    );
  };
  const handleFiltersChange = (
    patch: Partial<ResourceResponseFilterValues>,
  ) => {
    const next = { ...filters, ...patch };
    updateParams({
      questionnaire: next.questionnaire,
      questionnaire_title: next.questionnaire
        ? next.questionnaireTitle
        : undefined,
      created_by: next.createdBy,
      creator_name: next.createdBy ? next.creatorName : undefined,
      status: next.status,
      page: undefined,
      response: undefined,
    });
  };
  const clearFilters = () =>
    handleFiltersChange({
      questionnaire: undefined,
      questionnaireTitle: undefined,
      createdBy: undefined,
      creatorName: undefined,
      status: undefined,
    });

  const subjectQuery = useQuery<LocationRead | DeviceDetail | FacilityRead>({
    queryKey:
      subjectType === "facility"
        ? ["facility", facilityId]
        : [subjectType, facilityId, subjectId],
    queryFn: ({ signal }) => {
      if (subjectType === "facility") {
        return query(facilityApi.get, {
          pathParams: { facilityId },
        })({ signal });
      }
      if (subjectType === "location") {
        return query(locationApi.get, {
          pathParams: { facility_id: facilityId, id: subjectId },
        })({ signal });
      }
      return query(deviceApi.retrieve, {
        pathParams: { facility_id: facilityId, id: subjectId },
      })({ signal });
    },
  });
  const resolvedSubjectName =
    subjectName ??
    (subjectQuery.data &&
      ("name" in subjectQuery.data
        ? subjectQuery.data.name
        : subjectQuery.data.registered_name));
  const SubjectIcon = {
    location: MapPin,
    device: Monitor,
    facility: Building2,
  }[subjectType];
  const responsesQuery = useQuery<
    PaginatedResponse<ResourceQuestionnaireResponse>
  >({
    queryKey: [
      "resourceResponses",
      facilityId,
      subjectType,
      subjectId,
      {
        page,
        questionnaire: filters.questionnaire,
        created_by: filters.createdBy,
        status: filters.status,
      },
    ],
    queryFn: query(resourceQuestionnaireResponseApi.list, {
      queryParams: {
        subject_type: subjectType,
        subject_id: subjectId,
        questionnaire: filters.questionnaire,
        created_by: filters.createdBy,
        status: filters.status,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      },
    }),
    enabled: !!subjectQuery.data && !subjectQuery.isError,
    placeholderData: (previousData, previousQuery) =>
      previousQuery?.queryKey[1] === facilityId &&
      previousQuery.queryKey[2] === subjectType &&
      previousQuery.queryKey[3] === subjectId
        ? previousData
        : undefined,
  });
  const responses = responsesQuery.data?.results ?? [];
  const responseFromList = responses.find(
    (response) => response.id === responseId,
  );
  const detailQuery = useQuery({
    queryKey: [
      "resourceResponses",
      facilityId,
      subjectType,
      subjectId,
      "detail",
      responseId,
    ],
    queryFn: query(resourceQuestionnaireResponseApi.get, {
      pathParams: { id: responseId ?? "" },
      queryParams: { subject_type: subjectType, subject_id: subjectId },
    }),
    enabled:
      !!responseId &&
      !!subjectQuery.data &&
      !subjectQuery.isError &&
      !responseFromList,
    retry: false,
  });
  const selectedResponse = responseFromList ?? detailQuery.data ?? null;
  const selectedIndex = responses.findIndex(
    (response) => response.id === responseId,
  );
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
            <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
              <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
                {hasFilters ? (
                  <SearchX className="size-6" />
                ) : (
                  <ClipboardList className="size-6" />
                )}
              </div>
              <h3 className="text-base font-semibold text-neutral-950">
                {hasFilters
                  ? t("no_matching_responses")
                  : t("no_responses_found")}
              </h3>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-neutral-600">
                {hasFilters
                  ? t("no_matching_responses_description")
                  : t(`${subjectType}_responses_empty_description`)}
              </p>
              {hasFilters ? (
                <Button
                  variant="outline"
                  className="mt-5 h-12 border-neutral-400 text-neutral-950 shadow-md hover:bg-neutral-200/75 focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 md:h-10"
                  onClick={clearFilters}
                >
                  {t("clear_filters")}
                </Button>
              ) : page > 1 ? (
                <Button
                  variant="outline"
                  className="mt-5 h-12 border-neutral-400 text-neutral-950 shadow-md hover:bg-neutral-200/75 focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 md:h-10"
                  onClick={() => updateParams({ page: undefined })}
                >
                  {t("back_to_first_page")}
                </Button>
              ) : (
                <ResourceFormPicker
                  facilityId={facilityId}
                  subjectType={subjectType}
                  subjectId={subjectId}
                  disabled={!subjectQuery.data || subjectQuery.isError}
                  trigger={
                    <Button
                      variant="outline"
                      className="mt-5 h-12 border-neutral-400 text-neutral-950 shadow-md hover:bg-neutral-200/75 focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 md:h-10"
                      disabled={!subjectQuery.data || subjectQuery.isError}
                    >
                      {t("submit_forms")}
                    </Button>
                  }
                />
              )}
            </div>
          ) : (
            <div
              aria-busy={isUpdating}
              className={cn(responsesQuery.isPlaceholderData && "opacity-60")}
            >
              <Table>
                <TableHeader className="bg-neutral-50">
                  <TableRow className="border-neutral-200 hover:bg-transparent">
                    <TableHead className="h-10 px-4 text-sm font-medium text-neutral-950">
                      {t("questionnaire")}
                    </TableHead>
                    <TableHead className="hidden h-10 text-sm font-medium text-neutral-950 lg:table-cell">
                      {t("submitted_by")}
                    </TableHead>
                    <TableHead className="hidden h-10 text-sm font-medium text-neutral-950 md:table-cell">
                      {t("submitted_on")}
                    </TableHead>
                    <TableHead className="hidden h-10 text-sm font-medium text-neutral-950 md:table-cell">
                      {t("status")}
                    </TableHead>
                    <TableHead className="w-20 px-4 text-right">
                      <span className="sr-only">{t("view_response")}</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {responses.map((response) => {
                    const author = formatName(response.created_by);
                    const preview = getResponsePreview(response, t);
                    const enteredInError =
                      response.status ===
                      QuestionnaireResponseStatus.EnteredInError;
                    const statusBadge = (
                      <Badge
                        size="xs"
                        variant={enteredInError ? "destructive" : "green"}
                        className={cn(
                          "h-5 rounded-sm px-2 py-0",
                          enteredInError
                            ? "border-red-500/45"
                            : "border-green-500/40",
                        )}
                      >
                        {t(response.status)}
                      </Badge>
                    );
                    return (
                      <TableRow
                        key={response.id}
                        data-response-id={response.id}
                        data-state={
                          response.id === responseId ? "selected" : undefined
                        }
                        className="group cursor-pointer border-neutral-200 hover:bg-neutral-100/50 focus-within:bg-neutral-100/50 data-[state=selected]:bg-neutral-100"
                        onClick={() => {
                          if (!responsesQuery.isPlaceholderData)
                            updateParams({ response: response.id });
                        }}
                      >
                        <TableCell className="max-w-sm whitespace-normal px-4 py-4">
                          <div className="flex items-start gap-3">
                            <div className="hidden size-9 shrink-0 items-center justify-center rounded-lg border border-neutral-100 bg-neutral-50 text-neutral-500 sm:flex">
                              <FileText className="size-4" aria-hidden="true" />
                            </div>
                            <div className="min-w-0 space-y-1.5">
                              <p
                                id={`response-title-${response.id}`}
                                className="break-words font-medium leading-snug text-neutral-950"
                              >
                                {response.questionnaire.title}
                              </p>
                              {preview && (
                                <p className="line-clamp-1 break-all text-xs leading-relaxed text-neutral-500">
                                  {preview}
                                </p>
                              )}
                              <p className="text-xs text-neutral-500 lg:hidden">
                                {author}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 md:hidden">
                                <span className="text-xs text-neutral-500">
                                  {response.created_date
                                    ? formatDateTime(
                                        response.created_date,
                                        "DD MMM YYYY, h:mm A",
                                      )
                                    : t("unknown")}
                                </span>
                                {statusBadge}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-2.5">
                            <Avatar
                              name={author}
                              className="size-7 shrink-0 rounded-full"
                            />
                            <span
                              className="max-w-40 truncate text-neutral-700"
                              title={author}
                            >
                              {author}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <p className="text-neutral-700">
                            {response.created_date
                              ? formatDateTime(
                                  response.created_date,
                                  "DD MMM YYYY",
                                )
                              : t("unknown")}
                          </p>
                          {response.created_date && (
                            <p className="mt-1 text-xs text-neutral-500">
                              {formatDateTime(response.created_date, "h:mm A")}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {statusBadge}
                        </TableCell>
                        <TableCell className="px-3 text-right sm:px-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-12 gap-1 text-sm text-neutral-950 underline underline-offset-4 hover:bg-neutral-200/75 hover:text-neutral-950 focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 md:h-10"
                            disabled={responsesQuery.isPlaceholderData}
                            aria-describedby={`response-title-${response.id}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              updateParams({ response: response.id });
                            }}
                          >
                            {t("view")}
                            <ChevronRight
                              className="size-4"
                              aria-hidden="true"
                            />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
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
