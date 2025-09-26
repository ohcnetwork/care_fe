import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building, FolderOpen, PenLine, Trash } from "lucide-react";
import { Link, navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";
import { CardListSkeleton } from "@/components/Common/SkeletonLoading";

import useFilters from "@/hooks/useFilters";

import { getPermissions } from "@/common/Permissions";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { usePermissions } from "@/context/PermissionContext";
import { FacilityOrganizationRead } from "@/types/facilityOrganization/facilityOrganization";
import facilityOrganizationApi from "@/types/facilityOrganization/facilityOrganizationApi";

import FacilityOrganizationFormSheet from "./components/FacilityOrganizationFormSheet";

interface Props {
  id?: string;
  facilityId: string;
  permissions: string[];
}

function DeleteOrgDialog({
  org,
  facilityId,
}: {
  org: FacilityOrganizationRead;
  facilityId: string;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { mutate: deleteOrganization } = useMutation({
    mutationFn: mutate(facilityOrganizationApi.delete, {
      pathParams: { facilityId, organizationId: org.id },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["facilityOrganization"],
      });
      toast.success(t("organization_deleted_successfully"));
    },
  });
  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            data-cy="delete-organization-button"
            variant="ghost"
            size="icon"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t("delete")}</TooltipContent>
      </Tooltip>
      <ConfirmActionDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title={t("remove_name", { name: org.name })}
        description={t("are_you_sure_want_to_delete", {
          name: org.name,
        })}
        variant="destructive"
        confirmText={t("remove")}
        onConfirm={() => deleteOrganization()}
      />
    </>
  );
}

function OrganizationCard({
  org,
  facilityId,
  parentId,
  canWrite,
}: {
  org: FacilityOrganizationRead;
  facilityId: string;
  parentId?: string;
  canWrite: boolean;
}) {
  const { t } = useTranslation();

  return (
    <Card key={org.id}>
      <CardContent className="p-4 space-y-4">
        <CardHeader className="p-0">
          <div className="flex justify-between">
            <div className="flex items-center gap-2">
              <Building className="size-4" />
              <span className="text-lg font-semibold hover:underline hover:decoration-green-600 hover:text-green-600">
                {org.name}
              </span>
              {org.has_children && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">
                        <FolderOpen className="size-3 text-gray-400" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      {t("has_child_organizations")}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            {!org.has_children && org.org_type !== "root" && (
              <DeleteOrgDialog org={org} facilityId={facilityId} />
            )}
          </div>
        </CardHeader>

        <Badge variant="indigo" className="w-fit">
          {t(`facility_organization_type__${org.org_type}`)}
        </Badge>

        <div className="flex gap-2 flex-wrap justify-end">
          {canWrite && org.org_type !== "root" && (
            <FacilityOrganizationFormSheet
              facilityId={facilityId}
              parentId={parentId}
              org={org}
              trigger={
                <Button
                  data-cy="edit-department-team"
                  variant="white"
                  size="sm"
                  className="font-semibold"
                >
                  {t("edit")}
                </Button>
              }
            />
          )}

          <Button variant="white" size="sm" className="font-semibold" asChild>
            <Link
              href={`/departments/${org.id}/departments`}
              data-cy="view-department-team"
            >
              {t("see_details")}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function FacilityOrganizationView({
  id,
  facilityId,
  permissions,
}: Props) {
  const { t } = useTranslation();
  const { qParams, Pagination, resultsPerPage, updateQuery } = useFilters({
    limit: 12,
    disableCache: true,
  });

  const { hasPermission } = usePermissions();

  const { data: children, isLoading } = useQuery({
    queryKey: [
      "facilityOrganization",
      "list",
      facilityId,
      id,
      qParams.page,
      resultsPerPage,
      qParams.search,
    ],
    queryFn: query.debounced(facilityOrganizationApi.list, {
      pathParams: { facilityId },
      queryParams: {
        parent: id || "",
        offset: ((qParams.page || 1) - 1) * resultsPerPage,
        limit: resultsPerPage,
        name: qParams.search || undefined,
      },
    }),
  });

  const { canCreateFacilityOrganization, canManageFacilityOrganization } =
    getPermissions(hasPermission, permissions);

  return (
    <div className="space-y-6 mx-auto max-w-4xl md:pt-3">
      <div className="flex flex-col flex-wrap sm:flex-row sm:items-center sm:justify-between w-full gap-4">
        <div className="relative w-full sm:w-[18rem] max-w-full">
          <CareIcon
            icon="l-search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 size-4"
          />
          <Input
            placeholder={t("search_by_department_team_name")}
            value={qParams.search || ""}
            data-cy="search-department-team"
            onChange={(e) => {
              updateQuery({ search: e.target.value || undefined });
            }}
            className="w-full pl-8"
          />
        </div>

        {canCreateFacilityOrganization && (
          <div className="w-full sm:w-auto flex justify-center sm:justify-start">
            <FacilityOrganizationFormSheet
              facilityId={facilityId}
              parentId={id}
              trigger={
                <Button className="w-full" data-cy="add-department/team-button">
                  <CareIcon icon="l-plus" className="mr-2 size-4" />
                  {t("add_department_team")}
                </Button>
              }
            />
          </div>
        )}
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1  gap-3">
          <CardListSkeleton count={4} />
        </div>
      ) : (
        <div className="space-y-6 md:pb-6">
          {children?.results?.length ? (
            <>
              <div
                className="hidden sm:block rounded-lg border"
                data-cy="department-team-list"
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("name")}</TableHead>
                      <TableHead>{t("type")}</TableHead>
                      <TableHead className="text-right">
                        {t("actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {children.results.map((org) => (
                      <TableRow
                        key={org.id}
                        onClick={() =>
                          navigate(
                            `/facility/${facilityId}/settings/departments/${org.id}/departments`,
                          )
                        }
                        className="hover:cursor-pointer group"
                      >
                        <TableCell>
                          <div className="font-medium flex items-center gap-2 py-2">
                            <Building className="size-4" />
                            <span className="group-hover:underline group-hover:text-primary">
                              {org.name}
                            </span>
                            {org.has_children && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="cursor-help">
                                      <FolderOpen className="size-3 text-gray-400" />
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {t("has_child_organizations")}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {" "}
                          <Badge variant="indigo" className="w-fit">
                            {t(`facility_organization_type__${org.org_type}`)}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className="text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1">
                            {canManageFacilityOrganization &&
                            org.org_type !== "root" ? (
                              <FacilityOrganizationFormSheet
                                facilityId={facilityId}
                                parentId={id}
                                org={org}
                                tooltip={t("edit")}
                                trigger={
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    data-cy="edit-department-button"
                                  >
                                    <PenLine className="size-4" />
                                  </Button>
                                }
                              />
                            ) : (
                              <div className="size-10" />
                            )}

                            {!org.has_children && org.org_type !== "root" ? (
                              <DeleteOrgDialog
                                org={org}
                                facilityId={facilityId}
                              />
                            ) : (
                              <div className="size-10" />
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="block sm:hidden space-y-4">
                {children.results.map((org) => (
                  <OrganizationCard
                    key={org.id}
                    org={org}
                    facilityId={facilityId}
                    canWrite={canManageFacilityOrganization}
                    parentId={id}
                  />
                ))}
              </div>
            </>
          ) : (
            <Card className="col-span-full">
              <CardContent className="p-6 text-center text-gray-500">
                {t("no_departments_teams_found")}
              </CardContent>
            </Card>
          )}
          {children && children.count > resultsPerPage && (
            <div className="flex justify-center">
              <Pagination totalCount={children.count} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
