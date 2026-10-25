import { ChevronDown, Plus, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/careui/button";
import {
  FieldDescription,
  FieldLegend,
  FieldSet,
} from "@/components/careui/field";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/careui/item";

import UserSelector from "@/components/Common/UserSelector";
import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import { formatName } from "@/Utils/utils";
import { Code } from "@/types/base/code/code";
import { CareTeamResponse } from "@/types/careTeam/careTeam";
import { UserReadMinimal } from "@/types/user/user";

interface Props {
  facilityId?: string;
  organizationId?: string;
  value: CareTeamResponse[];
  onChange: (value: CareTeamResponse[]) => void;
  disabled?: boolean;
  title?: string;
  description?: string;
}

export function ReferralDefaultCareTeam({
  facilityId,
  organizationId,
  value,
  onChange,
  disabled,
  title,
  description,
}: Props) {
  const { t } = useTranslation();
  const [selectedUser, setSelectedUser] = useState<UserReadMinimal>();
  const [selectedRole, setSelectedRole] = useState<Code | null>(null);

  function addMember() {
    if (!selectedUser || !selectedRole) return;
    if (value.some(({ member }) => member.id === selectedUser.id)) {
      toast.error(t("member_already_added"));
      return;
    }
    onChange([...value, { member: selectedUser, role: selectedRole }]);
    setSelectedUser(undefined);
    setSelectedRole(null);
  }

  return (
    <FieldSet className="gap-3">
      <FieldLegend>{title ?? t("referral_default_care_team")}</FieldLegend>
      <FieldDescription>
        {description ?? t("referral_default_care_team_help")}
      </FieldDescription>
      <div className="space-y-2">
        <UserSelector
          appearance="careui"
          selected={selectedUser}
          onChange={setSelectedUser}
          facilityId={facilityId}
          organizationId={organizationId}
          placeholder={t("select_member")}
          disabled={disabled}
          dialogTitle={t("select_member")}
          trigger={
            <Button
              type="button"
              role="combobox"
              variant="outline"
              className="w-full justify-between"
              aria-label={t("select_member")}
              disabled={disabled}
            >
              <span className="min-w-0 truncate">
                {selectedUser ? formatName(selectedUser) : t("select_member")}
              </span>
              <ChevronDown className="size-4 shrink-0" />
            </Button>
          }
        />
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <ValueSetSelect
              type="button"
              aria-label={t("select_role")}
              system="system-practitioner-role-code"
              value={selectedRole}
              onSelect={setSelectedRole}
              placeholder={t("select_role")}
              disabled={disabled}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={addMember}
            disabled={disabled || !selectedUser || !selectedRole}
          >
            <Plus className="size-4" />
            {t("add")}
          </Button>
        </div>
      </div>
      {value.length > 0 && (
        <ItemGroup>
          {value.map(({ member, role }) => (
            <Item key={member.id} role="listitem" size="sm" variant="outline">
              <ItemContent className="min-w-0">
                <ItemTitle className="line-clamp-none break-words">
                  {formatName(member)}
                </ItemTitle>
                <ItemDescription>{role.display}</ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={disabled}
                  aria-label={t("referral_remove_member", {
                    name: formatName(member),
                  })}
                  onClick={() =>
                    onChange(
                      value.filter((entry) => entry.member.id !== member.id),
                    )
                  }
                >
                  <X className="size-4" />
                </Button>
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      )}
    </FieldSet>
  );
}
