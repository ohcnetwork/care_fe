import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Plus, Search, Syringe } from "lucide-react";
import { Link } from "raviger";
import { useId } from "react";
import { useTranslation } from "react-i18next";

import PageHeadTitle from "@/components/Common/PageHeadTitle";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import {
  ImmunizationPolicyRead,
  ImmunizationPolicyScope,
  ImmunizationPolicyTemplate,
} from "@/types/emr/immunizationPolicy/immunizationPolicy";
import immunizationPolicyApi from "@/types/emr/immunizationPolicy/immunizationPolicyApi";

import { useImmunizationPolicyAccess } from "./useImmunizationPolicyAccess";
import { fetchImmunizationPolicyCatalogue } from "./useImmunizationPolicyOwnership";

function countRecommendations(template: ImmunizationPolicyTemplate): number {
  return template.is_group
    ? (template.children ?? []).reduce(
        (count, child) => count + countRecommendations(child),
        0,
      )
    : 1;
}

function vaccineLabels(template: ImmunizationPolicyTemplate): string[] {
  const codes = new Map<string, string>();
  const collect = (node: ImmunizationPolicyTemplate) => {
    for (const coding of node.codes ?? []) {
      codes.set(
        `${coding.system ?? ""}|${coding.code}`,
        coding.display || coding.code,
      );
    }
    (node.children ?? []).forEach(collect);
  };
  collect(template);
  return [...codes.values()];
}

