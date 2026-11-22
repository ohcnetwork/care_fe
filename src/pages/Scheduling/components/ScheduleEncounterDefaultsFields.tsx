import careConfig from "@careConfig";
import { useId } from "react";
import { useTranslation } from "react-i18next";

import { FieldDescription, FieldLegend, FieldSet } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import FacilityOrganizationTreeSelect from "@/pages/Facility/settings/organizations/components/FacilityOrganizationTreeSelect";
import { ReferralDefaultCareTeam } from "@/pages/Facility/settings/referrals/ReferralDefaultCareTeam";
import { CareTeamResponse } from "@/types/careTeam/careTeam";
import { EncounterClass } from "@/types/emr/encounter/encounter";
import { FacilityOrganizationRead } from "@/types/facilityOrganization/facilityOrganization";

/** The shared Select does not emit empty values. */
const NO_ENCOUNTER_TYPE = "none";

interface Props {
  facilityId: string;
  encounterType: EncounterClass | null;
  encounterTypeOptions?: readonly EncounterClass[];
  onEncounterTypeChange: (encounterType: EncounterClass | null) => void;
  organizations: string[];
  onOrganizationsChange: (organizations: string[]) => void;
  /** Records for the saved organization IDs, so the selector can label them. */
  currentOrganizations?: FacilityOrganizationRead[];
  careTeam: CareTeamResponse[];
  onCareTeamChange: (careTeam: CareTeamResponse[]) => void;
  disabled?: boolean;
}

export function ScheduleEncounterDefaultsFields({
  facilityId,
  encounterType,
  encounterTypeOptions = careConfig.encounterClasses,
  onEncounterTypeChange,
  organizations,
  onOrganizationsChange,
  currentOrganizations,
  careTeam,
  onCareTeamChange,
  disabled,
}: Props) {
  const { t } = useTranslation();
  const encounterTypeId = useId();

  return (
    <FieldSet className="gap-4 rounded-lg border border-gray-200 bg-white p-4">
      <div>
        <FieldLegend>{t("schedule_encounter_defaults")}</FieldLegend>
        <FieldDescription>
          {t("schedule_encounter_defaults_help")}
        </FieldDescription>
      </div>
      <fieldset disabled={disabled} className="min-w-0">
        <FacilityOrganizationTreeSelect
          facilityId={facilityId}
          value={organizations}
          knownOrganizations={currentOrganizations}
          onChange={(value) => onOrganizationsChange(value ?? [])}
          optional
        />
      </fieldset>
      <ReferralDefaultCareTeam
        facilityId={facilityId}
        value={careTeam}
        onChange={onCareTeamChange}
        disabled={disabled}
        title={t("care_team")}
        description={t("schedule_default_care_team_help")}
      />
      <FieldSet className="gap-3">
        <FieldLegend id={encounterTypeId}>{t("type_of_encounter")}</FieldLegend>
        <FieldDescription id={`${encounterTypeId}-help`}>
          {t("schedule_default_encounter_type_help")}
        </FieldDescription>
        <Select<EncounterClass | typeof NO_ENCOUNTER_TYPE>
          value={encounterType ?? NO_ENCOUNTER_TYPE}
          onValueChange={(value) =>
            onEncounterTypeChange(value === NO_ENCOUNTER_TYPE ? null : value)
          }
          disabled={disabled}
        >
          <SelectTrigger
            aria-labelledby={encounterTypeId}
            aria-describedby={`${encounterTypeId}-help`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_ENCOUNTER_TYPE}>
              {t("not_specified")}
            </SelectItem>
            {encounterTypeOptions.map((value) => (
              <SelectItem key={value} value={value}>
                {t(`encounter_class__${value}`, { defaultValue: value })}
                {!careConfig.encounterClasses.includes(value) &&
                  ` (${t("unavailable")})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldSet>
    </FieldSet>
  );
}
