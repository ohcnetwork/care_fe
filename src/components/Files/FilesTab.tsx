import { t } from "i18next";
import { useQueryParams } from "raviger";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { FilesPage } from "@/components/Files/FileSubTab";

import { getPermissions } from "@/common/Permissions";

import { usePermissions } from "@/context/PermissionContext";
import { useCareAppsEncounterFileTabs } from "@/hooks/useCareApps";
import {
  EncounterRead,
  inactiveEncounterStatus,
} from "@/types/emr/encounter/encounter";
import { PatientRead } from "@/types/emr/patient/patient";
import { ReportType } from "@/types/emr/report/report";
import { FileType } from "@/types/files/file";
import { Suspense } from "react";
import { ReportSubTab } from "./ReportSubTab";

export interface FilesTabsProps {
  type: FileType.ENCOUNTER | FileType.PATIENT;
  encounter?: EncounterRead;
  patient?: PatientRead;
  readOnly?: boolean;
}

export const FilesTab = ({
  patient,
  type,
  encounter,
  readOnly,
}: FilesTabsProps) => {
  const [qParams, setQParams] = useQueryParams();

  const { hasPermission } = usePermissions();
  const { canWritePatient } = getPermissions(
    hasPermission,
    patient?.permissions ?? [],
  );
  const { canWriteEncounter } = getPermissions(
    hasPermission,
    encounter?.permissions ?? [],
  );

  const pluginTabs = useCareAppsEncounterFileTabs();

  const allowedTabs = ["all", "reports", ...Object.keys(pluginTabs)];
  const tabValue = allowedTabs.includes(qParams.file) ? qParams.file : "all";

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
          setQParams({ file: value }, { overwrite: false });
        }}
      >
        <TabsList className={type != "encounter" ? "mt-2" : ""}>
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-white rounded-md px-4 font-semibold"
          >
            {t("files")}
          </TabsTrigger>
          <TabsTrigger
            value="reports"
            className="data-[state=active]:bg-white rounded-md px-4 font-semibold"
          >
            {t("reports")}
          </TabsTrigger>
          {Object.keys(pluginTabs).map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="data-[state=active]:bg-white rounded-md px-4 font-semibold capitalize"
            >
              {t(tab)}
            </TabsTrigger>
          ))}
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

        <TabsContent value="reports">
          <ReportSubTab
            associatingId={associatingId}
            reportType={
              type === FileType.PATIENT
                ? ReportType.PATIENT_SUMMARY
                : ReportType.DISCHARGE_SUMMARY
            }
            facilityId={encounter?.facility?.id}
            patientId={patient?.id}
            encounterId={encounter?.id}
          />
        </TabsContent>

        {Object.entries(pluginTabs).map(([pluginName, Component]) => {
          return (
            <TabsContent key={pluginName} value={pluginName}>
              <Suspense>
                <Component
                  type={type}
                  patient={patient}
                  encounter={encounter}
                  readOnly={readOnly}
                />
              </Suspense>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};
