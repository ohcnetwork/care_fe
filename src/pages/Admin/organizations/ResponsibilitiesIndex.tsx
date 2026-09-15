import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  SquarePen,
} from "lucide-react";
import { navigate } from "raviger";
import { Fragment, useEffect, useId, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

import Page from "@/components/Common/Page";

import {
  getPermissions,
  PERMISSION_CREATE_ORGANIZATION,
} from "@/common/Permissions";

import useBreakpoints from "@/hooks/useBreakpoints";

import query from "@/Utils/request/query";
import { usePermissions } from "@/context/PermissionContext";
import ResponsibilityFormDialog from "@/pages/Admin/organizations/components/ResponsibilityFormDialog";
import RoleOrganizationConnections from "@/pages/Organization/components/RoleOrganizationConnections";
import { OrgType } from "@/types/organization/organization";
import organizationApi from "@/types/organization/organizationApi";

interface Props {
  organizationId?: string;
}

const PAGE_LIMIT = 100;

export default function ResponsibilitiesIndex({ organizationId }: Props) {
  const { t } = useTranslation();
  const isMobile = useBreakpoints({ default: true, xl: false });
  const { hasPermission } = usePermissions();
  const canCreateResponsibility = hasPermission(PERMISSION_CREATE_ORGANIZATION);

  const { data: listData } = useQuery({
    queryKey: ["organization", "list", OrgType.ROLE, ""],
    queryFn: query(organizationApi.list, {
      queryParams: {
        parent: "",
        org_type: OrgType.ROLE,
        limit: PAGE_LIMIT,
      },
    }),
    refetchOnWindowFocus: false,
  });

  const responsibilities = (listData?.results || [])
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));
  const firstResponsibilityId = responsibilities[0]?.id;
  const hasNoResponsibilities = !!listData && responsibilities.length === 0;

  const handleSelect = (id?: string) => {
    navigate(
      id ? `/admin/organizations/role/${id}` : `/admin/organizations/role`,
    );
  };

  // On wide screens the detail panel is always visible, so default to the
  // first responsibility instead of leaving it empty.
  useEffect(() => {
    if (!isMobile && !organizationId && firstResponsibilityId) {
      navigate(`/admin/organizations/role/${firstResponsibilityId}`, {
        replace: true,
      });
    }
  }, [isMobile, organizationId, firstResponsibilityId]);

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
      <div
        className={cn(
          "container mx-auto pb-24 md:pb-0",
          isMobile
            ? "space-y-4"
            : "flex h-[calc(100dvh-4rem)] flex-col gap-4 overflow-hidden",
        )}
      >
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
          {canCreateResponsibility && (
            <ResponsibilityFormDialog
              trigger={
                <Button className="hidden md:inline-flex">
                  <Plus className="mr-2 size-4" />
                  {t("responsibility_new")}
                </Button>
              }
            />
          )}
        </div>

        {isMobile ? (
          <ResponsibilityList
            selectedId={organizationId ?? null}
            onSelect={handleSelect}
            mobile
          />
        ) : (
          <div className="flex min-h-0 flex-1 gap-4">
            <div className="w-72 shrink-0 xl:w-80">
              <ResponsibilityList
                selectedId={organizationId ?? null}
                onSelect={handleSelect}
              />
            </div>
            <div className="min-w-0 flex-1">
              <DetailPanel
                organizationId={organizationId}
                isEmpty={hasNoResponsibilities}
              />
            </div>
          </div>
        )}
      </div>

      {/* Mobile sticky create button */}
      {canCreateResponsibility && (
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
      )}
    </Page>
  );
}

/** Right-hand detail panel shown beside the list on wide screens. */
function DetailPanel({
  organizationId,
  mobile,
  onBack,
  isEmpty,
}: {
  organizationId?: string;
  mobile?: boolean;
  onBack?: () => void;
  isEmpty?: boolean;
}) {
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();

  const { data: org } = useQuery({
    queryKey: ["organization", OrgType.ROLE, organizationId],
    queryFn: query(organizationApi.get, {
      pathParams: { id: organizationId! },
      queryParams: { org_type: OrgType.ROLE },
    }),
    enabled: !!organizationId,
  });

  const canManageOrganization =
    !!org &&
    getPermissions(hasPermission, org.permissions).canManageOrganization;

  const detail = org && (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-gray-900">{org.name}</h2>
          {org.description && (
            <p className="max-w-2xl text-sm text-gray-500">{org.description}</p>
          )}
        </div>
        {canManageOrganization && (
          <ResponsibilityFormDialog
            org={org}
            trigger={
              <Button
                variant="white"
                size="sm"
                className="shrink-0 font-semibold"
              >
                <SquarePen className="size-3.5" />
                {t("edit")}
              </Button>
            }
          />
        )}
      </div>
      <RoleOrganizationConnections organization={org} />
    </div>
  );

  if (mobile) {
    return (
      <div className="space-y-4">
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
        {detail && (
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            {detail}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto rounded-lg bg-white md:border md:border-gray-200 md:shadow-sm">
      {organizationId && org ? (
        <div className="p-5">{detail}</div>
      ) : isEmpty ? (
        <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
          <h3 className="text-base font-semibold text-gray-700">
            {t("role_organizations_admin_empty_title")}
          </h3>
          <p className="max-w-sm text-sm text-gray-400">
            {t("role_organizations_admin_empty_description")}
          </p>
        </div>
      ) : (
        <div className="space-y-6 p-5">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
          <div className="space-y-3 pt-4">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
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
  const searchInputId = useId();

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
      <div
        data-slot="responsibility-list"
        className={cn(mobile ? "" : "space-y-1 p-2")}
      >
        {items.map((item, index) => {
          const isSelected = !mobile && item.id === selectedId;
          const isNextSelected = !mobile && items[index + 1]?.id === selectedId;
          const showDivider = !mobile && index < items.length - 1;
          return (
            <Fragment key={item.id}>
              <button
                type="button"
                data-slot="responsibility-row"
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
              {showDivider && (
                <div
                  className={cn(
                    "mx-1 border-t",
                    isSelected || isNextSelected
                      ? "border-transparent"
                      : "border-gray-200",
                  )}
                  aria-hidden="true"
                />
              )}
            </Fragment>
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
        mobile ? "" : "h-full shadow-sm",
      )}
    >
      <div className="border-b border-gray-200 p-3">
        <div className="relative">
          <Label htmlFor={searchInputId} className="sr-only">
            {t("responsibility_search")}
          </Label>
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <Input
            id={searchInputId}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("responsibility_search")}
            className="h-9 pl-8 text-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">{listBody}</div>
    </div>
  );
}
