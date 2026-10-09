import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, Plus, Search } from "lucide-react";
import { Link } from "raviger";
import { useId } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import useAuthUser from "@/hooks/useAuthUser";
import useFilters from "@/hooks/useFilters";

import { WorkspaceScope } from "@/types/workspace/workspace";
import workspaceApi from "@/types/workspace/workspaceApi";
import query from "@/Utils/request/query";

interface WorkspaceListProps {
  scope: WorkspaceScope;
}

export function WorkspaceList({ scope }: WorkspaceListProps) {
  const { t } = useTranslation();
  const user = useAuthUser();
  const searchId = useId();
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 15,
    disableCache: true,
  });
  const listDescription = {
    instance: "workspace_instance_description",
    facility: "workspace_facility_description",
  }[scope.authContext];
  const name = qParams.name || "";
  const page = Math.max(1, Number(qParams.page) || 1);
  const listFilters = {
    ...(scope.authContext === "facility"
      ? { facility: scope.facilityId }
      : { auth_context: "instance" }),
    name: name || undefined,
  };
  const {
    data: response,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["workspaces", user.id, { ...listFilters, page, resultsPerPage }],
    queryFn: query.debounced(workspaceApi.list, {
      queryParams: {
        ...listFilters,
        limit: resultsPerPage,
        offset: (page - 1) * resultsPerPage,
      },
    }),
  });
  const workspaces = response?.results ?? [];

  return (
    <div className="container mx-auto space-y-5 px-4 py-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-950">
            {t("workspaces")}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-600">
            {t(listDescription)}
          </p>
        </div>
        <Button asChild className="h-10 shrink-0 sm:h-9">
          <Link href={`${scope.basePath}/create`} basePath="/">
            <Plus className="size-4" aria-hidden="true" />
            {t("create_workspace")}
          </Link>
        </Button>
      </div>

      <div className="w-full space-y-1.5 sm:max-w-md">
        <Label htmlFor={searchId}>{t("search")}</Label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-500"
            aria-hidden="true"
          />
          <Input
            id={searchId}
            className="h-10 pl-9"
            value={name}
            placeholder={t("search_workspaces")}
            onChange={(event) =>
              updateQuery({ name: event.target.value, page: 1 })
            }
          />
        </div>
      </div>

      {isLoading ? (
        <div role="status" aria-label={t("loading")}>
          <TableSkeleton count={5} />
        </div>
      ) : isError ? (
        <div
          role="alert"
          className="rounded-lg border border-gray-200 bg-white p-8 text-center"
        >
          <p className="mb-4 text-sm text-gray-700">
            {t("workspace_list_error")}
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            {t("try_again")}
          </Button>
        </div>
      ) : workspaces.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
          <LayoutDashboard
            className="mx-auto mb-3 size-8 text-gray-400"
            aria-hidden="true"
          />
          <h2 className="text-lg font-semibold text-gray-900">
            {t("no_workspaces_found")}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {t(name ? "workspace_search_empty_hint" : "workspace_empty_hint")}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="px-4">{t("name")}</TableHead>
                <TableHead className="hidden px-4 sm:table-cell">
                  {t("description")}
                </TableHead>
                <TableHead className="px-4 text-right">
                  {t("actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workspaces.map((workspace) => (
                <TableRow key={workspace.id}>
                  <TableCell className="max-w-xs px-4 py-3 whitespace-normal">
                    <Link
                      href={`${scope.basePath}/${workspace.id}/edit`}
                      basePath="/"
                      className="break-words font-medium text-gray-950 underline-offset-4 hover:underline focus-visible:underline"
                    >
                      {workspace.name}
                    </Link>
                    <p className="mt-1 line-clamp-3 text-sm text-gray-600 sm:hidden">
                      {workspace.description || t("no_description")}
                    </p>
                  </TableCell>
                  <TableCell className="hidden max-w-xl px-4 py-3 whitespace-normal sm:table-cell">
                    <p className="line-clamp-3 break-words text-sm text-gray-600">
                      {workspace.description || t("no_description")}
                    </p>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link
                        href={`${scope.basePath}/${workspace.id}/edit`}
                        basePath="/"
                        aria-label={`${t("edit")}: ${workspace.name}`}
                      >
                        {t("edit")}
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {!isLoading && !isError && (
        <Pagination totalCount={response?.count ?? 0} />
      )}
    </div>
  );
}
