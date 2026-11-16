import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription } from "@/components/ui/empty";
import {
  FieldDescription,
  FieldError,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";

import UserSelector from "@/components/Common/UserSelector";
import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import { formatName } from "@/Utils/utils";
import { CareTeamDraftMember } from "@/types/careTeam/careTeam";

interface Props {
  facilityId?: string;
  organizationId?: string;
  value: CareTeamDraftMember[];
  onChange: (value: CareTeamDraftMember[]) => void;
  /** Show "required" errors on incomplete rows (set after a failed save). */
  showErrors?: boolean;
  disabled?: boolean;
  title?: string;
  description?: string;
}

// Each member is an editable row inside the parent form, like contact points
// on the device form. Nothing is held outside `value`, so the parent's Save
// always sees every row; incomplete rows are flagged instead of dropped.
export function ReferralDefaultCareTeam({
  facilityId,
  organizationId,
  value,
  onChange,
  showErrors,
  disabled,
  title,
  description,
}: Props) {
  const { t } = useTranslation();

  function updateRow(index: number, row: CareTeamDraftMember) {
    onChange(value.map((current, i) => (i === index ? row : current)));
  }

  return (
    <FieldSet className="gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <FieldLegend>{title ?? t("referral_default_care_team")}</FieldLegend>
          <FieldDescription>
            {description ?? t("referral_default_care_team_help")}
          </FieldDescription>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...value, {}])}
          disabled={disabled}
        >
          <Plus className="size-4" />
          {t("add_member")}
        </Button>
      </div>

      {value.length === 0 ? (
        <Empty className="border">
          <EmptyDescription>{t("no_care_team_members")}</EmptyDescription>
        </Empty>
      ) : (
        <div role="list" className="space-y-2">
          {value.map((row, index) => (
            <div
              // Rows are fully controlled, so a remount when a member is
              // picked (key changes from new-N to the user id) is harmless.
              key={row.member?.id ?? `new-${index}`}
              role="listitem"
              className="flex items-start gap-2"
            >
              <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                <div className="min-w-0 space-y-1">
                  <UserSelector
                    selected={row.member}
                    onChange={(user) => {
                      const takenElsewhere = value.some(
                        (other, i) =>
                          i !== index && other.member?.id === user.id,
                      );
                      if (takenElsewhere) {
                        toast.error(t("member_already_added"));
                        return;
                      }
                      updateRow(index, { ...row, member: user });
                    }}
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
                        aria-invalid={showErrors && !row.member}
                        disabled={disabled}
                      >
                        <span className="min-w-0 truncate">
                          {row.member
                            ? formatName(row.member)
                            : t("select_member")}
                        </span>
                        <ChevronDown className="size-4 shrink-0" />
                      </Button>
                    }
                  />
                  {showErrors && !row.member && (
                    <FieldError>{t("please_select_member")}</FieldError>
                  )}
                </div>
                <div className="min-w-0 space-y-1">
                  <ValueSetSelect
                    type="button"
                    aria-label={t("select_role")}
                    aria-invalid={showErrors && !row.role}
                    system="system-practitioner-role-code"
                    value={row.role ?? null}
                    onSelect={(role) => updateRow(index, { ...row, role })}
                    placeholder={t("select_role")}
                    disabled={disabled}
                  />
                  {showErrors && !row.role && (
                    <FieldError>{t("please_select_role")}</FieldError>
                  )}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive"
                disabled={disabled}
                aria-label={
                  row.member
                    ? t("referral_remove_member", {
                        name: formatName(row.member),
                      })
                    : t("remove")
                }
                onClick={() => onChange(value.filter((_, i) => i !== index))}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </FieldSet>
  );
}
