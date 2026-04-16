import { useQuery } from "@tanstack/react-query";
import {
  Copy,
  Lock,
  MoreVertical,
  Pencil,
  Search,
  ShieldCheck,
} from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import Page from "@/components/Common/Page";
import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import RoleForm from "@/pages/Admin/Roles/RoleForm";
import {
  DEFAULT_ROLE_CONTEXTS,
  RoleContext,
  RoleRead,
  getRoleContextLabelKey,
} from "@/types/emr/role/role";
import roleApi from "@/types/emr/role/roleApi";

type ContextFilter = "all" | RoleContext;

const CONTEXT_FILTERS: ContextFilter[] = [
  "all",
  RoleContext.FACILITY,
  RoleContext.GOVT_ORG,
  RoleContext.ROLE_ORG,
];

function RoleCard({
  role,
  onEdit,
  onClone,
}: {
  role: RoleRead;
  onEdit: (role: RoleRead) => void;
  onClone: (role: RoleRead) => void;
}) {
  const { t } = useTranslation();
  const isSystem = role.is_system;

  return (
    <div
      className={cn(
        "relative rounded-lg border bg-white p-4 transition-all",
        isSystem
          ? "border-gray-100 bg-gray-50/50"
          : "border-gray-200 hover:border-gray-300 hover:shadow-sm",
      )}
    >
      {/* Header: name + actions */}
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {isSystem && <Lock className="size-3 shrink-0 text-gray-400" />}
            <h3
              className={cn(
                "truncate text-sm font-semibold",
                isSystem ? "text-gray-600" : "text-gray-900",
              )}
              title={role.name}
            >
              {role.name}
            </h3>
          </div>

          {role.description && (
            <p
              className={cn(
                "mt-1 line-clamp-2 text-xs",
                isSystem ? "text-gray-400" : "text-gray-500",
              )}
            >
              {role.description}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {isSystem && (
            <Badge
              variant="outline"
              className="border-gray-200 bg-gray-100 text-[10px] text-gray-500"
            >
              {t("system")}
            </Badge>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-gray-400 hover:text-gray-700"
              >
                <MoreVertical className="size-3.5" />
                <span className="sr-only">{t("actions")}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!isSystem && (
                <DropdownMenuItem onClick={() => onEdit(role)}>
                  <Pencil className="mr-2 size-3.5" />
                  {t("edit")}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onClone(role)}>
                <Copy className="mr-2 size-3.5" />
                {t("clone")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Footer: contexts + permission count */}
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-gray-100 pt-2.5">
        <div className="flex flex-wrap gap-1">
          {role.contexts.map((context) => (
            <Badge
              key={context}
              variant="outline"
              className={cn(
                "border-gray-200 text-[10px] font-normal",
                isSystem ? "bg-gray-50 text-gray-400" : "text-gray-500",
              )}
            >
              {t(getRoleContextLabelKey(context))}
            </Badge>
          ))}
        </div>
        <span
          className={cn(
            "shrink-0 text-[11px] tabular-nums",
            isSystem ? "text-gray-400" : "text-gray-500",
          )}
        >
          {role.permissions.length} {t("permissions").toLowerCase()}
        </span>
      </div>
    </div>
  );
}

export default function RolesIndex() {
  const { t } = useTranslation();
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 15,
    disableCache: true,
  });

  const [selectedRole, setSelectedRole] = React.useState<RoleRead | null>(null);
  const [contextFilter, setContextFilter] =
    React.useState<ContextFilter>("all");

  const { data: rolesResponse, isLoading: rolesLoading } = useQuery({
    queryKey: ["roles", qParams, contextFilter],
    queryFn: query.debounced(roleApi.listRoles, {
      queryParams: {
        limit: resultsPerPage,
        offset: ((qParams.page || 1) - 1) * resultsPerPage,
        name: qParams.search,
        context: contextFilter === "all" ? undefined : contextFilter,
      },
    }),
  });

  const roles = rolesResponse?.results || [];
  const isEditMode = selectedRole !== null && selectedRole.id !== "";

  const handleEdit = (role: RoleRead) => {
    if (role.is_system) return;
    setSelectedRole(role);
  };

  const handleClone = (role: RoleRead) => {
    setSelectedRole({
      ...role,
      id: "",
      name: `${role.name} (Copy)`,
      is_system: false,
    });
  };

  const handleSheetClose = () => {
    setSelectedRole(null);
  };

  const getContextFilterLabel = (filter: ContextFilter) => {
    if (filter === "all") return t("all");
    return t(getRoleContextLabelKey(filter));
  };

  return (
    <Page title={t("roles")} hideTitleOnPage>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t("roles")}</h1>
            <p className="text-sm text-gray-500">
              {t("manage_roles_and_permissions")}
            </p>
          </div>

          <Sheet
            open={selectedRole !== null}
            onOpenChange={(open) => {
              if (!open) {
                setSelectedRole(null);
              } else {
                setSelectedRole({
                  id: "",
                  name: "",
                  description: "",
                  permissions: [],
                  is_system: false,
                  contexts: [...DEFAULT_ROLE_CONTEXTS],
                });
              }
            }}
          >
            <SheetTrigger asChild>
              <Button>
                <CareIcon icon="l-plus" />
                {t("add_role")}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>
                  {isEditMode ? t("edit_role") : t("add_role")}
                </SheetTitle>
                <SheetDescription>
                  {isEditMode
                    ? t("edit_role_description")
                    : t("add_role_description")}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-4 overflow-auto pr-2">
                <RoleForm role={selectedRole} onSuccess={handleSheetClose} />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Search + Context Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder={t("search_roles")}
              value={qParams.search || ""}
              onChange={(e) =>
                updateQuery({
                  search: e.target.value || undefined,
                  page: undefined,
                })
              }
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {CONTEXT_FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => {
                  setContextFilter(filter);
                  updateQuery({ page: undefined });
                }}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  contextFilter === filter
                    ? "border-primary-200 bg-primary-50 text-primary-700"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
                )}
              >
                {getContextFilterLabel(filter)}
              </button>
            ))}
          </div>
        </div>

        {/* Role Grid */}
        {rolesLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <CardGridSkeleton count={6} />
          </div>
        ) : roles.length === 0 ? (
          <EmptyState
            icon={<ShieldCheck className="size-6 text-primary-600" />}
            title={t("no_roles_found")}
            description={t("adjust_role_filters")}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {roles.map((role: RoleRead) => (
              <RoleCard
                key={role.id}
                role={role}
                onEdit={handleEdit}
                onClone={handleClone}
              />
            ))}
          </div>
        )}

        {rolesResponse && rolesResponse.count > resultsPerPage && (
          <div className="flex justify-center">
            <Pagination totalCount={rolesResponse.count} />
          </div>
        )}
      </div>
    </Page>
  );
}
