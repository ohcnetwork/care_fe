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
import { TableSkeleton } from "@/components/Common/SkeletonLoading";
import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import RoleForm from "@/pages/Admin/Roles/RoleForm";
import permissionApi from "@/types/emr/permission/permissionApi";
import { Role } from "@/types/emr/role/role";
import roleApi from "@/types/emr/role/roleApi";

function RoleCard({
  role,
  onEdit,
}: {
  role: Role;
  onEdit: (role: Role) => void;
}) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 mb-2">{role.name}</h3>
            {role.description && (
              <p className="text-sm text-gray-600 mb-3">{role.description}</p>
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
                  +{role.permissions.length - 3} more
                </Badge>
              )}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => onEdit(role)}>
            <CareIcon icon="l-edit" className="size-4" />
            {t("edit")}
          </Button>
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

  const [selectedRole, setSelectedRole] = React.useState<Role | null>(null);

  const { data: rolesResponse, isLoading: rolesLoading } = useQuery({
    queryKey: ["roles", qParams],
    queryFn: query.debounced(roleApi.listRoles, {
      queryParams: {
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        search: qParams.search,
        ordering: "name",
      },
    }),
  });

  const { data: permissionsResponse, isLoading: _permissionsLoading } =
    useQuery({
      queryKey: ["permissions"],
      queryFn: query(permissionApi.listPermissions, {
        queryParams: {
          limit: 1000, // Get all permissions for the form
        },
      }),
    });

  const roles = rolesResponse?.results || [];
  const permissions = permissionsResponse?.results || [];

  const handleEdit = (role: Role) => {
    setSelectedRole(role);
  };

  const handleAdd = () => {
    setSelectedRole(null);
  };

  const handleSheetClose = () => {
    setSelectedRole(null);
  };

  return (
    <Page title={t("roles")} hideTitleOnPage>
      <div className="container mx-auto">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-700">{t("roles")}</h1>
          <div className="mb-6 flex items-center justify-between">
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
                  });
                }
              }}
            >
              <SheetTrigger asChild>
                <Button onClick={handleAdd}>
                  <CareIcon icon="l-plus" />
                  {t("add_role")}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>
                    {selectedRole && selectedRole.id
                      ? t("edit_role")
                      : t("add_role")}
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-6 pb-6">
                  <RoleForm
                    role={selectedRole}
                    permissions={permissions}
                    onSuccess={handleSheetClose}
                  />
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
            icon="l-user"
            title={t("no_roles_found")}
            description={t("adjust_role_filters")}
          />
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="grid gap-4 md:hidden">
              {roles.map((role: Role) => (
                <RoleCard key={role.id} role={role} onEdit={handleEdit} />
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
                    {roles.map((role: Role) => (
                      <TableRow key={role.id} className="divide-x">
                        <TableCell className="font-medium">
                          {role.name}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {role.description || "-"}
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(role)}
                          >
                            <CareIcon icon="l-edit" className="size-4" />
                            {t("edit")}
                          </Button>
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
