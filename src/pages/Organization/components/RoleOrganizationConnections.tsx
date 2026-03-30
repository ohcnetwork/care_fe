import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link2, Loader2, Plus, Unlink, X } from "lucide-react";
import { Link } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { OrgSelect } from "@/components/Common/OrgSelect";

import { getPermissions } from "@/common/Permissions";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { usePermissions } from "@/context/PermissionContext";
import {
  Organization,
  OrganizationParent,
  OrgType,
} from "@/types/organization/organization";
import organizationApi from "@/types/organization/organizationApi";

interface Props {
  organization: Organization;
  embedded?: boolean;
}

interface ManageOrganizationPayload {
  action: "add" | "remove";
  organizationId: string;
  targetOrganizationId: string;
  successMessage: string;
}

function OrganizationRow({
  organization,
  actionLabel,
  isPending,
  onAction,
  canManageOrganization,
}: {
  organization: OrganizationParent | Organization;
  actionLabel: string;
  isPending: boolean;
  onAction: () => void;
  canManageOrganization: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-gray-200 bg-white px-3 py-2">
      <Link
        href={`/admin/organizations/role/${organization.id}`}
        className="min-w-0 truncate text-sm font-medium text-gray-900 hover:text-primary-700 hover:underline"
      >
        {organization.name}
      </Link>
      {canManageOrganization && (
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 text-gray-400 hover:text-red-600"
          onClick={onAction}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <X className="size-3.5" />
          )}
          <span className="sr-only">{actionLabel}</span>
        </Button>
      )}
    </div>
  );
}

