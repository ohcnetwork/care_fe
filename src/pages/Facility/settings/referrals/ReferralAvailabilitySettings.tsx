import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  FilePlus2,
  Globe2,
  LockKeyhole,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { FieldError } from "@/components/ui/field";
import {
  Frame,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Muted,
  CareUIPageTitle as PageTitle,
  SubsectionTitle,
} from "@/components/ui/typography";

import Page from "@/components/Common/Page";
import { CardListSkeleton } from "@/components/Common/SkeletonLoading";

import query from "@/Utils/request/query";
import { ReferralFilters } from "@/components/Referral/ReferralFilters";
import { usePermissions } from "@/context/PermissionContext";
import {
  ReferralAvailabilityRead,
  ReferralAvailabilityStatus,
} from "@/types/emr/referral/referral";
import { referralAvailabilityApi } from "@/types/emr/referral/referralApi";
import facilityApi from "@/types/facility/facilityApi";
import facilityOrganizationApi from "@/types/facilityOrganization/facilityOrganizationApi";
import organizationApi from "@/types/organization/organizationApi";

import { DeleteReferralAvailabilityDialog } from "./DeleteReferralAvailabilityDialog";
import {
  ReferralAvailabilityForm,
  ReferralAvailabilityScope,
} from "./ReferralAvailabilityForm";

const PAGE_SIZE = 15;
const STATUS_VARIANTS = {
  draft: "warning",
  active: "success",
  inactive: "neutral",
} as const;

