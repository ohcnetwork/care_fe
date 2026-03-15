import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building, FolderOpen, MoreVertical, Trash } from "lucide-react";
import { Link, navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { Organization } from "@/types/organization/organization";
import organizationApi from "@/types/organization/organizationApi";

import FacilityOrganizationFormSheet from "./components/AdminOrganizationFormSheet";

interface Props {
  id?: string;
  organizationType: string;
}

function DeleteOrgDialog({
  org,
  organizationType,
  parentId,
}: {
  org: Organization;
  organizationType: string;
  parentId?: string;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { mutate: deleteOrganization } = useMutation({
    mutationFn: mutate(organizationApi.delete, {
      pathParams: { id: org.id },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["organization", "list", organizationType, parentId],
      });
      toast.success(t("organization_deleted_successfully"));
    },
  });
  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
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
        title={t("delete_organization")}
        description={t("are_you_sure_want_to_delete", { name: org.name })}
        onConfirm={() => deleteOrganization()}
        confirmText={t("delete")}
        variant="destructive"
      />
    </>
  );
}

function OrganizationCard({
  org,
  organizationType,
  parentId,
}: {
  org: Organization;
  organizationType: string;
  parentId?: string;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { mutate: deleteOrganization } = useMutation({
    mutationFn: mutate(organizationApi.delete, {
      pathParams: { id: org.id },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["organization", "list", organizationType, parentId],
      });
      toast.success(t("organization_deleted_successfully"));
    },
  });

  const canDelete = parentId ? true : !org.has_children;

  return (
    <Card key={org.id}>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap">
            <div className="space-y-1 mb-2">
              <h3 className="text-lg font-semibold">{org.name}</h3>
              <div className="flex items-center gap-2 capitalize">
                <Badge
                  variant="indigo"
                  className=" border border-transparent py-1"
                >
                  {org.org_type}
                </Badge>
              </div>
            </div>
            <div className="flex flex-row gap-2">
              <FacilityOrganizationFormSheet
                organizationType={organizationType}
                parentId={parentId}
                org={org}
              />

              <Button
                variant="white"
                size="sm"
                className="font-semibold"
                asChild
              >
                <Link
                  href={`/admin/organizations/${organizationType}/${org.id}`}
                >
                  {t("see_details")}
                </Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <MoreVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onSelect={() => setShowDeleteDialog(true)}
                    className="text-destructive"
                    disabled={!canDelete}
                  >
                    {t("delete")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
      <ConfirmActionDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title={t("delete_organization")}
        description={t("are_you_sure_want_to_delete", { name: org.name })}
        onConfirm={() => deleteOrganization()}
        confirmText={t("delete")}
        variant="destructive"
      />
    </Card>
  );
}

export default function AdminOrganizationView({ id, organizationType }: Props) {
  const { t } = useTranslation();
  const { qParams, Pagination, resultsPerPage, updateQuery } = useFilters({
    limit: 12,
    disableCache: true,
  });

  const { data: children, isLoading } = useQuery({
    queryKey: ["organization", "list", organizationType, id, qParams],
    queryFn: query.debounced(organizationApi.list, {
      pathParams: { id: id },
      queryParams: {
        parent: id || "",
        org_type: organizationType,
        offset: ((qParams.page || 1) - 1) * resultsPerPage,
        limit: resultsPerPage,
        name: qParams.search || undefined,
      },
    }),
  });

  return (
    <div className="space-y-6 mx-auto max-w-4xl md:pt-3">
      <div className="flex flex-col lg:flex-row justify-between item-start lg:items-center  gap-4">
        <div className="flex flex-col items-start md:flex-row sm:items-center gap-4 w-full lg:justify-between">
          <div className="w-full lg:w-1/3 relative">
            <div className="relative">
              <CareIcon
                icon="l-search"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 size-4"
              />
              <Input
                placeholder={t("search_by_department_team_name")}
                value={qParams.search || ""}
                onChange={(e) => {
                  updateQuery({ search: e.target.value || undefined });
                }}
                className="w-full pl-8"
              />
            </div>
          </div>
          <div className="w-full md:w-auto">
            {
              <FacilityOrganizationFormSheet
                organizationType={organizationType}
                parentId={id}
              />
            }
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1  gap-3">
          <CardListSkeleton count={4} />
        </div>
      ) : (
        <div className="space-y-6 md:pb-6">
          <div className="space-y-4">
            {children?.results?.length ? (
              <>
                <div className="hidden sm:block rounded-lg border">
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
                      {children.results.map(
                        (org) => (
                          console.log("org", org),
                          (
                            <TableRow
                              key={org.id}
                              onClick={() =>
                                navigate(
                                  `/admin/organizations/${org.org_type}/${org.id}`,
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
                                  {org.org_type}
                                </Badge>
                              </TableCell>
                              <TableCell
                                className="text-right"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex items-center justify-end gap-1">
                                  <FacilityOrganizationFormSheet
                                    organizationType={organizationType}
                                    parentId={id}
                                    org={org}
                                  />
                                  <DeleteOrgDialog
                                    org={org}
                                    organizationType={org.org_type}
                                  />
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        ),
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="block sm:hidden space-y-4">
                  {children.results.map((org) => (
                    <OrganizationCard
                      key={org.id}
                      org={org}
                      organizationType={organizationType}
                      parentId={id}
                    />
                  ))}
                </div>
              </>
            ) : (
              <Card className="col-span-full">
                <CardContent className="p-6 text-center text-gray-500">
                  {t("no_organizations_found")}
                </CardContent>
              </Card>
            )}
          </div>
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