export default function RoleOrganizationConnections({
  organization,
  embedded = false,
}: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const [selectedManagingOrganization, setSelectedManagingOrganization] =
    useState<Organization>();
  const [selectedManagedOrganization, setSelectedManagedOrganization] =
    useState<Organization>();

  const { canManageOrganization } = getPermissions(
    hasPermission,
    organization.permissions,
  );

  const {
    data: managedOrganizations,
    isLoading: isLoadingManagedOrganizations,
  } = useQuery({
    queryKey: ["organization", organization.id, "managed-role-organizations"],
    queryFn: query(organizationApi.list, {
      queryParams: {
        org_type: OrgType.ROLE,
        get_managed_organizations: organization.id,
        limit: 100,
      },
    }),
    enabled: organization.org_type === OrgType.ROLE,
  });

  const { mutate: manageOrganization, isPending } = useMutation({
    mutationFn: ({
      action,
      organizationId,
      targetOrganizationId,
    }: ManageOrganizationPayload) =>
      mutate(organizationApi.manageManagingOrganization, {
        pathParams: { id: targetOrganizationId },
        body: { organization: organizationId, action },
      })({ organization: organizationId, action }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["organization"] });
      queryClient.invalidateQueries({
        queryKey: [
          "organization",
          organization.id,
          "managed-role-organizations",
        ],
      });
      toast.success(variables.successMessage);
      setSelectedManagingOrganization(undefined);
      setSelectedManagedOrganization(undefined);
    },
    onError: (error) => {
      const errorData = error.cause as { errors?: { msg?: string[] } };
      const messages = errorData?.errors?.msg;
      if (messages?.length) {
        messages.forEach((message) => toast.error(message));
        return;
      }
      toast.error(t("something_went_wrong"));
    },
  });

  if (organization.org_type !== OrgType.ROLE) {
    return null;
  }

  const currentManagingOrganizations =
    organization.managing_organizations || [];
  const currentManagedOrganizations = managedOrganizations?.results || [];

  const handleAddManagingOrganization = () => {
    if (!selectedManagingOrganization) {
      toast.error(t("select_managing_organization"));
      return;
    }

    if (selectedManagingOrganization.id === organization.id) {
      toast.error(t("role_organization_cannot_manage_itself"));
      return;
    }

    if (
      currentManagingOrganizations.some(
        (currentOrg) => currentOrg.id === selectedManagingOrganization.id,
      )
    ) {
      toast.error(t("organization_already_linked"));
      return;
    }

    manageOrganization({
      action: "add",
      organizationId: selectedManagingOrganization.id,
      targetOrganizationId: organization.id,
      successMessage: t("managing_organization_added_successfully"),
    });
  };

  const handleAddManagedOrganization = () => {
    if (!selectedManagedOrganization) {
      toast.error(t("select_managed_role_organization"));
      return;
    }

    if (selectedManagedOrganization.id === organization.id) {
      toast.error(t("role_organization_cannot_manage_itself"));
      return;
    }

    if (
      currentManagedOrganizations.some(
        (currentOrg) => currentOrg.id === selectedManagedOrganization.id,
      )
    ) {
      toast.error(t("organization_already_linked"));
      return;
    }

    manageOrganization({
      action: "add",
      organizationId: organization.id,
      targetOrganizationId: selectedManagedOrganization.id,
      successMessage: t("managed_role_organization_added_successfully"),
    });
  };

  return (
    <div className="space-y-4">
      {!embedded && (
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-gray-900">
            {t("role_organization_connections")}
          </h2>
          <p className="text-sm text-gray-500">
            {t("role_organization_connections_description")}
          </p>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        {/* Managing Organizations Section */}
        <section className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded bg-blue-50 text-blue-600">
                <Link2 className="size-3.5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {t("managing_organizations")}
                </h3>
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {t("managing_organizations_hint")}
            </p>
          </div>

          <div className="space-y-2 p-3">
            {currentManagingOrganizations.length > 0 ? (
              currentManagingOrganizations.map((managingOrganization) => (
                <OrganizationRow
                  key={managingOrganization.id}
                  organization={managingOrganization}
                  actionLabel={t("remove")}
                  isPending={isPending}
                  canManageOrganization={canManageOrganization}
                  onAction={() =>
                    manageOrganization({
                      action: "remove",
                      organizationId: managingOrganization.id,
                      targetOrganizationId: organization.id,
                      successMessage: t(
                        "managing_organization_removed_successfully",
                      ),
                    })
                  }
                />
              ))
            ) : (
              <div className="flex flex-col items-center gap-1.5 rounded-lg border border-dashed border-gray-200 bg-gray-50/50 px-4 py-5 text-center">
                <Unlink className="size-5 text-gray-300" />
                <p className="text-sm text-gray-500">
                  {t("no_managing_organizations")}
                </p>
              </div>
            )}
          </div>

          {canManageOrganization && (
            <div className="border-t border-gray-100 p-3">
              <Label className="text-xs font-medium text-gray-600">
                {t("add_managing_organization")}
              </Label>
              <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
                <OrgSelect
                  value={selectedManagingOrganization?.id}
                  onChange={setSelectedManagingOrganization}
                  orgType={OrgType.ROLE}
                  className="flex-1"
                  placeholder={t("select_managing_organization")}
                  inputPlaceholder={t("search_organization")}
                />
                <Button
                  size="sm"
                  className="sm:self-start"
                  onClick={handleAddManagingOrganization}
                  disabled={!selectedManagingOrganization || isPending}
                >
                  {isPending ? (
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  ) : (
                    <Plus className="mr-1.5 size-3.5" />
                  )}
                  {t("add")}
                </Button>
              </div>
            </div>
          )}
        </section>

        {/* Managed Organizations Section */}
        <section className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded bg-emerald-50 text-emerald-600">
                <Link2 className="size-3.5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {t("managed_role_organizations")}
                </h3>
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {t("managed_role_organizations_hint")}
            </p>
          </div>

          <div className="space-y-2 p-3">
            {isLoadingManagedOrganizations ? (
              <div className="flex items-center justify-center gap-2 py-5 text-sm text-gray-400">
                <Loader2 className="size-4 animate-spin" />
                {t("loading")}
              </div>
            ) : currentManagedOrganizations.length > 0 ? (
              currentManagedOrganizations.map((managedOrganization) => (
                <OrganizationRow
                  key={managedOrganization.id}
                  organization={managedOrganization}
                  actionLabel={t("remove")}
                  isPending={isPending}
                  canManageOrganization={canManageOrganization}
                  onAction={() =>
                    manageOrganization({
                      action: "remove",
                      organizationId: organization.id,
                      targetOrganizationId: managedOrganization.id,
                      successMessage: t(
                        "managed_role_organization_removed_successfully",
                      ),
                    })
                  }
                />
              ))
            ) : (
              <div className="flex flex-col items-center gap-1.5 rounded-lg border border-dashed border-gray-200 bg-gray-50/50 px-4 py-5 text-center">
                <Unlink className="size-5 text-gray-300" />
                <p className="text-sm text-gray-500">
                  {t("no_managed_role_organizations")}
                </p>
              </div>
            )}
          </div>

          {canManageOrganization && (
            <div className="border-t border-gray-100 p-3">
              <Label className="text-xs font-medium text-gray-600">
                {t("add_managed_role_organization")}
              </Label>
              <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
                <OrgSelect
                  value={selectedManagedOrganization?.id}
                  onChange={setSelectedManagedOrganization}
                  orgType={OrgType.ROLE}
                  className="flex-1"
                  placeholder={t("select_managed_role_organization")}
                  inputPlaceholder={t("search_organization")}
                />
                <Button
                  size="sm"
                  className="sm:self-start"
                  onClick={handleAddManagedOrganization}
                  disabled={!selectedManagedOrganization || isPending}
                >
                  {isPending ? (
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  ) : (
                    <Plus className="mr-1.5 size-3.5" />
                  )}
                  {t("add")}
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
