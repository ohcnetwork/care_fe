import { t } from "i18next";
import { useQueryParams } from "raviger";

import { cn } from "@/lib/utils";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { DischargeTab } from "@/components/Files/DischargeSummarySubTab";
import { DrawingPage } from "@/components/Files/DrawingSubTab";
import { FilesPage } from "@/components/Files/FileSubTab";

import { getPermissions } from "@/common/Permissions";

import { usePermissions } from "@/context/PermissionContext";
import { Encounter, inactiveEncounterStatus } from "@/types/emr/encounter";
import { Patient } from "@/types/emr/patient";

interface FilesTabsProps {
  type: "encounter" | "patient";
  encounter?: Encounter;
  patient?: Patient;
  facilityId?: string;
}

type QueryParams = {
  file: "all" | "discharge_summary" | "drawings";
};

const allowedTabs = ["all", "discharge_summary", "drawings"] as const;
type TabType = (typeof allowedTabs)[number];

export const FilesTab = (props: FilesTabsProps) => {
  const { patient, type, encounter } = props;
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
    type === "encounter" ? canWriteCurrentEncounter : canWritePatient;

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
          setQParams({ file: value as TabType });
        }}
      >
        <TabsList
          className={cn(
            type != "encounter" && "mt-2",
            "flex-nowrap w-full pr-0.5 sm:w-fit",
          )}
        >
          <TabsTrigger
            value="all"
            className="flex-shrink-0 data-[state=active]:bg-white rounded-md font-semibold"
          >
            {t("files")}
          </TabsTrigger>
          {type === "encounter" && encounter && (
            <TabsTrigger
              value="discharge_summary"
              className="flex-shrink-0 data-[state=active]:bg-white rounded-md px-4 font-semibold"
            >
              {t("discharge_summary")}
            </TabsTrigger>
          )}
          <TabsTrigger
            value="drawings"
            className="flex-shrink-0 data-[state=active]:bg-white rounded-md px-4 font-semibold"
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
              type={props.type}
              {...(props.type === "patient"
                ? { patientId: props.patient?.id }
                : { encounter: props.encounter })}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
