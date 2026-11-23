import { HrefLink as Link } from "@/lib/router/HrefLink";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, MoreVertical } from "lucide-react";
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
import { adminOrganizationListSearch } from "@/lib/router/search/admin";

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
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-gray-900">
            {org.name}
          </h3>
          {org.description && (
            <p className="mt-1 break-words text-sm text-gray-600">
              {org.description}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <FacilityOrganizationFormSheet
            organizationType={organizationType}
            parentId={parentId}
            org={org}
          />

          <Button variant="outline" size="sm" className="font-semibold" asChild>
            <Link href={`/admin/organizations/${organizationType}/${org.id}`}>
              {t("see_details")}
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                aria-label={t("more_options")}
              >
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
    schema: adminOrganizationListSearch,
    limit: 12,
  });
  const isFlatOrgType =
    organizationType === OrgType.ROLE ||
    organizationType === OrgType.PRODUCT_SUPPLIER;

  const {
    data: children,
    isLoading,
    isError,
    refetch,
  } = useQuery({
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
    <div className="mx-auto max-w-4xl space-y-5 md:pt-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <CareIcon
            icon="l-search"
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-500"
          />
          <Input
            placeholder={t("search_by_department_team_name")}
            value={qParams.search || ""}
            aria-label={t("search_by_department_team_name")}
            onChange={(event) => {
              updateQuery({ search: event.target.value || undefined });
            }}
            className="w-full pl-8"
          />
        </div>
        <FacilityOrganizationFormSheet
          organizationType={organizationType}
          parentId={id}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3">
          <CardListSkeleton count={4} />
        </div>
      ) : isError ? (
        <div
          role="alert"
          className="flex flex-col items-center gap-3 rounded-lg border border-gray-200 bg-white p-8 text-center"
        >
          <p className="text-sm text-gray-600">{t("something_went_wrong")}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
          >
            {t("retry")}
          </Button>
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
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-gray-300 p-10 text-center">
                <Building2
                  className="size-7 text-gray-400"
                  aria-hidden="true"
                />
                <p className="text-sm text-gray-600">
                  {t("no_organizations_found")}
                </p>
              </div>
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
