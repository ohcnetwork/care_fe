import { Spinner } from "@/components/ui/spinner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { AccessibleRoleOrgSelect } from "@/components/Common/AccessibleRoleOrgSelect";
import { RoleSelect } from "@/components/Common/RoleSelect";
import {
  UserFormList,
  UserFormListHeader,
  UserFormListHeaderCell,
  UserFormListRow,
} from "@/components/Users/UserFormRow";
import { useMobileAddUser } from "@/components/Users/UserFormSection";
import { UserProfileSection } from "@/components/Users/UserProfileSection";
import { RoleBase, RoleContext } from "@/types/emr/role/role";
import { Organization } from "@/types/organization/organization";
import organizationApi from "@/types/organization/organizationApi";
import mutate from "@/Utils/request/mutate";

const ROLE_ORG_COLUMNS = "sm:grid-cols-[1fr_1fr_var(--row-action)]";

export interface RoleOrgFormValue {
  organization: string;
  role: string;
}

interface RoleOrgMembership {
  id: string;
  organization: Organization;
  role: Pick<RoleBase, "id" | "name" | "description" | "is_system">;
}

interface RoleOrgAccessEditorProps {
  value: RoleOrgFormValue[];
  onChange: (value: RoleOrgFormValue[]) => void;
  disabled?: boolean;
}

const EMPTY_ROLE_ORG: RoleOrgFormValue = {
  organization: "",
  role: "",
};

export function RoleOrgAccessEditor({
  value,
  onChange,
  disabled = false,
}: RoleOrgAccessEditorProps) {
  const { t } = useTranslation();
  const mobile = useMobileAddUser();
  const EntryField = mobile ? Field : "div";

  const entries = value.length > 0 ? value : [{ ...EMPTY_ROLE_ORG }];

  const updateEntry = (index: number, patch: Partial<RoleOrgFormValue>) => {
    onChange(
      entries.map((entry, currentIndex) =>
        currentIndex === index ? { ...entry, ...patch } : entry,
      ),
    );
  };

  const addEntry = () => {
    onChange([...entries, { ...EMPTY_ROLE_ORG }]);
  };

  const removeEntry = (index: number) => {
    if (entries.length <= 1) return;
    onChange(entries.filter((_, currentIndex) => currentIndex !== index));
  };

  return (
    <UserFormList
      title={t("role_organizations")}
      count={entries.length}
      addLabel={t("add_another")}
      addDisabled={disabled}
      onAdd={addEntry}
      onRemove={removeEntry}
      headers={
        <UserFormListHeader columns={ROLE_ORG_COLUMNS}>
          <UserFormListHeaderCell>
            {t("role_organization")}
          </UserFormListHeaderCell>
          <UserFormListHeaderCell>{t("designation")}</UserFormListHeaderCell>
          <span />
        </UserFormListHeader>
      }
    >
      {(removeAt) =>
        entries.map((entry, index) => (
          <UserFormListRow
            key={`${entry.organization || "new"}-${index}`}
            columns={ROLE_ORG_COLUMNS}
            title={t("profile_responsibility_number", { number: index + 1 })}
            removeLabel={
              mobile
                ? t("profile_remove_responsibility", { number: index + 1 })
                : t("remove")
            }
            onlyEntry={entries.length <= 1}
            removeDisabled={disabled}
            onRemove={() => removeAt(index)}
          >
            <EntryField
              className={mobile ? undefined : "flex flex-col gap-1.5"}
            >
              <Label className="sm:sr-only">{t("role_organization")}</Label>
              <AccessibleRoleOrgSelect
                value={entry.organization || undefined}
                onChange={(selectedOrganization) =>
                  updateEntry(index, {
                    organization: selectedOrganization?.id || "",
                  })
                }
                placeholder={t("select_role_organization")}
                inputPlaceholder={t("search_organization")}
                disabled={disabled}
              />
            </EntryField>
            <EntryField
              className={mobile ? undefined : "flex flex-col gap-1.5"}
            >
              <Label className="sm:sr-only">{t("designation")}</Label>
              <RoleSelect
                appearance="field"
                value={
                  entry.role
                    ? ({
                        id: entry.role,
                        name: "",
                        description: "",
                        is_system: false,
                        contexts: [RoleContext.ROLE_ORG],
                      } as RoleBase)
                    : undefined
                }
                onChange={(selectedRole) =>
                  updateEntry(index, {
                    role: selectedRole.id,
                  })
                }
                context={RoleContext.ROLE_ORG}
                disabled={disabled}
                placeholder={t("select_designation")}
              />
            </EntryField>
          </UserFormListRow>
        ))
      }
    </UserFormList>
  );
}

interface RoleOrgAccessSummaryProps {
  userId: string;
  memberships: RoleOrgMembership[];
}

