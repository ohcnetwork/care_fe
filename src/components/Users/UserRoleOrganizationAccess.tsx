import { Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { OrgSelect } from "@/components/Common/OrgSelect";
import { RoleSelect } from "@/components/Common/RoleSelect";
import { RoleBase, RoleContext } from "@/types/emr/role/role";
import { Organization, OrgType } from "@/types/organization/organization";

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
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-900">
        {t("role_organizations")}
      </Label>

      <div className="space-y-2">
        {entries.map((entry, index) => (
          <div
            key={`${entry.organization || "new"}-${index}`}
            className="grid gap-2 rounded-lg border border-gray-200 bg-white p-3 md:grid-cols-[1fr_1fr_auto] md:items-end"
          >
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">
                {t("role_organization")}
              </Label>
              <OrgSelect
                value={entry.organization || undefined}
                onChange={(selectedOrganization) =>
                  updateEntry(index, {
                    organization: selectedOrganization?.id || "",
                  })
                }
                orgType={OrgType.ROLE}
                placeholder={t("select_role_organization")}
                inputPlaceholder={t("search_organization")}
                disabled={disabled}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">
                {t("designation")}
              </Label>
              <RoleSelect
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
            </div>
            <div className="flex justify-end md:pb-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 text-gray-400 hover:text-red-600"
                onClick={() => removeEntry(index)}
                disabled={disabled || entries.length <= 1}
              >
                <Trash2 className="size-3.5" />
                <span className="sr-only">{t("remove")}</span>
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-xs text-gray-500"
        onClick={addEntry}
        disabled={disabled}
      >
        <Plus className="mr-1 size-3.5" />
        {t("add_another")}
      </Button>
    </div>
  );
}

interface RoleOrgAccessSummaryProps {
  memberships: RoleOrgMembership[];
  onManage?: () => void;
  canManage?: boolean;
}

export function RoleOrgAccessSummary({
  memberships,
  onManage,
  canManage = false,
}: RoleOrgAccessSummaryProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded bg-gray-100 text-gray-600">
            <ShieldCheck className="size-3.5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              {t("role_organizations")}
            </h3>
            <p className="text-xs text-gray-500">
              {t("role_organization_access_summary_description")}
            </p>
          </div>
        </div>
        {canManage && onManage && (
          <Button type="button" variant="outline" size="sm" onClick={onManage}>
            {t("manage_access")}
          </Button>
        )}
      </div>

      <div className="p-3">
        {memberships.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">
            {t("no_role_organizations_assigned")}
          </p>
        ) : (
          <div className="grid gap-2 md:grid-cols-2">
            {memberships.map((membership) => (
              <div
                key={membership.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {membership.organization.name}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {t("role_organization")}
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  {membership.role.name}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
