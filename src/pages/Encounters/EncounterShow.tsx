import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import PageHeadTitle from "@/components/Common/PageHeadTitle";
import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";
import PatientInfoCard from "@/components/Patient/PatientInfoCard";

import { useCareAppEncounterTabs } from "@/hooks/useCareApps";

import { getPermissions } from "@/common/Permissions";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { formatDateTime, keysOf } from "@/Utils/utils";
import { usePermissions } from "@/context/PermissionContext";
import { EncounterDevicesTab } from "@/pages/Encounters/tabs/EncounterDevicesTab";
import { EncounterFilesTab } from "@/pages/Encounters/tabs/EncounterFilesTab";
import { EncounterMedicinesTab } from "@/pages/Encounters/tabs/EncounterMedicinesTab";
import { EncounterOverviewTab } from "@/pages/Encounters/tabs/EncounterOverviewTab";
import { EncounterPlotsTab } from "@/pages/Encounters/tabs/EncounterPlotsTab";
import { Encounter, inactiveEncounterStatus } from "@/types/emr/encounter";
import { Patient } from "@/types/emr/newPatient";

import { EncounterDrawingsTab } from "./tabs/EncounterDrawingsTab";
import { EncounterNotesTab } from "./tabs/EncounterNotesTab";

export interface EncounterTabProps {
  encounter: Encounter;
  patient: Patient;
}

const defaultTabs = {
  updates: EncounterOverviewTab,
  plots: EncounterPlotsTab,
  medicines: EncounterMedicinesTab,
  files: EncounterFilesTab,
  notes: EncounterNotesTab,
  devices: EncounterDevicesTab,
  drawings: EncounterDrawingsTab,
  // nursing: EncounterNursingTab,
  // neurological_monitoring: EncounterNeurologicalMonitoringTab,
  // pressure_sore: EncounterPressureSoreTab,
} as Record<string, React.FC<EncounterTabProps>>;

interface Props {
  patientId: string;
  encounterId: string;
  facilityId?: string;
  tab?: string;
}

export const EncounterShow = (props: Props) => {
  const { encounterId, patientId, facilityId } = props;
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  const pluginTabs = useCareAppEncounterTabs();

  const tabs: Record<string, React.FC<EncounterTabProps>> = {
    ...defaultTabs,
    ...pluginTabs,
  };

  const { data: facilityData } = useQuery({
    queryKey: ["facility", facilityId],
    queryFn: query(routes.getPermittedFacility, {
      pathParams: { id: facilityId ?? "" },
    }),
    enabled: !!facilityId,
  });

  const { canListEncounters, canWriteEncounter } = getPermissions(
    hasPermission,
    facilityData?.permissions ?? [],
  );

  const { data: encounterData, isLoading } = useQuery({
    queryKey: ["encounter", encounterId],
    queryFn: query(routes.encounter.get, {
      pathParams: { id: encounterId },
      queryParams: facilityId
        ? {
            facility: facilityId,
          }
        : {
            patient: patientId,
          },
    }),
    enabled: !!encounterId && canListEncounters,
  });

  const canWrite =
    canWriteEncounter &&
    !inactiveEncounterStatus.includes(encounterData?.status ?? "");

  if (isLoading || !encounterData) {
    return <Loading />;
  }

  const encounterTabProps: EncounterTabProps = {
    encounter: encounterData,
    patient: encounterData.patient,
  };

  if (!props.tab) {
    return <ErrorPage />;
  }

  if (!encounterData) {
    return <ErrorPage />;
  }

  const SelectedTab = tabs[props.tab];

  const tabButtonClasses = (selected: boolean) =>
    `capitalize min-w-max-content cursor-pointer font-bold whitespace-nowrap ${
      selected === true
        ? "border-primary-500 hover:border-secondary-300 text-primary-600 border-b-2"
        : "text-secondary-700 hover:text-secondary-700"
    }`;

  return (
    <Page title={t("encounter")} className="block">
      <nav className="relative flex flex-wrap items-start justify-between mt-4">
        <div
          className="flex w-full flex-col min-[1150px]:w-min min-[1150px]:flex-row min-[1150px]:items-center"
          id="consultationpage-header"
        >
          {/* {!consultationData.discharge_date && (
            <>
              <button
                id="doctor-connect-button"
                onClick={() => {
                  triggerGoal("Doctor Connect Clicked", {
                    consultationId,
                    facilityId: patientData.facility,
                    userId: authUser.id,
                    page: "ConsultationDetails",
                  });
                  setShowDoctors(true);
                }}
                className="btn btn-primary m-1 w-full hover:text-white"
              >
                Doctor Connect
              </button>
              {patientData.last_consultation?.id &&
                isCameraAttached &&
                CameraFeedPermittedUserTypes.includes(authUser.user_type) && (
                  <Link
                    href={`/facility/${patientData.facility}/patient/${patientData.id}/consultation/${patientData.last_consultation?.id}/feed`}
                    className="btn btn-primary m-1 w-full hover:text-white"
                  >
                    Camera Feed
                  </Link>
                )}
            </>
          )} */}
        </div>
      </nav>
      <div className="mt-4 xl:mt-0 w-full border-b-2 border-secondary-200">
        <div className="mt-2 xl:mt-0 flex w-full flex-col md:flex-row">
          <div className="size-full rounded-lg border border-gray-200 bg-white text-black shadow-sm">
            <PatientInfoCard
              patient={encounterData.patient}
              encounter={encounterData}
              fetchPatientData={() => {}}
              canWrite={canWrite}
            />

            <div className="flex flex-col justify-between gap-2 px-4 py-1 md:flex-row">
              <div className="font-base flex flex-col text-xs leading-relaxed text-secondary-700 md:text-right">
                <div className="flex items-center">
                  <span className="text-secondary-900">
                    {t("last_modified")}:{" "}
                  </span>
                  &nbsp;
                  {formatDateTime(encounterData.modified_date)}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 w-full border-b-2 border-secondary-200">
          <div className="overflow-x-auto sm:flex sm:items-baseline">
            <div className="mt-4 sm:mt-0">
              <nav
                className="flex space-x-6 overflow-x-auto pb-2 pl-2"
                id="encounter_tab_nav"
              >
                {keysOf(tabs).map((tab) => (
                  <Link
                    key={tab}
                    data-cy={`tab-${tab}`}
                    className={tabButtonClasses(props.tab === tab)}
                    href={`${tab}`}
                  >
                    {t(`ENCOUNTER_TAB__${tab}`)}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <PageHeadTitle title={t(`ENCOUNTER_TAB__${props.tab}`)} />
          <SelectedTab {...encounterTabProps} />
        </div>
      </div>
    </Page>
  );
};
