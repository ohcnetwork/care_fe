import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowUpRight,
  GitPullRequestArrow,
  LockKeyhole,
} from "lucide-react";
import { Link, usePath, useQueryParams } from "raviger";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Frame,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  ReferralDepartmentFilterConfig,
  ReferralFilterUpdates,
  ReferralFilters,
} from "@/components/Referral/ReferralFilters";

import Pagination from "@/components/Common/Pagination";
import { getReferralDetailUrl } from "@/components/Referral/referralNavigation";
import { ReferralStatusBadge } from "@/components/Referral/ReferralStatusBadge";

import {
  REFERRAL_STATUSES,
  ReferralDestinationType,
  ReferralStatus,
} from "@/types/emr/referral/referral";
import referralApi from "@/types/emr/referral/referralApi";
import query from "@/Utils/request/query";
import { HTTPError, QueryParams } from "@/Utils/request/types";
import { formatDateTime, formatName } from "@/Utils/utils";

export type ReferralListScope =
  | { patientId: string; encounterId?: string }
  | {
      entityType: ReferralDestinationType;
      entityId: string;
    };

interface ReferralListProps {
  scope: ReferralListScope;
  departmentFilter?: ReferralDepartmentFilterConfig;
  filterDescription?: string;
  variant?: "full" | "widget";
  actions?: ReactNode;
  onViewAll?: () => void;
  title?: string;
  showEmpty?: boolean;
  widgetConfig?: {
    status?: ReferralStatus;
    assigned_to_me?: boolean;
    limit?: number;
  };
}

