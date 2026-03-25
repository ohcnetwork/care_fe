import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreVertical } from "lucide-react";
import { Link } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";
import { CardListSkeleton } from "@/components/Common/SkeletonLoading";

import useFilters from "@/hooks/useFilters";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { Organization, OrgType } from "@/types/organization/organization";
import organizationApi from "@/types/organization/organizationApi";

import FacilityOrganizationFormSheet from "./components/AdminOrganizationFormSheet";

interface Props {
  id?: string;
  organizationType: string;
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
          <div className="flex flex-wrap items-center justify-between">
            <div className="mb-2">
              <h3 className="text-lg font-semibold">{org.name}</h3>
              {org.description && (
                <p className="mt-0.5 text-sm text-gray-500">
                  {org.description}
                </p>
              )}
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
  const isFlatOrgType =
    organizationType === OrgType.ROLE ||
    organizationType === OrgType.PRODUCT_SUPPLIER;

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
    enabled: !isFlatOrgType,
  });

  // Flat org types are handled by the sidebar layout in AdminOrganizationList
  if (isFlatOrgType) {
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 md:pt-3">
      <div className="flex flex-col gap-4 lg:flex-row item-start lg:items-center lg:justify-between">
        <div className="flex w-full flex-col items-start gap-4 md:flex-row sm:items-center lg:justify-between">
          <div className="relative w-full lg:w-1/3">
            <div className="relative">
              <CareIcon
                icon="l-search"
                className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-500"
              />
              <Input
                placeholder={t("search_by_department_team_name")}
                value={qParams.search || ""}
                onChange={(event) => {
                  updateQuery({ search: event.target.value || undefined });
                }}
                className="w-full pl-8"
              />
            </div>
          </div>
          <div className="w-full md:w-auto">
            <FacilityOrganizationFormSheet
              organizationType={organizationType}
              parentId={id}
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3">
          <CardListSkeleton count={4} />
        </div>
      ) : (
        <div className="space-y-6 md:pb-6">
          <div className="space-y-4">
            {children?.results?.length ? (
              children.results.map((org) => (
                <OrganizationCard
                  key={org.id}
                  org={org}
                  organizationType={organizationType}
                  parentId={id}
                />
              ))
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
