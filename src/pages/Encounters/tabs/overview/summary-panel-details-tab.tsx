import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";

import { Account } from "./summary-panel-details-tab/account";
import { AuditLogs } from "./summary-panel-details-tab/auditlogs";
import { DepartmentsAndTeams } from "./summary-panel-details-tab/department-and-team";
import { DischargeDetails } from "./summary-panel-details-tab/discharge-summary";
import { EncounterDetails } from "./summary-panel-details-tab/encounter-details";
import { EncounterTags } from "./summary-panel-details-tab/encounter-tags";
import { Forms } from "./summary-panel-details-tab/forms";
import { HospitalizationDetails } from "./summary-panel-details-tab/hospitalisation";
import { Locations } from "./summary-panel-details-tab/locations";
import { ManageCareTeam } from "./summary-panel-details-tab/manage-care-team";
import { SummaryPanelEncounterDetails } from "./summary-panel-details-tab/summary-panel-encounter-details";

export const SummaryPanelDetailTab = () => {
  const { canWriteSelectedEncounter: canEdit } = useEncounter();

  return (
    <div>
      <SummaryPanelEncounterDetails />
      {canEdit && (
        <div className="xl:hidden mt-4 md:flex block">
          <Forms />
        </div>
      )}
      <div className="hidden xl:flex flex-col gap-4">
        <EncounterDetails />
        <EncounterTags />
        {canEdit && <Forms />}
        <Locations />
        <ManageCareTeam />
        <Account />
        <DepartmentsAndTeams />
        <HospitalizationDetails />
        <DischargeDetails />
        <AuditLogs />
      </div>
    </div>
  );
};