export default function ReferralAvailabilitySettings({
  facilityId,
  organizationId,
  embedded = false,
}: {
  embedded?: boolean;
} & (
  | { facilityId: string; organizationId?: never }
  | { organizationId: string; facilityId?: never }
)) {
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  const [departmentId, setDepartmentId] = useState("");
  const scopeType = organizationId
    ? "external_organization"
    : departmentId
      ? "internal_organization"
      : "facility";
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ReferralAvailabilityStatus | "all">(
    "all",
  );
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingAvailability, setDeletingAvailability] =
    useState<ReferralAvailabilityRead | null>(null);

  const facilityQuery = useQuery({
    queryKey: ["facility", facilityId],
    queryFn: query(facilityApi.get, {
      pathParams: { facilityId: facilityId ?? "" },
    }),
    enabled: !!facilityId,
  });
  const organizationQuery = useQuery({
    queryKey: ["organization", organizationId],
    queryFn: query(organizationApi.get, {
      pathParams: { id: organizationId ?? "" },
    }),
    enabled: !!organizationId,
  });
  const departmentQuery = useQuery({
    queryKey: ["facilityOrganization", facilityId, departmentId],
    queryFn: query(facilityOrganizationApi.get, {
      pathParams: {
        facilityId: facilityId ?? "",
        organizationId: departmentId,
      },
    }),
    enabled: scopeType === "internal_organization" && !!departmentId,
  });
  const scope: ReferralAvailabilityScope = {
    facilityId,
    entityType: scopeType,
    entityId:
      organizationId ??
      (scopeType === "facility" ? (facilityId ?? "") : departmentId),
  };
  const permissionsLoading =
    (organizationId ? organizationQuery.isLoading : facilityQuery.isLoading) ||
    (scopeType === "internal_organization" &&
      !!departmentId &&
      departmentQuery.isLoading);
  const scopePermissions = organizationId
    ? organizationQuery.data?.permissions
    : scopeType === "facility"
      ? facilityQuery.data?.root_org_permissions
      : departmentQuery.data?.permissions;
  const canManage =
    !!scope.entityId &&
    !permissionsLoading &&
    hasPermission("can_manage_referral_availability", scopePermissions ?? []);
  const permissionsError =
    (organizationId ? organizationQuery.isError : facilityQuery.isError) ||
    (scopeType === "internal_organization" &&
      !!departmentId &&
      departmentQuery.isError);

  const availabilityQuery = useQuery({
    queryKey: [
      "referral-availability-config",
      scopeType,
      scope.entityId,
      status,
      search,
      page,
    ],
    queryFn: query.debounced(referralAvailabilityApi.listConfig, {
      queryParams: {
        entity_type: scopeType,
        entity_id: scope.entityId,
        name: search || undefined,
        status: status === "all" ? undefined : status,
        ordering: "name",
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      },
    }),
    enabled: canManage,
  });
  const detailQuery = useQuery({
    queryKey: ["referral-availability", editingId],
    queryFn: query(referralAvailabilityApi.get, {
      pathParams: { availabilityId: editingId ?? "" },
    }),
    enabled: !!editingId && editingId !== "new" && canManage,
  });

  const scopeName = organizationId
    ? organizationQuery.data?.name
    : scopeType === "facility"
      ? facilityQuery.data?.name
      : departmentQuery.data?.name;
  const Title = embedded ? SubsectionTitle : PageTitle;
  const content = (
    <>
      <div className="container mx-auto space-y-6 text-foreground">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <Title>{t("referral_availability_settings")}</Title>
            <Muted className="mt-2 max-w-2xl">
              {t("referral_availability_settings_description")}
            </Muted>
          </div>
          {canManage && (
            <Button onClick={() => setEditingId("new")}>
              <FilePlus2 className="size-4" />
              {t("referral_create_availability")}
            </Button>
          )}
        </div>

        <Frame stacked>
          <FrameHeader>
            <FrameTitle className="flex items-center gap-2">
              <Building2 className="size-4" />
              {t("referral_configuration_scope")}
            </FrameTitle>
          </FrameHeader>
          <FramePanel className="space-y-3">
            <ReferralFilters
              key={organizationId ?? facilityId}
              departmentFilter={
                facilityId
                  ? {
                      facilityId,
                      departmentId,
                      department: departmentQuery.data,
                    }
                  : undefined
              }
              status={status === "all" ? null : status}
              statusOptions={(["draft", "active", "inactive"] as const).map(
                (value) => ({ value, label: t(value) }),
              )}
              onChange={(updates) => {
                if ("department" in updates) {
                  setDepartmentId(updates.department?.id ?? "");
                  setEditingId(null);
                  setDeletingAvailability(null);
                }
                if ("status" in updates) {
                  setStatus(
                    (updates.status as ReferralAvailabilityStatus | null) ??
                      "all",
                  );
                }
                setPage(1);
              }}
            />
            <Muted>{scopeName}</Muted>
          </FramePanel>
        </Frame>

        {permissionsLoading ? (
          <CardListSkeleton count={2} />
        ) : permissionsError ? (
          <div className="flex flex-wrap items-center gap-3">
            <FieldError>{t("referral_scope_load_error")}</FieldError>
            <Button
              variant="outline"
              onClick={() => {
                if (organizationId) organizationQuery.refetch();
                else facilityQuery.refetch();
                if (departmentId) departmentQuery.refetch();
              }}
            >
              {t("retry")}
            </Button>
          </div>
        ) : !canManage ? (
          <Empty className="border border-border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Building2 />
              </EmptyMedia>
              <EmptyTitle>
                {t(
                  scopeType === "internal_organization" && !departmentId
                    ? "referral_select_department"
                    : "referral_scope_permission_required",
                )}
              </EmptyTitle>
              <EmptyDescription>
                {t(
                  organizationId
                    ? "referral_organization_manage_permission"
                    : "referral_scope_permission_help",
                )}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Frame stacked>
            <FrameHeader className="flex-col gap-3 sm:flex-row">
              <InputGroup className="min-w-0 flex-1 sm:max-w-md bg-background">
                <InputGroupInput
                  aria-label={t("referral_search_availability")}
                  placeholder={t("referral_search_availability")}
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                />
                <InputGroupAddon>
                  <Search />
                </InputGroupAddon>
              </InputGroup>
            </FrameHeader>
            <FramePanel className="p-0">
              {availabilityQuery.isLoading ? (
                <CardListSkeleton count={3} />
              ) : availabilityQuery.isError ? (
                <div className="flex flex-wrap items-center gap-3 p-4">
                  <FieldError>
                    {t("referral_availability_load_error")}
                  </FieldError>
                  <Button
                    variant="outline"
                    onClick={() => availabilityQuery.refetch()}
                  >
                    {t("retry")}
                  </Button>
                </div>
              ) : !availabilityQuery.data?.results.length ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <FilePlus2 />
                    </EmptyMedia>
                    <EmptyTitle>{t("referral_no_availability")}</EmptyTitle>
                    <EmptyDescription>
                      {t(
                        search || status !== "all"
                          ? "referral_adjust_availability_filters"
                          : "referral_create_availability_help",
                      )}
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <ItemGroup className="gap-0">
                  {availabilityQuery.data.results.map((availability) => (
                    <Item
                      key={availability.id}
                      role="listitem"
                      className="rounded-none border-0 border-border [&:not(:last-child)]:border-b"
                    >
                      <ItemContent className="min-w-0">
                        <ItemTitle className="flex-wrap line-clamp-none">
                          <h2 className="text-sm font-medium break-words">
                            {availability.name}
                          </h2>
                          <Badge variant={STATUS_VARIANTS[availability.status]}>
                            {t(availability.status)}
                          </Badge>
                        </ItemTitle>
                        {availability.description && (
                          <ItemDescription>
                            {availability.description}
                          </ItemDescription>
                        )}
                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span>
                            {t(
                              availability.referral_type === "consultation"
                                ? "referral_type_consultation"
                                : "referral_type_lab",
                            )}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            {availability.is_public ? (
                              <Globe2 className="size-3.5" />
                            ) : (
                              <LockKeyhole className="size-3.5" />
                            )}
                            {t(
                              availability.is_public
                                ? "referral_visibility_public"
                                : "referral_visibility_private",
                            )}
                          </span>
                        </div>
                      </ItemContent>
                      <ItemActions>
                        <Button
                          variant="outline"
                          onClick={() => setEditingId(availability.id)}
                          aria-label={t("referral_edit_named_availability", {
                            name: availability.name,
                          })}
                        >
                          <Pencil className="size-4" />
                          {t("edit")}
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => setDeletingAvailability(availability)}
                          aria-label={t("referral_delete_named_availability", {
                            name: availability.name,
                          })}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </ItemActions>
                    </Item>
                  ))}
                </ItemGroup>
              )}
            </FramePanel>
            {!!availabilityQuery.data?.count &&
              availabilityQuery.data.count > PAGE_SIZE && (
                <FrameFooter className="flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
                  <span>
                    {t("referral_availability_page", {
                      page,
                      total: Math.ceil(
                        availabilityQuery.data.count / PAGE_SIZE,
                      ),
                    })}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                    >
                      {t("previous")}
                    </Button>
                    <Button
                      variant="outline"
                      disabled={
                        page * PAGE_SIZE >= availabilityQuery.data.count
                      }
                      onClick={() => setPage(page + 1)}
                    >
                      {t("next")}
                    </Button>
                  </div>
                </FrameFooter>
              )}
          </Frame>
        )}
      </div>
      <Sheet
        open={!!editingId && canManage}
        onOpenChange={(open) => {
          if (!open) setEditingId(null);
        }}
      >
        <SheetContent className="w-full overflow-y-auto bg-background text-foreground sm:max-w-2xl">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-foreground">
              {t(
                editingId === "new"
                  ? "referral_create_availability"
                  : "referral_edit_availability",
              )}
            </SheetTitle>
            <SheetDescription className="text-muted-foreground">
              {scopeName}
            </SheetDescription>
          </SheetHeader>
          {editingId === "new" ? (
            <ReferralAvailabilityForm
              key="new"
              scope={scope}
              onSaved={() => setEditingId(null)}
              onCancel={() => setEditingId(null)}
            />
          ) : detailQuery.isLoading ? (
            <CardListSkeleton count={3} />
          ) : detailQuery.isError ? (
            <div className="flex flex-wrap items-center gap-3">
              <FieldError>{t("referral_availability_load_error")}</FieldError>
              <Button variant="outline" onClick={() => detailQuery.refetch()}>
                {t("retry")}
              </Button>
            </div>
          ) : (
            detailQuery.data && (
              <ReferralAvailabilityForm
                key={detailQuery.data.id}
                scope={scope}
                availability={detailQuery.data}
                onSaved={() => setEditingId(null)}
                onCancel={() => setEditingId(null)}
                onDelete={() => {
                  if (detailQuery.data)
                    setDeletingAvailability(detailQuery.data);
                }}
              />
            )
          )}
        </SheetContent>
      </Sheet>
      {deletingAvailability && (
        <DeleteReferralAvailabilityDialog
          key={deletingAvailability.id}
          availability={deletingAvailability}
          canManage={canManage}
          onClose={() => setDeletingAvailability(null)}
          onDeleted={(availabilityId) => {
            setDeletingAvailability(null);
            setEditingId((current) =>
              current === availabilityId ? null : current,
            );
            if (availabilityQuery.data?.results.length === 1 && page > 1) {
              setPage(page - 1);
            }
          }}
        />
      )}
    </>
  );
  return embedded ? (
    content
  ) : (
    <Page title={t("referral_availability_settings")} hideTitleOnPage>
      {content}
    </Page>
  );
}