export function ReferralList({
  scope,
  departmentFilter,
  filterDescription,
  variant = "full",
  actions,
  onViewAll,
  title,
  showEmpty = true,
  widgetConfig,
}: ReferralListProps) {
  const { t } = useTranslation();
  const path = usePath();
  const [filters, setFilters] = useQueryParams<{
    referralDepartment?: string;
    referralDestination?: string;
    referralStatus?: string;
    referralAssignedToMe?: string;
    referralPage?: string;
    referralScope?: string;
  }>();
  const isWidget = variant === "widget";
  // A saved page belongs to one destination/patient/encounter. Changing the
  // selected encounter must not carry an out-of-range page into its list.
  const scopeKey =
    "entityType" in scope
      ? `${scope.entityType}:${scope.entityId}`
      : scope.encounterId
        ? `encounter:${scope.encounterId}`
        : `patient:${scope.patientId}`;
  const requestedPage = Number(filters.referralPage || 1);
  const page =
    !isWidget &&
    filters.referralScope === scopeKey &&
    Number.isSafeInteger(requestedPage) &&
    requestedPage > 0
      ? requestedPage
      : 1;
  const status =
    REFERRAL_STATUSES.find((value) => value === filters.referralStatus) ??
    "all";
  const assignedToMe = filters.referralAssignedToMe === "true";
  const setPage = (page: number) =>
    setFilters(
      { referralPage: String(page), referralScope: scopeKey },
      { overwrite: false, replace: true },
    );
  const handleFilterUpdate = (updates: ReferralFilterUpdates) => {
    const patch: Record<string, string | null> = { referralPage: "1" };
    if ("status" in updates) patch.referralStatus = updates.status ?? null;
    if ("assignedToMe" in updates)
      patch.referralAssignedToMe = updates.assignedToMe ? "true" : null;
    if (departmentFilter && "department" in updates) {
      patch.referralDepartment = updates.department?.id ?? null;
      patch.referralDestination = updates.department
        ? "department"
        : "facility";
    }
    // One URL update keeps clearing multiple filters atomic and preserves context.
    setFilters(patch, { overwrite: false, replace: true });
  };
  const clearFilters = () =>
    handleFilterUpdate({
      status: null,
      assignedToMe: false,
      ...(departmentFilter ? { department: null } : {}),
    });
  const sourceUrl = (path ?? "") + window.location.search;
  const limit = isWidget ? (widgetConfig?.limit ?? 5) : 15;
  const activeStatus = isWidget ? (widgetConfig?.status ?? "all") : status;
  const activeAssignedToMe = isWidget
    ? widgetConfig?.assigned_to_me === true
    : assignedToMe;
  const isEntityScope = "entityType" in scope;
  const scopeParams: QueryParams = isEntityScope
    ? {
        entity_type: scope.entityType,
        entity_id: scope.entityId,
      }
    : { patient: scope.patientId, encounter: scope.encounterId };
  const queryParams: QueryParams = {
    ...scopeParams,
    limit,
    offset: (page - 1) * limit,
    ordering: "-created_date",
    status: activeStatus === "all" ? undefined : activeStatus,
    assigned_to_me: activeAssignedToMe || undefined,
  };
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["referrals", "list", queryParams],
    queryFn: query(referralApi.list, { queryParams, silent: true }),
    retry: false,
  });
  const denied = error instanceof HTTPError && error.status === 403;
  const filtered =
    activeStatus !== "all" ||
    activeAssignedToMe ||
    (!isWidget && !!departmentFilter?.departmentId);

  if (isWidget && !showEmpty && !isLoading && !error && !data?.results.length)
    return null;

  return (
    <section
      className="min-w-0"
      aria-label={isWidget ? (title ?? t("referrals")) : undefined}
      data-cy="referral-list"
    >
      <Frame spacing="sm" className="min-w-0">
        <FrameHeader className="flex-row flex-wrap items-center justify-between gap-3">
          {isWidget ? (
            <div className="flex min-w-0 items-center gap-2">
              <GitPullRequestArrow className="size-4 shrink-0 text-muted-foreground" />
              <FrameTitle>{title ?? t("referrals")}</FrameTitle>
              {data && (
                <Badge variant="neutral" size="xs" counter>
                  {data.count}
                </Badge>
              )}
            </div>
          ) : (
            <ReferralFilters
              key={departmentFilter?.facilityId ?? "clinical"}
              departmentFilter={departmentFilter}
              status={status === "all" ? null : status}
              statusOptions={REFERRAL_STATUSES.map((value) => ({
                value,
                label: t(`referral_status_${value}`),
              }))}
              assignedToMe={assignedToMe}
              onChange={handleFilterUpdate}
            />
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
          {!isWidget && filterDescription && (
            <p className="basis-full text-sm text-muted-foreground">
              {filterDescription}
            </p>
          )}
        </FrameHeader>
        <FramePanel className="min-w-0 overflow-hidden p-0">
          {isLoading ? (
            <div
              className="space-y-3 p-4"
              role="status"
              aria-label={t("loading")}
            >
              {Array.from({ length: isWidget ? 2 : 5 }, (_, index) => (
                <Skeleton key={index} className="h-12 w-full bg-muted" />
              ))}
            </div>
          ) : error ? (
            <Empty className="p-6 sm:p-10" role="alert">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  {denied ? <LockKeyhole /> : <AlertCircle />}
                </EmptyMedia>
                <EmptyTitle>
                  {t(
                    denied
                      ? "referral_list_access_denied"
                      : "referral_load_failed",
                  )}
                </EmptyTitle>
                <EmptyDescription>
                  {t(
                    denied
                      ? "referral_list_access_denied_description"
                      : "referral_load_failed_description",
                  )}
                </EmptyDescription>
              </EmptyHeader>
              {!denied && (
                <EmptyContent>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isFetching}
                    onClick={() => refetch()}
                  >
                    {t("retry")}
                  </Button>
                </EmptyContent>
              )}
            </Empty>
          ) : !data?.results.length ? (
            <Empty className="p-6 sm:p-10">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <GitPullRequestArrow />
                </EmptyMedia>
                <EmptyTitle>{t("referral_list_empty")}</EmptyTitle>
                <EmptyDescription>
                  {t(
                    filtered
                      ? "referral_list_empty_filtered"
                      : "referral_list_empty_description",
                  )}
                </EmptyDescription>
              </EmptyHeader>
              {filtered && !isWidget && (
                <EmptyContent>
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    {t("clear_filters")}
                  </Button>
                </EmptyContent>
              )}
            </Empty>
          ) : isWidget ? (
            <ItemGroup className="gap-0 has-data-[size=sm]:gap-0 divide-y divide-border">
              {data.results.map((referral) => (
                <div key={referral.id} role="listitem">
                  <Item
                    asChild
                    size="sm"
                    className="rounded-none text-left hover:bg-muted/50"
                  >
                    <Link href={getReferralDetailUrl(referral.id, sourceUrl)}>
                      <ItemContent className="min-w-0">
                        <ItemTitle className="max-w-full truncate">
                          {referral.title}
                        </ItemTitle>
                        <ItemDescription className="truncate text-xs">
                          {referral.availability_name}
                        </ItemDescription>
                      </ItemContent>
                      <ItemActions>
                        <ReferralStatusBadge status={referral.status} />
                      </ItemActions>
                    </Link>
                  </Item>
                </div>
              ))}
            </ItemGroup>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">{t("referral")}</TableHead>
                  {isEntityScope && <TableHead>{t("patient")}</TableHead>}
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("assigned_to")}</TableHead>
                  <TableHead className="pr-4">{t("created_date")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.results.map((referral) => (
                  <TableRow key={referral.id} data-cy="referral-row">
                    <TableCell className="min-w-80 max-w-lg py-3 pl-4">
                      <Link
                        href={getReferralDetailUrl(referral.id, sourceUrl)}
                        className="block max-w-full truncate text-left font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-ring"
                      >
                        {referral.title}
                      </Link>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {referral.availability_name}
                      </p>
                    </TableCell>
                    {isEntityScope && (
                      <TableCell className="max-w-52 truncate">
                        {referral.patient_name}
                      </TableCell>
                    )}
                    <TableCell>
                      <ReferralStatusBadge status={referral.status} />
                    </TableCell>
                    <TableCell className="max-w-52 whitespace-normal text-muted-foreground">
                      {referral.assignees.length
                        ? referral.assignees
                            .map(({ member }) => formatName(member))
                            .join(", ")
                        : t("unassigned")}
                    </TableCell>
                    <TableCell className="pr-4 text-muted-foreground">
                      {formatDateTime(referral.created_date)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </FramePanel>
        {!isWidget && data && data.results.length > 0 && !error && (
          <FrameFooter className="flex-row flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {t("referral_result_range", {
                start: (page - 1) * limit + 1,
                end: Math.min(page * limit, data.count),
                count: data.count,
              })}
            </p>
            <Pagination
              data={{ totalCount: data.count }}
              cPage={page}
              defaultPerPage={limit}
              onChange={setPage}
              className=""
            />
          </FrameFooter>
        )}
        {isWidget && onViewAll && (
          <FrameFooter>
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={onViewAll}
            >
              {t("referral_view_all")}
              <ArrowUpRight className="size-4" />
            </Button>
          </FrameFooter>
        )}
      </Frame>
    </section>
  );
}
