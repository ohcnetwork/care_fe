import { useId } from "react";
import { useTranslation } from "react-i18next";

import { OrgSelect } from "@/components/Common/OrgSelect";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface AuthorRoleFilterProps {
  value?: string;
  onChange: (roleId?: string) => void;
  disabled?: boolean;
}

/** The response API filters by the author's role organization, not an RBAC role. */
export function AuthorRoleFilter({
  value,
  onChange,
  disabled,
}: AuthorRoleFilterProps) {
  const { t } = useTranslation();
  const id = useId();

  return (
    <div className="min-w-0 space-y-1.5">
      <Label htmlFor={id}>{t("author_role")}</Label>
      <OrgSelect
        id={id}
        orgType="role"
        value={value}
        onChange={(organization) => onChange(organization?.id)}
        placeholder={t(value ? "author_role" : "all_author_roles")}
        disabled={disabled}
        className="w-full"
        showClearButton={false}
      />
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-auto px-0 py-1 text-xs"
          disabled={disabled}
          onClick={() => onChange(undefined)}
        >
          {t("clear_author_role_filter")}
        </Button>
      )}
    </div>
  );
}
