import { Link } from "raviger";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import PageHeadTitle from "@/components/Common/PageHeadTitle";
import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";

import useAppHistory from "@/hooks/useAppHistory";
import { useCareAppEncounterTabs } from "@/hooks/useCareApps";
import { useSidebarAutoCollapse } from "@/hooks/useSidebarAutoCollapse";

import { getPermissions } from "@/common/Permissions";

import { usePermissions } from "@/context/PermissionContext";
import { EncounterHeader } from "@/pages/Encounters/EncounterHeader";
import EncounterHistorySelector from "@/pages/Encounters/EncounterHistorySelector";
import { EncounterConsentsTab } from "@/pages/Encounters/tabs/EncounterConsentsTab";
import { EncounterDevicesTab } from "@/pages/Encounters/tabs/EncounterDevicesTab";
import { EncounterFilesTab } from "@/pages/Encounters/tabs/EncounterFilesTab";
import { EncounterMedicinesTab } from "@/pages/Encounters/tabs/EncounterMedicinesTab";
import { EncounterObservationsTab } from "@/pages/Encounters/tabs/EncounterObservationsTab";
import { EncounterOverviewTab } from "@/pages/Encounters/tabs/EncounterOverviewTab";
import { EncounterPlotsTab } from "@/pages/Encounters/tabs/EncounterPlotsTab";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import { EncounterRead } from "@/types/emr/encounter/encounter";
import { PatientRead } from "@/types/emr/patient/patient";

import { EncounterDiagnosticReportsTab } from "./tabs/EncounterDiagnosticReportsTab";
import { EncounterNotesTab } from "./tabs/EncounterNotesTab";
import { EncounterServiceRequestTab } from "./tabs/EncounterServiceRequestTab";

export interface PluginEncounterTabProps {
  encounter: EncounterRead;
  patient: PatientRead;
}

const defaultTabs = {
  updates: EncounterOverviewTab,
  plots: EncounterPlotsTab,
  observations: EncounterObservationsTab,
  medicines: EncounterMedicinesTab,
  files: EncounterFilesTab,
  notes: EncounterNotesTab,
  devices: EncounterDevicesTab,
  consents: EncounterConsentsTab,
  service_requests: EncounterServiceRequestTab,
  diagnostic_reports: EncounterDiagnosticReportsTab,
} as const;

interface Props {
  tab?: string;
}

export const EncounterShow = (props: Props) => {
  const {
    facilityId,
    currentEncounter,
    selectedEncounter,
    currentEncounterId,
    selectedEncounterId,
    isCurrentEncounterLoading,
    patient,
    isPatientLoading,
  } = useEncounter();

  useSidebarAutoCollapse({ restore: false });

  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  const pluginTabs = useCareAppEncounterTabs();
  const { goBack } = useAppHistory();

  const availableTabs = [
    ...Object.keys(defaultTabs),
    ...Object.keys(pluginTabs),
  ];

  const { canViewEncounter } = getPermissions(
    hasPermission,
    currentEncounter?.permissions ?? [],
  );

  const { canViewClinicalData } = getPermissions(
    hasPermission,
    patient?.permissions ?? [],
  );

  const canAccess = canViewClinicalData || canViewEncounter;

  useEffect(() => {
    if (!isCurrentEncounterLoading && !isPatientLoading && !canAccess) {
      toast.error(t("permission_denied_encounter"));
      goBack("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCurrentEncounterLoading, isPatientLoading]);

  if (
    isCurrentEncounterLoading ||
    !currentEncounter ||
    (!facilityId && !patient)
  ) {
    return <Loading />;
  }

  if (!props.tab || !availableTabs.includes(props.tab)) {
    return <ErrorPage />;
  }

  if (!patient) {
    return <Loading />;
  }

  const CareTab = defaultTabs[props.tab as keyof typeof defaultTabs];
  const PluginTab = pluginTabs[props.tab as keyof typeof pluginTabs];

  return (
    <Page title={t("encounter")} className="block" hideTitleOnPage>
      <EncounterHeader />
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-2 mt-4 sm:h-[calc(100vh-10rem)]">
        <EncounterHistorySelector />
        <div className="w-full overflow-x-auto">
          <div className="w-full border-b-2 border-secondary-200 ">
            <div className="overflow-x-auto sm:flex sm:items-baseline">
              <div className="mt-4 sm:mt-0">
                <nav
                  className="flex space-x-6 overflow-x-auto pb-2 pl-2"
                  id="encounter_tab_nav"
                >
                  {availableTabs.map((tab) => (
                    <Link
                      key={tab}
                      data-cy={`tab-${tab}`}
                      className={cn(
                        "capitalize min-w-max-content cursor-pointer font-bold whitespace-nowrap",
                        props.tab === tab
                          ? "border-primary-500 hover:border-secondary-300 text-primary-600 border-b-2"
                          : "text-secondary-700 hover:text-secondary-700",
                      )}
                      href={
                        currentEncounterId === selectedEncounterId
                          ? `${tab}`
                          : `${tab}?selectedEncounter=${selectedEncounterId}`
                      }
                    >
                      {t(`ENCOUNTER_TAB__${tab}`)}
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
          </div>
          <div className="mt-4 sm:h-[calc(100vh-14rem)] sm:overflow-y-auto">
            <PageHeadTitle title={t(`ENCOUNTER_TAB__${props.tab}`)} />
            {CareTab && <CareTab />}
            {PluginTab &&
              (selectedEncounter ? (
                <PluginTab encounter={selectedEncounter} patient={patient} />
              ) : (
                <Loading />
              ))}
          </div>
        </div>
      </div>
    </Page>
  );
};
