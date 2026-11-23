import { useQuery } from "@tanstack/react-query";
import { Building, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { OrgSelector } from "@/components/Questionnaire/OrgSelector";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import useAuthUser from "@/hooks/useAuthUser";
import organizationApi from "@/types/organization/organizationApi";
import { WorkspaceOrganizationRead } from "@/types/workspace/workspace";
import query from "@/Utils/request/query";

interface WorkspaceInstanceOrganizationSelectorProps {
  value: string[];
  organizations: WorkspaceOrganizationRead[];
  disabled: boolean;
  onChange: (ids: string[], organizations: WorkspaceOrganizationRead[]) => void;
}

export function WorkspaceInstanceOrganizationSelector({
  value,
  organizations,
  disabled,
  onChange,
}: WorkspaceInstanceOrganizationSelectorProps) {
  const { t } = useTranslation();
  const user = useAuthUser();
  const [search, setSearch] = useState("");
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["workspace-organization-options", user.id, search],
    queryFn: query.paginated(organizationApi.list, {
      queryParams: { name: search || undefined },
    }),
  });
  const removeOrganization = (id: string) => {
    if (disabled) return;
    onChange(
      value.filter((selectedId) => selectedId !== id),
      organizations.filter((organization) => organization.id !== id),
    );
  };

  return (
    <div className="space-y-3">
      <OrgSelector
        selected={value}
        searchQuery={search}
        onSearchChange={setSearch}
        isLoading={isLoading}
        organizations={data}
        onToggle={(id) => {
          if (disabled) return;
          if (value.includes(id)) {
            removeOrganization(id);
            return;
          }
          const organization = data?.results.find((item) => item.id === id);
          if (organization) {
            onChange([...value, id], [...organizations, organization]);
          }
        }}
      />
      {isError && (
        <Alert variant="destructive">
          <AlertDescription className="space-y-3">
            <p>{t("organizations_fetch_error")}</p>
            <Button type="button" variant="outline" onClick={() => refetch()}>
              {t("try_again")}
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {organizations
        .filter((organization) => value.includes(organization.id))
        .map((organization) => (
          <div
            key={organization.id}
            className="flex items-center gap-3 rounded-md border border-primary-100 bg-primary-50/50 p-2.5"
          >
            <Building className="size-4 shrink-0 text-primary-600" />
            <span className="min-w-0 flex-1 break-words text-sm font-medium text-primary-900">
              {organization.name}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 text-gray-500 hover:text-gray-900"
              disabled={disabled}
              aria-label={t("workspace_remove_organization", {
                name: organization.name,
              })}
              onClick={() => removeOrganization(organization.id)}
            >
              <X className="size-4" />
            </Button>
          </div>
        ))}
    </div>
  );
}