export default function ImmunizationPolicyList({
  scope,
}: {
  scope: ImmunizationPolicyScope;
}) {
  const { t } = useTranslation();
  const searchId = useId();
  const {
    canRead,
    canWrite,
    isLoading: isAccessLoading,
  } = useImmunizationPolicyAccess(scope);
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 15,
    disableCache: true,
  });
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["immunization-policies", scope.facilityId, qParams],
    queryFn: query.debounced(immunizationPolicyApi.list, {
      queryParams: {
        facility: scope.facilityId,
        name: qParams.name || undefined,
        limit: resultsPerPage,
        offset: ((qParams.page || 1) - 1) * resultsPerPage,
        ordering: "-created_date",
      },
    }),
    enabled: canRead && !isAccessLoading,
  });
  const loading = isAccessLoading || isLoading;
  const policies = data?.results ?? [];
  const needsOwnershipLookup =
    !!scope.facilityId &&
    policies.some((policy) => policy.facility === undefined);
  // A facility list contains its own policies and instance policies. Fetch the
  // complete instance catalogue once to distinguish responses without scope.
  const instanceCatalogue = useQuery({
    queryKey: ["immunization-policies", "instance-catalogue"],
    queryFn: ({ signal }) => fetchImmunizationPolicyCatalogue(signal),
    enabled: needsOwnershipLookup && canRead && !isAccessLoading,
  });
  const ownership = (policy: ImmunizationPolicyRead) => {
    if (policy.facility === null) return "instance";
    if (policy.facility !== undefined) {
      return policy.facility === scope.facilityId ? "facility" : "unknown";
    }
    // The unscoped endpoint returns only instance policies.
    if (!scope.facilityId) return "instance";
    if (!instanceCatalogue.isSuccess || instanceCatalogue.isFetching)
      return "unknown";
    return instanceCatalogue.data.results.some(
      (entry) => entry.id === policy.id,
    )
      ? "instance"
      : "facility";
  };
  const scopeBadge = (policy: ImmunizationPolicyRead) => {
    if (
      policy.facility === undefined &&
      needsOwnershipLookup &&
      instanceCatalogue.isFetching
    ) {
      return <Skeleton className="h-5 w-16" aria-label={t("loading")} />;
    }
    const policyScope = ownership(policy);
    return (
      <Badge
        variant="outline"
        size="xs"
        className="max-w-full whitespace-nowrap font-normal"
        title={t(`immunization_scope_${policyScope}`)}
      >
        <span className="truncate">
          {t(`immunization_scope_${policyScope}`)}
        </span>
      </Badge>
    );
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-1 py-4 sm:px-4">
      <PageHeadTitle title={t("immunization_policies")} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-gray-950">
            {t("immunization_policies")}
          </h1>
          <p className="text-sm text-gray-500">
            {t(
              scope.facilityId
                ? "immunization_policy_facility_list_description"
                : "immunization_policy_instance_list_description",
            )}
          </p>
        </div>
        {canWrite && !isAccessLoading && (
          <Button asChild size="sm" className="shrink-0">
            <Link href={`${scope.basePath}/new`} basePath="/">
              <Plus className="size-4" aria-hidden="true" />
              {t("immunization_policy_create_short")}
            </Link>
          </Button>
        )}
      </div>

      {!isAccessLoading && !canRead ? (
        <Alert>
          <AlertDescription>
            {t("immunization_policy_access_denied")}
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-3">
          <div className="relative max-w-sm">
            <Label htmlFor={searchId} className="sr-only">
              {t("immunization_policy_search")}
            </Label>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
            <Input
              id={searchId}
              value={qParams.name || ""}
              placeholder={t("immunization_policy_search")}
              className="h-9 pl-9"
              onChange={(event) =>
                updateQuery({ name: event.target.value, page: 1 })
              }
            />
          </div>

          {needsOwnershipLookup && instanceCatalogue.isError && (
            <Alert>
              <AlertDescription className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>{t("immunization_policy_scope_error")}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => instanceCatalogue.refetch()}
                >
                  {t("immunization_retry")}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div
              className="divide-y overflow-hidden rounded-lg border border-gray-200 bg-white"
              aria-busy="true"
              aria-label={t("loading")}
            >
              <div className="h-10 bg-gray-50" />
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="flex h-[72px] items-center gap-8 px-4"
                >
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-5/6" />
                  </div>
                  <Skeleton className="hidden h-4 w-1/4 sm:block" />
                  <Skeleton className="h-5 w-16" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <Alert variant="destructive">
              <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
                <span>{t("immunization_policy_list_error")}</span>
                <Button size="sm" variant="outline" onClick={() => refetch()}>
                  {t("immunization_retry")}
                </Button>
              </AlertDescription>
            </Alert>
          ) : policies.length === 0 ? (
            <div className="flex flex-col items-center rounded-lg border border-gray-200 bg-white px-6 py-12 text-center">
              <Syringe
                className="mb-3 size-6 text-gray-400"
                aria-hidden="true"
              />
              <h2 className="font-semibold text-gray-950">
                {t(
                  qParams.name
                    ? "immunization_policy_search_empty"
                    : "immunization_policy_empty",
                )}
              </h2>
              <p className="mt-1 max-w-md text-sm leading-6 text-gray-500">
                {t(
                  qParams.name
                    ? "immunization_policy_search_empty_hint"
                    : "immunization_policy_empty_hint",
                )}
              </p>
              {qParams.name && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => updateQuery({ name: undefined, page: 1 })}
                >
                  {t("clear_search")}
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="hidden overflow-hidden rounded-lg border border-gray-200 bg-white lg:block">
                <Table className="table-fixed">
                  <TableHeader className="bg-gray-50">
                    <TableRow className="hover:bg-gray-50">
                      <TableHead className="w-[34%] px-4 text-xs font-medium text-gray-500">
                        {t("immunization_policy_column")}
                      </TableHead>
                      <TableHead className="w-[28%] px-4 text-xs font-medium text-gray-500">
                        {t("immunization_policy_vaccines")}
                      </TableHead>
                      <TableHead className="w-[20%] px-4 text-xs font-medium text-gray-500">
                        {t("immunization_policy_recommendations")}
                      </TableHead>
                      <TableHead className="w-[18%] px-4 text-xs font-medium text-gray-500">
                        {t("immunization_policy_scope")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {policies.map((policy) => {
                      const vaccines = vaccineLabels(
                        policy.policy_template,
                      ).join(", ");
                      return (
                        <TableRow
                          key={policy.id}
                          className="h-[72px] hover:bg-gray-50"
                        >
                          <TableCell className="px-4 py-3 whitespace-normal">
                            <Link
                              href={`${scope.basePath}/${policy.id}`}
                              basePath="/"
                              className="block truncate rounded-sm font-medium text-gray-950 hover:text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                              title={policy.name}
                            >
                              {policy.name}
                            </Link>
                            {policy.description && (
                              <p
                                className="mt-1 truncate text-xs text-gray-500"
                                title={policy.description}
                              >
                                {policy.description}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="px-4 py-3 whitespace-normal">
                            <p
                              className="line-clamp-2 break-words text-sm leading-5 text-gray-600"
                              title={vaccines}
                            >
                              {vaccines || "—"}
                            </p>
                          </TableCell>
                          <TableCell className="px-4 py-3 tabular-nums text-gray-600">
                            {countRecommendations(policy.policy_template)}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            {scopeBadge(policy)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <ul className="divide-y divide-gray-200 overflow-hidden rounded-lg border border-gray-200 bg-white lg:hidden">
                {policies.map((policy) => {
                  const vaccines = vaccineLabels(policy.policy_template).join(
                    ", ",
                  );
                  return (
                    <li key={policy.id} className="space-y-2 px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <Link
                          href={`${scope.basePath}/${policy.id}`}
                          basePath="/"
                          className="min-w-0 rounded-sm font-medium text-gray-950 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                        >
                          <span className="flex items-start gap-1">
                            <span className="min-w-0 break-words">
                              {policy.name}
                            </span>
                            <ChevronRight
                              className="mt-0.5 size-4 shrink-0 text-gray-400"
                              aria-hidden="true"
                            />
                          </span>
                        </Link>
                        <div className="shrink-0">{scopeBadge(policy)}</div>
                      </div>
                      {policy.description && (
                        <p className="line-clamp-1 break-words text-xs text-gray-500">
                          {policy.description}
                        </p>
                      )}
                      <div className="space-y-1 text-xs leading-5 text-gray-500">
                        <p
                          className="line-clamp-2 break-words"
                          title={vaccines}
                        >
                          <span className="font-medium text-gray-600">
                            {t("immunization_policy_vaccines")}:{" "}
                          </span>
                          {vaccines || "—"}
                        </p>
                        <p>
                          {t("immunization_policy_recommendation_count", {
                            count: countRecommendations(policy.policy_template),
                          })}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
          {!loading && !isError && <Pagination totalCount={data?.count ?? 0} />}
        </div>
      )}
    </div>
  );
}
