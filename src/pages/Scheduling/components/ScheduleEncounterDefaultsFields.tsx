import { useTranslation } from "react-i18next";

import { FieldDescription, FieldLegend, FieldSet } from "@/components/ui/field";

import FacilityOrganizationSelector from "@/pages/Facility/settings/organizations/components/FacilityOrganizationSelector";
import { ReferralDefaultCareTeam } from "@/pages/Facility/settings/referrals/ReferralDefaultCareTeam";
import { CareTeamResponse } from "@/types/careTeam/careTeam";
import { FacilityOrganizationRead } from "@/types/facilityOrganization/facilityOrganization";

interface Props {
  facilityId: string;
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
  organizations,
  onOrganizationsChange,
  currentOrganizations,
  careTeam,
  onCareTeamChange,
  disabled,
}: Props) {
  const { t } = useTranslation();

  return (
    <FieldSet className="gap-4 rounded-lg border border-gray-200 bg-white p-4">
      <div>
        <FieldLegend>{t("schedule_encounter_defaults")}</FieldLegend>
        <FieldDescription>
          {t("schedule_encounter_defaults_help")}
        </FieldDescription>
      </div>
      <fieldset disabled={disabled} className="min-w-0">
        <FacilityOrganizationSelector
          facilityId={facilityId}
          value={organizations}
          currentOrganizations={currentOrganizations}
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
    </FieldSet>
  );
}
