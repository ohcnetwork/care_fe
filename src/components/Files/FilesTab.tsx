import { t } from "i18next";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { DischargeTab } from "@/components/Files/DischargeSummarySubTab";
import { DrawingPage } from "@/components/Files/DrawingSubTab";
import { FilesPage } from "@/components/Files/FileSubTab";

import useFilters from "@/hooks/useFilters";

import { getPermissions } from "@/common/Permissions";

import { usePermissions } from "@/context/PermissionContext";
import { Encounter, inactiveEncounterStatus } from "@/types/emr/encounter";
import { Patient } from "@/types/emr/newPatient";

interface FilesTabsProps {
  type: "encounter" | "patient";
  encounter?: Encounter;
  patient?: Patient;
}

export const FilesTab = (props: FilesTabsProps) => {
  const { patient, type, encounter } = props;
  const { qParams, updateQuery } = useFilters({
    limit: 14,
  });

  const { hasPermission } = usePermissions();
  const { canWritePatient } = getPermissions(
    hasPermission,
    patient?.permissions ?? [],
  );
  const { canWriteEncounter } = getPermissions(
    hasPermission,
    encounter?.permissions ?? [],
  );

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
        value={qParams.file || "all"}
        onValueChange={(value) =>
          updateQuery({
            file: value,
            is_archived: undefined,
            page: undefined,
            name: undefined,
          })
        }
      >
        <TabsList className={type != "encounter" ? "mt-2" : ""}>
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-white rounded-md px-4 font-semibold"
          >
            {t("files")}
          </TabsTrigger>
          {type === "encounter" && (
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
            qParams={qParams}
            updateQuery={updateQuery}
            associatingId={associatingId}
            canEdit={canEdit}
          />
        </TabsContent>

        {type === "encounter" && (
          <TabsContent value="discharge_summary">
            <DischargeTab
              type={type}
              encounterId={encounter?.id || ""}
              qParams={qParams}
              updateQuery={updateQuery}
              canEdit={canEdit}
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
              qParams={qParams}
              updateQuery={updateQuery}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
