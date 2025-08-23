import { t } from "i18next";
import { useQueryParams } from "raviger";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

interface FilesTabsProps {
  type: FileType.ENCOUNTER | FileType.PATIENT;
  encounter?: EncounterRead;
  patient?: PatientRead;
  readOnly?: boolean;
}

type QueryParams = {
  file: "all" | "discharge_summary" | "drawings";
};

const allowedTabs = ["all", "discharge_summary", "drawings"] as const;
type TabType = (typeof allowedTabs)[number];

export const FilesTab = ({
  patient,
  type,
  encounter,
  readOnly,
}: FilesTabsProps) => {
  const [qParams, setQParams] = useQueryParams<QueryParams>();

  const { hasPermission } = usePermissions();
  const { canWritePatient } = getPermissions(
    hasPermission,
    patient?.permissions ?? [],
  );
  const { canWriteEncounter } = getPermissions(
    hasPermission,
    encounter?.permissions ?? [],
  );

  const tabValue: TabType = allowedTabs.includes(qParams.file)
    ? qParams.file
    : "all";

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

  return (
    <div className="space-y-4">
      <Tabs
        value={tabValue}
        onValueChange={(value) => {
          setQParams({ file: value as TabType }, { overwrite: false });
        }}
      >
        <TabsList className={type != "encounter" ? "mt-2" : ""}>
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-white rounded-md px-4 font-semibold"
          >
            {t("files")}
          </TabsTrigger>
          {type === "encounter" && encounter && (
            <TabsTrigger
              value="discharge_summary"
              className="data-[state=active]:bg-white rounded-md px-4 font-semibold"
            >
              {t("discharge_summary")}
            </TabsTrigger>
          )}
          <TabsTrigger
            value="drawings"
            className="data-[state=active]:bg-white rounded-md px-4 font-semibold"
          >
            {t("drawings")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <FilesPage
            type={type}
            encounter={encounter}
            patient={patient}
            associatingId={associatingId}
            canEdit={canEdit}
          />
        </TabsContent>

        {type === "encounter" && encounter && (
          <TabsContent value="discharge_summary">
            <DischargeTab
              type={type}
              encounter={encounter}
              canEdit={canEdit}
              // facilityId={facilityId || ""}
            />
          </TabsContent>
        )}

        <TabsContent value="drawings">
          <div>
            <DrawingPage
              type={type}
              {...(type === FileType.PATIENT
                ? { patientId: patient?.id }
                : { encounter: encounter })}
              readOnly={readOnly}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