export function RoleOrgAccessSummary({
  userId,
  memberships,
}: RoleOrgAccessSummaryProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [newOrg, setNewOrg] = useState<Organization>();
  const [newRole, setNewRole] = useState<RoleBase>();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["user"] });
    queryClient.invalidateQueries({ queryKey: ["getUserDetails"] });
    queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    queryClient.invalidateQueries({ queryKey: ["organizationUsers"] });
  };

  const { mutate: assignUser, isPending: isAssigning } = useMutation({
    mutationFn: (params: { orgId: string; role: string }) =>
      mutate(organizationApi.assignUser, {
        pathParams: { id: params.orgId },
        body: { user: userId, role: params.role },
      })({ user: userId, role: params.role }),
    onSuccess: () => {
      invalidate();
      toast.success(t("user_role_update_success"));
      setNewOrg(undefined);
      setNewRole(undefined);
    },
    onError: () => toast.error(t("something_went_wrong")),
  });

  const { mutate: removeRole, isPending: isRemoving } = useMutation({
    mutationFn: (params: { orgId: string; userRoleId: string }) =>
      mutate(organizationApi.removeUserRole, {
        pathParams: { id: params.orgId, userRoleId: params.userRoleId },
      })({}),
    onSuccess: () => {
      invalidate();
      toast.success(t("user_removed_success"));
    },
    onError: () => toast.error(t("something_went_wrong")),
  });

  const isPending = isAssigning || isRemoving;

  return (
    <UserProfileSection
      title={t("role_organizations")}
      icon={ShieldCheck}
      action={
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="-mr-2 shrink-0"
              aria-label={t("manage_access")}
            >
              {t("manage")}
            </Button>
          </SheetTrigger>
          <SheetContent className="overflow-hidden">
            <SheetHeader>
              <SheetTitle>{t("role_organizations")}</SheetTitle>
              <SheetDescription>
                {t("role_organization_access_summary_description")}
              </SheetDescription>
            </SheetHeader>
            <SheetBody>
              <div className="space-y-4">
                {/* Existing assignments */}
                {memberships.map((membership) => (
                  <div
                    key={membership.id}
                    className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {membership.organization.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {membership.role.name}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0 text-gray-400 hover:text-red-600"
                      onClick={() =>
                        removeRole({
                          orgId: membership.organization.id,
                          userRoleId: membership.id,
                        })
                      }
                      disabled={isPending}
                    >
                      {isRemoving ? (
                        <Spinner className="size-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                    </Button>
                  </div>
                ))}

                {memberships.length === 0 && (
                  <p className="py-4 text-center text-sm text-gray-400">
                    {t("no_role_organizations_assigned")}
                  </p>
                )}

                {/* Add new assignment */}
                <div className="space-y-3 rounded-lg border border-dashed border-gray-300 bg-gray-50/50 p-3">
                  <p className="text-xs font-medium text-gray-600">
                    {t("add_access")}
                  </p>
                  <div className="space-y-2">
                    <AccessibleRoleOrgSelect
                      value={newOrg?.id}
                      onChange={setNewOrg}
                      placeholder={t("select_role_organization")}
                      inputPlaceholder={t("search_organization")}
                    />
                    <RoleSelect
                      value={newRole}
                      onChange={setNewRole}
                      context={RoleContext.ROLE_ORG}
                      placeholder={t("select_designation")}
                    />
                    <Button
                      className="w-full"
                      size="sm"
                      onClick={() => {
                        if (newOrg && newRole) {
                          assignUser({ orgId: newOrg.id, role: newRole.id });
                        }
                      }}
                      disabled={isPending || !newOrg || !newRole}
                    >
                      {isAssigning ? (
                        <Spinner className="mr-1.5 size-3.5 animate-spin" />
                      ) : (
                        <Plus className="mr-1.5 size-3.5" />
                      )}
                      {t("add_access")}
                    </Button>
                  </div>
                </div>
              </div>
            </SheetBody>
          </SheetContent>
        </Sheet>
      }
    >
      {memberships.length === 0 ? (
        <p className="rounded-lg bg-soft-background px-4 py-6 text-center text-sm text-soft-foreground">
          {t("no_role_organizations_assigned")}
        </p>
      ) : (
        <ul className="divide-y divide-border/60">
          {memberships.map((membership) => (
            <li
              key={membership.id}
              className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-soft-background text-soft-foreground">
                <Building2
                  className="size-4"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              </div>
              <p className="min-w-0 flex-1 break-words text-sm font-medium">
                {membership.organization.name}
              </p>
              <Badge variant="secondary" className="text-xs font-normal">
                {membership.role.name}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </UserProfileSection>
  );
}
