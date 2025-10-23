import { useQuery } from "@tanstack/react-query";
import React from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import Page from "@/components/Common/Page";
import {
  CardGridSkeleton,
  TableSkeleton,
} from "@/components/Common/SkeletonLoading";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import RoleForm from "@/pages/Admin/Roles/RoleForm";
import { RoleRead } from "@/types/emr/role/role";
import roleApi from "@/types/emr/role/roleApi";

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
  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 mb-3">
              <h3
                className="font-medium text-gray-900 mb-2 truncate"
                title={role.name}
              >
                {role.name}
              </h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onClone(role)}
                >
                  <CareIcon icon="l-copy" className="size-4" />
                  {t("clone")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(role)}
                >
                  <CareIcon icon="l-edit" className="size-4" />
                  {t("edit")}
                </Button>
              </div>
            </div>
            {role.description && (
              <div className="text-sm text-gray-600 mb-3">
                {role.description}
              </div>
            )}
            <div className="flex flex-wrap gap-1">
              {role.permissions.slice(0, 3).map((permission) => (
                <Badge
                  key={permission.slug}
                  variant="secondary"
                  className="text-xs"
                >
                  {permission.name}
                </Badge>
              ))}
              {role.permissions.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{role.permissions.length - 3} {t("more")}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function RolesIndex() {
  const { t } = useTranslation();
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 15,
    disableCache: true,
  });
  const { open: isSidebarOpen } = useSidebar();

  const [selectedRole, setSelectedRole] = React.useState<RoleRead | null>(null);
  const [mode, setMode] = React.useState<"add" | "edit" | "clone">("add");

  const { data: rolesResponse, isLoading: rolesLoading } = useQuery({
    queryKey: ["roles", qParams],
    queryFn: query.debounced(roleApi.listRoles, {
      queryParams: {
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        name: qParams.search,
      },
    }),
  });

  const roles = rolesResponse?.results || [];

  const handleEdit = (role: RoleRead) => {
    setSelectedRole(role);
    setMode("edit");
  };

  const handleClone = (role: RoleRead) => {
    // Create a new role object without the ID to trigger create mode
    setSelectedRole({
      ...role,
      id: "",
      name: `${role.name} (Copy)`,
    });
    setMode("clone");
  };

  const handleAdd = () => {
    setSelectedRole(null);
    setMode("add");
  };

  const handleSheetClose = () => {
    setSelectedRole(null);
    setMode("add");
  };

  return (
    <Page
      title={t("roles")}
      hideTitleOnPage
      className={cn(
        "w-full overflow-y-auto",
        isSidebarOpen
          ? "md:max-w-[calc(100vw-20rem)]"
          : "md:max-w-[calc(100vw-5rem)]",
      )}
    >
      <div className="container mx-auto">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-700">{t("roles")}</h1>
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-gray-600 text-sm">
                {t("manage_roles_and_permissions")}
              </p>
            </div>
            <Sheet
              open={!!selectedRole}
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
                  });
                }
              }}
            >
              <SheetTrigger asChild>
                <Button onClick={handleAdd} className="w-full md:w-auto">
                  <CareIcon icon="l-plus" />
                  {t("add_role")}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>
                    {mode === "edit"
                      ? t("edit_role")
                      : mode === "clone"
                        ? t("clone_role")
                        : t("add_role")}
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-6 overflow-auto pr-2">
                  <RoleForm role={selectedRole} onSuccess={handleSheetClose} />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
            <div className="w-full md:w-auto">
              <div className="relative w-full md:w-auto">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <CareIcon icon="l-search" className="size-5" />
                </span>
                <Input
                  placeholder={t("search_roles")}
                  value={qParams.search || ""}
                  onChange={(e) =>
                    updateQuery({ search: e.target.value || undefined })
                  }
                  className="w-full md:w-[300px] pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        {rolesLoading ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 md:hidden">
              <CardGridSkeleton count={4} />
            </div>
            <div className="hidden md:block">
              <TableSkeleton count={5} />
            </div>
          </>
        ) : roles.length === 0 ? (
          <EmptyState
            icon={<CareIcon icon="l-user" className="text-primary size-6" />}
            title={t("no_roles_found")}
            description={t("adjust_role_filters")}
          />
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="flex flex-col gap-4 md:hidden">
              {roles.map((role: RoleRead) => (
                <RoleCard
                  key={role.id}
                  role={role}
                  onEdit={handleEdit}
                  onClone={handleClone}
                />
              ))}
            </div>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <div className="rounded-lg border">
                <Table>
                  <TableHeader className="bg-gray-100">
                    <TableRow>
                      <TableHead>{t("name")}</TableHead>
                      <TableHead>{t("description")}</TableHead>
                      <TableHead>{t("permissions")}</TableHead>
                      <TableHead>{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-white">
                    {roles.map((role: RoleRead) => (
                      <TableRow key={role.id} className="divide-x">
                        <TableCell className="font-medium max-w-48">
                          <div className="truncate" title={role.name}>
                            {role.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600 max-w-80 whitespace-normal">
                          {role.description ? role.description : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {role.permissions.slice(0, 3).map((permission) => (
                              <Badge
                                key={permission.slug}
                                variant="secondary"
                                className="text-xs"
                              >
                                {permission.name}
                              </Badge>
                            ))}
                            {role.permissions.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{role.permissions.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleClone(role)}
                            >
                              <CareIcon icon="l-copy" className="size-4" />
                              {t("clone")}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(role)}
                            >
                              <CareIcon icon="l-edit" className="size-4" />
                              {t("edit")}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        )}

        {rolesResponse && rolesResponse.count > resultsPerPage && (
          <div className="mt-4 flex justify-center">
            <Pagination totalCount={rolesResponse.count} />
          </div>
        )}
      </div>
    </Page>
  );
}
