import { useQueries, useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDashed,
  List,
  Network,
  Pencil,
  Plus,
  Search,
} from "lucide-react";
import { navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import Page from "@/components/Common/Page";

import useBreakpoints from "@/hooks/useBreakpoints";

import query from "@/Utils/request/query";
import ResponsibilityFormDialog from "@/pages/Admin/organizations/components/ResponsibilityFormDialog";
import RoleOrganizationConnections from "@/pages/Organization/components/RoleOrganizationConnections";
import { Organization, OrgType } from "@/types/organization/organization";
import organizationApi from "@/types/organization/organizationApi";

interface Props {
  organizationId?: string;
}

const PAGE_LIMIT = 100;

export default function ResponsibilitiesIndex({ organizationId }: Props) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"list" | "hierarchy">("list");
  const isMobile = useBreakpoints({ default: true, xl: false });

  const handleSelect = (id?: string) => {
    navigate(
      id ? `/admin/organizations/role/${id}` : `/admin/organizations/role`,
    );
  };

  // On mobile, a selected responsibility takes over the screen (master-detail).
  if (isMobile && organizationId) {
    return (
      <Page title={t("responsibilities")} hideTitleOnPage className="p-0">
        <div className="container mx-auto pb-6">
          <DetailPanel
            organizationId={organizationId}
            mobile
            onBack={() => handleSelect(undefined)}
          />
        </div>
      </Page>
    );
  }

  return (
    <Page title={t("responsibilities")} hideTitleOnPage className="p-0">
      <div className="container mx-auto space-y-4 pb-24 md:pb-0">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {t("responsibilities")}
            </h1>
            <p className="max-w-2xl text-sm text-gray-500 xl:hidden">
              {t("responsibilities_description_short")}
            </p>
            <p className="hidden max-w-2xl text-sm text-gray-500 xl:block">
              {t("responsibilities_description")}
            </p>
          </div>
          <ResponsibilityFormDialog
            trigger={
              <Button className="hidden md:inline-flex">
                <Plus className="mr-2 size-4" />
                {t("responsibility_new")}
              </Button>
            }
          />
        </div>

        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value as "list" | "hierarchy")}
        >
          <TabsList className="w-full xl:w-fit">
            <TabsTrigger value="list" className="flex-1 xl:flex-initial">
              <List className="size-4" />
              {t("list")}
            </TabsTrigger>
            <TabsTrigger value="hierarchy" className="flex-1 xl:flex-initial">
              <Network className="size-4" />
              {t("responsibility_hierarchy")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            {isMobile ? (
              <ResponsibilityList
                selectedId={organizationId ?? null}
                onSelect={handleSelect}
                mobile
              />
            ) : (
              <div className="flex items-start gap-4">
                <div className="w-72 shrink-0 xl:w-80">
                  <ResponsibilityList
                    selectedId={organizationId ?? null}
                    onSelect={handleSelect}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <DetailPanel organizationId={organizationId} />
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="hierarchy">
            {isMobile ? (
              <ResponsibilityHierarchy
                selectedId={organizationId ?? null}
                onSelect={handleSelect}
                mobile
              />
            ) : (
              <div className="flex items-start gap-4">
                <div className="w-96 shrink-0 xl:w-112">
                  <ResponsibilityHierarchy
                    selectedId={organizationId ?? null}
                    onSelect={handleSelect}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <DetailPanel organizationId={organizationId} />
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Mobile sticky create button */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-white p-3 md:hidden">
        <ResponsibilityFormDialog
          trigger={
            <Button className="w-full">
              <Plus className="mr-2 size-4" />
              {t("responsibility_new")}
            </Button>
          }
        />
      </div>
    </Page>
  );
}

/** Right-hand detail panel shared by the list and hierarchy tabs. */
function DetailPanel({
  organizationId,
  mobile,
  onBack,
}: {
  organizationId?: string;
  mobile?: boolean;
  onBack?: () => void;
}) {
  const { t } = useTranslation();

  const { data: org } = useQuery({
    queryKey: ["organization", OrgType.ROLE, organizationId],
    queryFn: query(organizationApi.get, {
      pathParams: { id: organizationId! },
      queryParams: { org_type: OrgType.ROLE },
    }),
    enabled: !!organizationId,
  });

  const detail = org && (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h2 className="text-xl font-bold text-gray-900">{org.name}</h2>
          {org.description && (
            <p className="max-w-2xl text-sm text-gray-500">{org.description}</p>
          )}
        </div>
        <ResponsibilityFormDialog
          org={org}
          trigger={
            <Button
              variant="white"
              size="sm"
              className="shrink-0 font-semibold"
            >
              <Pencil className="mr-1.5 size-3.5" />
              {t("edit")}
            </Button>
          }
        />
      </div>
      <RoleOrganizationConnections organization={org} />
    </div>
  );

  if (mobile) {
    return (
      <div className="space-y-6">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-900 hover:text-primary-700"
          >
            <ChevronLeft className="size-4" />
            {t("all_role_organizations")}
          </button>
        )}
        {detail}
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white md:border md:border-gray-200 md:shadow-sm">
      {organizationId && org ? (
        <div className="p-5">{detail}</div>
      ) : (
        <div className="flex min-h-[calc(100vh-14rem)] flex-col items-center justify-center gap-2 p-8 text-center">
          <h3 className="text-base font-semibold text-gray-700">
            {t("role_organizations_admin_empty_title")}
          </h3>
          <p className="max-w-sm text-sm text-gray-400">
            {t("role_organizations_admin_empty_description")}
          </p>
        </div>
      )}
    </div>
  );
}

/** Searchable directory of responsibilities shown beside the detail panel. */
function ResponsibilityList({
  selectedId,
  onSelect,
  mobile,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
  mobile?: boolean;
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["organization", "list", OrgType.ROLE, search],
    queryFn: query.debounced(organizationApi.list, {
      queryParams: {
        parent: "",
        org_type: OrgType.ROLE,
        name: search || undefined,
        limit: PAGE_LIMIT,
      },
    }),
    refetchOnWindowFocus: false,
  });

  const items = (data?.results || [])
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));

  const listBody =
    isLoading || (isFetching && items.length === 0) ? (
      <div className="space-y-1 p-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full rounded-md" />
        ))}
      </div>
    ) : items.length > 0 ? (
      <div className={cn(mobile ? "" : "space-y-1 p-2")}>
        {items.map((item) => {
          const isSelected = !mobile && item.id === selectedId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={cn(
                "group flex w-full items-center justify-between gap-3 text-left transition-colors",
                mobile
                  ? "border-b border-gray-100 px-4 py-3.5 last:border-0 hover:bg-gray-50"
                  : cn(
                      "rounded-md border px-3 py-2",
                      isSelected
                        ? "border-primary-500 bg-primary-100"
                        : "border-transparent hover:bg-gray-50",
                    ),
              )}
            >
              <div className="min-w-0">
                <div
                  className={cn(
                    "truncate text-sm font-medium",
                    isSelected ? "text-primary-900" : "text-gray-900",
                  )}
                >
                  {item.name}
                </div>
                <div className="truncate text-xs text-gray-500">
                  {item.description || "--"}
                </div>
              </div>
              <ChevronRight
                className={cn(
                  "size-4 shrink-0",
                  isSelected ? "text-primary-500" : "text-gray-400",
                )}
              />
            </button>
          );
        })}
      </div>
    ) : (
      <p className="px-3 py-6 text-center text-sm text-gray-400">
        {t("no_organizations_found")}
      </p>
    );

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white",
        mobile ? "" : "shadow-sm",
      )}
    >
      <div className="border-b border-gray-100 p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("responsibility_search")}
            className="h-9 pl-8 text-sm"
          />
        </div>
      </div>

      {listBody}
    </div>
  );
}

