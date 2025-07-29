import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building, FolderOpen, PenLine, Trash } from "lucide-react";
import { Link, navigate } from "raviger";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

import { CardListSkeleton } from "@/components/Common/SkeletonLoading";

import useFilters from "@/hooks/useFilters";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { Organization } from "@/types/organization/organization";
import organizationApi from "@/types/organization/organizationApi";

import AdminOrganizationFormSheet from "./components/AdminOrganizationFormSheet";

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
    onError: () => {
      toast.error(t("something_went_wrong"));
    },
  });

  const canDelete = parentId ? true : !org.has_children;

  return (
    <AlertDialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" disabled={!canDelete}>
              <Trash className="size-4" />
            </Button>
          </AlertDialogTrigger>
        </TooltipTrigger>
        <TooltipContent>{t("delete")}</TooltipContent>
      </Tooltip>
      <AlertDialogContent onCloseAutoFocus={(e) => e.preventDefault()}>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("remove_name", { name: org.name })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {canDelete
              ? t("are_you_sure_want_to_delete", {
                  name: org.name,
                })
              : t("cannot_delete_organization_with_children")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteOrganization({})}
            disabled={!canDelete}
            className={buttonVariants({
              variant: "destructive",
            })}
          >
            {t("remove")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
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

  return (
    <Card key={org.id}>
      <CardContent className="p-4 space-y-4">
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
        </div>

        <Badge variant="indigo" className="w-fit">
          {org.org_type}
        </Badge>

        <div className="flex gap-2 flex-wrap justify-end">
          <AdminOrganizationFormSheet
            organizationType={organizationType}
            parentId={parentId}
            org={org}
            trigger={
              <Button
                data-cy="edit-organization"
                variant="white"
                size="sm"
                className="font-semibold"
              >
                {t("edit")}
              </Button>
            }
          />

          <Button variant="white" size="sm" className="font-semibold" asChild>
            <Link
              href={`/admin/organizations/${organizationType}/${org.id}`}
              data-cy="view-organization"
            >
              {t("see_details")}
            </Link>
          </Button>
        </div>
      </CardContent>
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
    queryKey: [
      "organization",
      "list",
      organizationType,
      id,
      qParams.page,
      resultsPerPage,
      qParams.search,
    ],
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
      <div className="flex flex-col flex-wrap sm:flex-row sm:items-center sm:justify-between w-full gap-4">
        <div className="relative w-full sm:w-[18rem] max-w-full">
          <CareIcon
            icon="l-search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 size-4"
          />
          <Input
            placeholder={t("search_by_organization_name")}
            value={qParams.search || ""}
            data-cy="search-organization"
            onChange={(e) => {
              updateQuery({ search: e.target.value || undefined });
            }}
            className="w-full pl-8"
          />
        </div>

        <div className="w-full sm:w-auto flex justify-center sm:justify-start">
          <AdminOrganizationFormSheet
            organizationType={organizationType}
            parentId={id}
            trigger={
              <Button className="w-full" data-cy="add-organization-button">
                <CareIcon icon="l-plus" className="mr-2 size-4" />
                {t("add_organization")}
              </Button>
            }
          />
        </div>
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
                data-cy="organization-list"
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
                            `/admin/organizations/${organizationType}/${org.id}`,
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
                          <Badge variant="indigo" className="w-fit">
                            {t(org.org_type)}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className="text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AdminOrganizationFormSheet
                                  organizationType={organizationType}
                                  parentId={id}
                                  org={org}
                                  trigger={
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      data-cy="edit-organization-button"
                                    >
                                      <PenLine className="size-4" />
                                    </Button>
                                  }
                                />
                              </TooltipTrigger>
                              <TooltipContent>{t("edit")}</TooltipContent>
                            </Tooltip>

                            <DeleteOrgDialog
                              org={org}
                              organizationType={organizationType}
                              parentId={id}
                            />
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
