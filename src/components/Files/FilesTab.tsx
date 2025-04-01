import { t } from "i18next";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { DrawingPage } from "@/components/Common/Drawings/DrawingPage";
import { DischargeTab } from "@/components/Files/DischargeSummary";
import { FilesPage } from "@/components/Files/FilesPage";

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
  const { canWritePatient, canWriteEncounter } = getPermissions(
    hasPermission,
    encounter?.permissions ?? patient?.permissions ?? [],
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
          })
        }
      >
        <TabsList className="bg-gray-200 py-0 w-fit mt-2 ml-3">
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
            <span className="text-lg font-bold ml-3">{t("drawings")}</span>
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
