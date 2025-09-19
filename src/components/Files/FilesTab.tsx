import { t } from "i18next";

import { FilterTabs } from "@/components/ui/filter-tabs";

import { DischargeTab } from "@/components/Files/DischargeSummarySubTab";
import { DrawingPage } from "@/components/Files/DrawingSubTab";
import { FilesPage } from "@/components/Files/FileSubTab";

import { getPermissions } from "@/common/Permissions";

import { usePermissions } from "@/context/PermissionContext";
import {
  EncounterRead,
  inactiveEncounterStatus,
} from "@/types/emr/encounter/encounter";
import { PatientRead } from "@/types/emr/patient/patient";
import { FileType } from "@/types/files/file";
import { useState } from "react";

interface FilesTabsProps {
  type: FileType.ENCOUNTER | FileType.PATIENT;
  encounter?: EncounterRead;
  patient?: PatientRead;
  readOnly?: boolean;
}

const allowedTabs = ["all", "discharge_summary", "drawings"] as const;
type TabType = (typeof allowedTabs)[number];

export const FilesTab = ({
  patient,
  type,
  encounter,
  readOnly,
}: FilesTabsProps) => {
  const { hasPermission } = usePermissions();
  const { canWritePatient } = getPermissions(
    hasPermission,
    patient?.permissions ?? [],
  );
  const { canWriteEncounter } = getPermissions(
    hasPermission,
    encounter?.permissions ?? [],
  );

  const [activeTab, setActiveTab] = useState("search");

  const canWriteCurrentEncounter =
    canWriteEncounter &&
    encounter &&
    !inactiveEncounterStatus.includes(encounter.status);

  const canEdit =
    !readOnly &&
    (type === FileType.ENCOUNTER ? canWriteCurrentEncounter : canWritePatient);

  const associatingId =
    {
      patient: patient?.id,
      encounter: encounter?.id,
    }[type] || "";

  const tabOptions: { value: TabType; label: string }[] = [
    { value: "all", label: t("files") },
    ...(type === FileType.ENCOUNTER && encounter
      ? [
          {
            value: "discharge_summary" as TabType,
            label: t("discharge_summary"),
          },
        ]
      : []),
    { value: "drawings", label: t("drawings") },
  ];

  return (
    <div className="space-y-4">
      <FilterTabs
        value={allowedTabs.includes(activeTab as TabType) ? activeTab : "all"}
        onValueChange={setActiveTab}
        options={tabOptions.map((tab) => tab.value)}
        variant="background"
        showAllOption={false}
        maxVisibleTabs={3}
        showMoreDropdown={false}
      />

      {(activeTab === "all" || !allowedTabs.includes(activeTab as TabType)) && (
        <FilesPage
          type={type}
          encounter={encounter}
          patient={patient}
          associatingId={associatingId}
          canEdit={canEdit}
        />
      )}

      {activeTab === "discharge_summary" && encounter && (
        <DischargeTab type={type} encounter={encounter} canEdit={canEdit} />
      )}

      {activeTab === "drawings" && (
        <div>
          <DrawingPage
            type={type}
            {...(type === FileType.PATIENT
              ? { patientId: patient?.id }
              : { encounter: encounter })}
            readOnly={readOnly}
          />
        </div>
      )}
    </div>
  );
};
