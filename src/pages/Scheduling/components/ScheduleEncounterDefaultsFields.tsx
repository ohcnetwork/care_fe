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

/** Radix Select can't use an empty string as an item value. */
const NO_ENCOUNTER_TYPE = "none";

interface Props {
  facilityId: string;
  encounterType: EncounterClass | null;
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
      {/* Same layout as the care team section above. */}
      <FieldSet className="gap-3">
        <FieldLegend id={encounterTypeId}>{t("type_of_encounter")}</FieldLegend>
        <FieldDescription>
          {t("schedule_default_encounter_type_help")}
        </FieldDescription>
        <Select
          value={encounterType ?? NO_ENCOUNTER_TYPE}
          onValueChange={(value) =>
            onEncounterTypeChange(
              value === NO_ENCOUNTER_TYPE ? null : (value as EncounterClass),
            )
          }
          disabled={disabled}
        >
          <SelectTrigger aria-labelledby={encounterTypeId}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_ENCOUNTER_TYPE}>
              {t("not_specified")}
            </SelectItem>
            {careConfig.encounterClasses.map((value) => (
              <SelectItem key={value} value={value}>
                {t(`encounter_class__${value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldSet>
    </FieldSet>
  );
}
