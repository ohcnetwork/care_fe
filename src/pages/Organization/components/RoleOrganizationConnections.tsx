import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, HatGlasses, Loader2, Plus, Users, X } from "lucide-react";
import { Link } from "raviger";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { OrgSelect } from "@/components/Common/OrgSelect";

import {
  getPermissions,
  PERMISSION_CREATE_ORGANIZATION,
} from "@/common/Permissions";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { usePermissions } from "@/context/PermissionContext";
import ResponsibilityFormDialog from "@/pages/Admin/organizations/components/ResponsibilityFormDialog";
import {
  Organization,
  OrganizationParent,
  OrgType,
} from "@/types/organization/organization";
import organizationApi from "@/types/organization/organizationApi";

interface Props {
  organization: Organization;
}

interface ManageOrganizationPayload {
  action: "add" | "remove";
  organizationId: string;
  targetOrganizationId: string;
  successMessage: string;
}

function ConnectionCard({
  organization,
  isPending,
  onRemove,
  canManageOrganization,
  removeLabel,
}: {
  organization: OrganizationParent | Organization;
  isPending: boolean;
  onRemove: () => void;
  canManageOrganization: boolean;
  removeLabel: string;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-gray-900">
          {organization.name}
        </p>
        {organization.description && (
          <p className="truncate text-xs text-gray-700">
            {organization.description}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href={`/admin/organizations/role/${organization.id}`}
          className="text-xs font-medium text-gray-900 underline underline-offset-2 hover:text-gray-600"
          aria-label={organization.name}
        >
          {t("view")}
        </Link>
        {canManageOrganization && (
          <>
            <span className="ml-2 h-7 w-px bg-gray-300" />
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-gray-400 hover:text-red-600"
              onClick={onRemove}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <X className="size-3.5" />
              )}
              <span className="sr-only">{removeLabel}</span>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function EmptyHint({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/70 px-4 py-3 text-sm text-gray-700">
      {children}
    </div>
  );
}

function DotSeparator() {
  return (
    <div
      className="sm:ml-9 h-4 overflow-hidden"
      style={{
        backgroundImage:
          "radial-gradient(circle, #cbd5e1 0.5px, transparent 1.2px), radial-gradient(circle, #cbd5e1 0.5px, transparent 1.2px)",
        backgroundSize: "8px 12px, 8px 12px",
        backgroundPosition: "0px 2px, 4px 8px",
        backgroundRepeat: "repeat, repeat",
      }}
      aria-hidden="true"
    />
  );
}

function getScrollParent(node: HTMLElement | null): HTMLElement | null {
  let el = node?.parentElement;
  while (el) {
    const { overflowY } = getComputedStyle(el);
    if (overflowY === "auto" || overflowY === "scroll") {
      return el;
    }
    el = el.parentElement;
  }
  return null;
}

export default function RoleOrganizationConnections({ organization }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  const { canManageOrganization } = getPermissions(
    hasPermission,
    organization.permissions,
  );
  const canCreateOrganization = hasPermission(PERMISSION_CREATE_ORGANIZATION);

  const containerRef = useRef<HTMLDivElement>(null);
  const managedBySectionRef = useRef<HTMLDivElement>(null);
  const [showJumpToManagedBy, setShowJumpToManagedBy] = useState(false);

  useEffect(() => {
    const target = managedBySectionRef.current;
    if (!target) return;

    const scrollParent = getScrollParent(containerRef.current);

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isBelowView =
          entry.boundingClientRect.top > (entry.rootBounds?.bottom ?? 0);
        setShowJumpToManagedBy(!entry.isIntersecting && isBelowView);
      },
      { root: scrollParent, threshold: 0 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const noOptionsContent = (
    <div className="space-y-2 py-1">
      <p className="text-center text-sm italic text-gray-500">
        {t("responsibility_none_available")}
      </p>
      {canCreateOrganization && (
        <ResponsibilityFormDialog
          trigger={
            <button
              type="button"
              className="inline-flex w-full items-center justify-center gap-1.5 text-sm font-semibold text-gray-900 underline underline-offset-2 hover:text-primary-700"
            >
              <Plus className="size-3.5" />
              {t("responsibility_new")}
            </button>
          }
        />
      )}
    </div>
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

  const managedIds = currentManagedOrganizations.map((org) => org.id);
  const managingIds = currentManagingOrganizations.map((org) => org.id);

  /** Shared guard + mutate call for linking two role organizations together. */
  const addOrganizationLink = ({
    organizationId,
    targetOrganizationId,
    existingIds,
    successMessage,
  }: {
    organizationId: string;
    targetOrganizationId: string;
    existingIds: string[];
    successMessage: string;
  }) => {
    if (targetOrganizationId === organizationId) {
      toast.error(t("role_organization_cannot_manage_itself"));
      return;
    }
    if (existingIds.includes(targetOrganizationId)) {
      toast.error(t("organization_already_linked"));
      return;
    }
    manageOrganization({
      action: "add",
      organizationId,
      targetOrganizationId,
      successMessage,
    });
  };

  const handleSelectManaged = (selected?: Organization) => {
    if (!selected) return;
    addOrganizationLink({
      organizationId: organization.id,
      targetOrganizationId: selected.id,
      existingIds: managedIds,
      successMessage: t("managed_role_organization_added_successfully"),
    });
  };

  const handleSelectManaging = (selected?: Organization) => {
    if (!selected) return;
    addOrganizationLink({
      organizationId: selected.id,
      targetOrganizationId: organization.id,
      existingIds: managingIds,
      successMessage: t("managing_organization_added_successfully"),
    });
  };

  const name = organization.name;

  return (
    <div ref={containerRef} className="relative space-y-6">
      {/* What responsibilities can this one manage? (managed) */}
      <section className="space-y-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-primary-100 text-primary-700">
            <Users className="size-3.5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-900">
              <Trans
                i18nKey="responsibility_manages_title"
                values={{ name }}
                components={{
                  highlight: <span className="italic text-gray-500" />,
                }}
              />
            </h3>
            <p className="text-xs text-gray-500">
              {t("responsibility_manages_subtitle", { name })}
            </p>
          </div>
        </div>

        <div className="space-y-2 sm:pl-9">
          {isLoadingManagedOrganizations ? (
            <div className="flex items-center gap-2 py-3 text-sm text-gray-400">
              <Loader2 className="size-4 animate-spin" />
              {t("loading")}
            </div>
          ) : currentManagedOrganizations.length > 0 ? (
            currentManagedOrganizations.map((managedOrganization) => (
              <ConnectionCard
                key={managedOrganization.id}
                organization={managedOrganization}
                isPending={isPending}
                canManageOrganization={canManageOrganization}
                removeLabel={t("remove")}
                onRemove={() =>
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
            <EmptyHint>{t("responsibility_manages_empty", { name })}</EmptyHint>
          )}

          {canManageOrganization && (
            <div className="pt-1">
              <Label className="text-xs font-medium text-gray-600">
                {t("responsibility_manages_select_label")}
              </Label>
              <OrgSelect
                value={undefined}
                onChange={handleSelectManaged}
                orgType={OrgType.ROLE}
                className="mt-1.5 w-full [&>span]:truncate"
                placeholder={t("responsibility_manages_placeholder", { name })}
                inputPlaceholder={t("search")}
                noOptionsMessage={noOptionsContent}
                excludeIds={[organization.id, ...managedIds]}
              />
            </div>
          )}
        </div>
      </section>

      <DotSeparator />

      {/* Who can manage this one? (managing) */}
      <section ref={managedBySectionRef} className="space-y-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-blue-100 text-blue-700">
            <HatGlasses className="size-3.5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-900">
              <Trans
                i18nKey="responsibility_managed_by_title"
                values={{ name }}
                components={{
                  highlight: <span className="italic text-gray-500" />,
                }}
              />
            </h3>
            <p className="text-xs text-gray-500">
              {t("responsibility_managed_by_subtitle", { name })}
            </p>
          </div>
        </div>

        <div className="space-y-2 sm:pl-9">
          {currentManagingOrganizations.length > 0 ? (
            currentManagingOrganizations.map((managingOrganization) => (
              <ConnectionCard
                key={managingOrganization.id}
                organization={managingOrganization}
                isPending={isPending}
                canManageOrganization={canManageOrganization}
                removeLabel={t("remove")}
                onRemove={() =>
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
            <EmptyHint>
              <Trans
                i18nKey="responsibility_managed_by_empty"
                values={{ name }}
                components={{ bold: <span className="font-semibold" /> }}
              />
            </EmptyHint>
          )}

          {canManageOrganization && (
            <div className="pt-1">
              <Label className="text-xs font-medium text-gray-600">
                {t("responsibility_managed_by_select_label")}
              </Label>
              <OrgSelect
                value={undefined}
                onChange={handleSelectManaging}
                orgType={OrgType.ROLE}
                className="mt-1.5 w-full [&>span]:truncate"
                placeholder={t("responsibility_managed_by_placeholder", {
                  name,
                })}
                inputPlaceholder={t("search")}
                noOptionsMessage={noOptionsContent}
                excludeIds={[organization.id, ...managingIds]}
              />
            </div>
          )}
        </div>
      </section>

      {showJumpToManagedBy && (
        <button
          type="button"
          onClick={() =>
            managedBySectionRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            })
          }
          className="sticky inset-x-0 bottom-0 z-10 -mx-5 flex w-[calc(100%+2.5rem)] items-center justify-between gap-3 border-t border-gray-200 bg-white/95 px-5 py-2.5 text-left text-sm font-medium text-gray-700 backdrop-blur-sm hover:text-gray-900"
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-blue-100 text-blue-700">
              <HatGlasses className="size-3.5" />
            </span>
            <span className="truncate">
              <Trans
                i18nKey="responsibility_next_section_managed_by"
                values={{ name }}
                components={{
                  highlight: <span className="italic text-gray-500" />,
                }}
              />
            </span>
          </span>
          <ArrowDown className="size-4 shrink-0" />
        </button>
      )}
    </div>
  );
}