/** Governance map: responsibilities nested by their management links. */
function ResponsibilityHierarchy({
  selectedId,
  onSelect,
  mobile,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
  mobile?: boolean;
}) {
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ["organization", "list", OrgType.ROLE, "hierarchy"],
    queryFn: query(organizationApi.list, {
      queryParams: {
        parent: "",
        org_type: OrgType.ROLE,
        limit: PAGE_LIMIT,
      },
    }),
    refetchOnWindowFocus: false,
  });

  const orgs = data?.results || [];
  const byId = new Map(orgs.map((item) => [item.id, item]));

  // The list endpoint does not include management links, so fetch the
  // responsibilities each one manages to assemble the governance tree.
  const managedQueries = useQueries({
    queries: orgs.map((item) => ({
      queryKey: ["organization", item.id, "managed-role-organizations"],
      queryFn: query(organizationApi.list, {
        queryParams: {
          org_type: OrgType.ROLE,
          get_managed_organizations: item.id,
          limit: PAGE_LIMIT,
        },
      }),
      staleTime: 60000,
    })),
  });

  const relationsLoading = managedQueries.some((result) => result.isLoading);

  const childrenByParent = new Map<string, Organization[]>();
  const childIds = new Set<string>();
  const managesOthers = new Set<string>();
  orgs.forEach((item, index) => {
    const managed = (managedQueries[index]?.data?.results || [])
      .filter((child) => byId.has(child.id))
      .map((child) => byId.get(child.id)!);
    if (managed.length > 0) {
      managesOthers.add(item.id);
      childrenByParent.set(item.id, managed);
      managed.forEach((child) => childIds.add(child.id));
    }
  });

  const isLinked = (item: Organization) =>
    managesOthers.has(item.id) || childIds.has(item.id);

  const roots = orgs
    .filter((item) => isLinked(item) && !childIds.has(item.id))
    .sort((a, b) => a.name.localeCompare(b.name));
  const notLinked = orgs
    .filter((item) => !isLinked(item))
    .sort((a, b) => a.name.localeCompare(b.name));
  const mappedCount = orgs.length - notLinked.length;

  if (isLoading || (orgs.length > 0 && relationsLoading)) {
    return (
      <div
        className={cn(
          "flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-4",
          mobile ? "" : "shadow-sm",
        )}
      >
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (orgs.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-400",
          mobile ? "" : "min-h-[calc(100vh-14rem)] shadow-sm",
        )}
      >
        {t("responsibility_hierarchy_empty")}
      </div>
    );
  }

  const treeBody = (
    <div className="min-h-full space-y-1.5 bg-[radial-gradient(#d1d5db_1px,transparent_1px)] bg-size-[16px_16px] p-3">
      {roots.map((root) => (
        <HierarchyNode
          key={root.id}
          org={root}
          childrenByParent={childrenByParent}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}

      {notLinked.length > 0 && (
        <div className="mt-4 border-t border-dashed border-gray-200 pt-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
            {t("responsibility_hierarchy_not_linked")}
          </p>
          <div className="flex flex-wrap gap-2">
            {notLinked.map((item) => {
              const isSelected = item.id === selectedId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect(item.id)}
                  className={cn(
                    "max-w-55 rounded-lg border px-3 py-2 text-left transition-colors",
                    isSelected
                      ? "border-primary-500 bg-primary-100"
                      : "border-gray-200 bg-white hover:bg-gray-50",
                  )}
                >
                  <div
                    className={cn(
                      "truncate text-sm font-medium",
                      isSelected ? "text-primary-900" : "text-gray-900",
                    )}
                  >
                    {item.name}
                  </div>
                  {item.description && (
                    <div className="truncate text-xs text-gray-500">
                      {item.description}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white",
        mobile ? "" : "shadow-sm",
      )}
    >
      <div className="space-y-2 border-b border-gray-100 p-4">
        <p className="text-sm text-gray-600">
          {t("responsibility_hierarchy_intro")}
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span className="inline-flex items-center gap-1.5 text-gray-600">
            <CheckCircle2 className="size-3.5 text-primary-600" />
            {t("responsibility_hierarchy_mapped", { count: mappedCount })}
          </span>
          <span className="inline-flex items-center gap-1.5 text-gray-500">
            <CircleDashed className="size-3.5 text-gray-400" />
            {t("responsibility_hierarchy_unlinked", {
              count: notLinked.length,
            })}
          </span>
        </div>
      </div>

      {treeBody}
    </div>
  );
}

/** A single card node in the governance map, with expandable children. */
function HierarchyNode({
  org,
  childrenByParent,
  selectedId,
  onSelect,
  ancestors,
}: {
  org: Organization;
  childrenByParent: Map<string, Organization[]>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  ancestors?: Set<string>;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);

  const seen = ancestors ?? new Set<string>();
  const children = (childrenByParent.get(org.id) || [])
    .filter((child) => !seen.has(child.id))
    .sort((a, b) => a.name.localeCompare(b.name));
  const hasChildren = children.length > 0;
  const isSelected = org.id === selectedId;

  const nextAncestors = new Set(seen);
  nextAncestors.add(org.id);

  return (
    <div>
      <div
        className={cn(
          "flex items-start gap-2 rounded-lg border px-3 py-2 transition-colors",
          isSelected
            ? "border-primary-500 bg-primary-100"
            : "border-gray-200 bg-white hover:bg-gray-50",
        )}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="mt-0.5 flex size-4 shrink-0 items-center justify-center text-gray-400 hover:text-gray-600"
            aria-label={org.name}
          >
            <ChevronDown
              className={cn(
                "size-3.5 transition-transform",
                !expanded && "-rotate-90",
              )}
            />
          </button>
        ) : (
          <span className="mt-0.5 inline-block size-4 shrink-0" />
        )}
        <button
          type="button"
          onClick={() => onSelect(org.id)}
          className="min-w-0 flex-1 text-left"
        >
          <div
            className={cn(
              "truncate text-sm font-medium",
              isSelected ? "text-primary-900" : "text-gray-900",
            )}
          >
            {org.name}
          </div>
          <div className="truncate text-xs text-gray-500">
            {org.description || t("no_description")}
          </div>
        </button>
      </div>
      {hasChildren && expanded && (
        <div className="relative mt-1.5 space-y-1.5 pl-6">
          {children.map((child, index) => {
            const isLast = index === children.length - 1;
            return (
              <div key={child.id} className="relative">
                <span
                  className={cn(
                    "absolute -left-3 -top-1.5 w-px bg-gray-300",
                    isLast ? "h-8" : "-bottom-1.5",
                  )}
                />
                <span className="absolute -left-3 top-6.5 h-px w-3 bg-gray-300" />
                <HierarchyNode
                  org={child}
                  childrenByParent={childrenByParent}
                  selectedId={selectedId}
                  onSelect={onSelect}
                  ancestors={nextAncestors}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
