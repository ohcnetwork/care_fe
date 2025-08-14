import { navigate } from "raviger";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { NavTabs } from "@/components/ui/nav-tabs";

import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";

import useAppHistory from "@/hooks/useAppHistory";
import useBreakpoints from "@/hooks/useBreakpoints";
import { useCareAppEncounterTabs } from "@/hooks/useCareApps";
import { useSidebarAutoCollapse } from "@/hooks/useSidebarAutoCollapse";

import { getPermissions } from "@/common/Permissions";

import { entriesOf } from "@/Utils/utils";
import { usePermissions } from "@/context/PermissionContext";
import { EncounterHeader } from "@/pages/Encounters/EncounterHeader";
import EncounterHistorySelector from "@/pages/Encounters/EncounterHistorySelector";
import { EncounterConsentsTab } from "@/pages/Encounters/tabs/consents";
import { EncounterDevicesTab } from "@/pages/Encounters/tabs/devices";
import { EncounterFilesTab } from "@/pages/Encounters/tabs/files";
import { EncounterMedicinesTab } from "@/pages/Encounters/tabs/medicines";
import { EncounterObservationsTab } from "@/pages/Encounters/tabs/observations";
import { EncounterOverviewTab } from "@/pages/Encounters/tabs/overview";
import { EncounterPlotsTab } from "@/pages/Encounters/tabs/plots";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import { EncounterRead } from "@/types/emr/encounter/encounter";
import { PatientRead } from "@/types/emr/patient/patient";

import { EncounterDiagnosticReportsTab } from "./tabs/diagnostic-reports";
import { EncounterNotesTab } from "./tabs/notes";
import { EncounterServiceRequestTab } from "./tabs/service-requests";

export interface PluginEncounterTabProps {
  encounter: EncounterRead;
  patient: PatientRead;
}

interface Props {
  tab?: string;
}

export const EncounterShow = (props: Props) => {
  const {
    facilityId,
    primaryEncounter,
    selectedEncounter,
    primaryEncounterId,
    selectedEncounterId,
    isPrimaryEncounterLoading,
    patient,
    isPatientLoading,
    canWriteSelectedEncounter,
  } = useEncounter();

  useSidebarAutoCollapse({ restore: false });

  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  const pluginTabs = useCareAppEncounterTabs();
  const { goBack } = useAppHistory();
  const showMoreAfterIndex = useBreakpoints({
    default: 2,
    xs: 2,
    sm: 6,
    xl: 9,
    "2xl": 12,
  });

  const { canViewEncounter } = getPermissions(
    hasPermission,
    primaryEncounter?.permissions ?? [],
  );

  const { canViewClinicalData } = getPermissions(
    hasPermission,
    patient?.permissions ?? [],
  );

  const canAccess = canViewClinicalData || canViewEncounter;

  useEffect(() => {
    if (!isPrimaryEncounterLoading && !isPatientLoading && !canAccess) {
      toast.error(t("permission_denied_encounter"));
      goBack("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPrimaryEncounterLoading, isPatientLoading]);

  if (
    isPrimaryEncounterLoading ||
    !primaryEncounter ||
    (!facilityId && !patient)
  ) {
    return <Loading />;
  }

  if (!patient) {
    return <Loading />;
  }

  const tabs = {
    updates: {
      label: t(`ENCOUNTER_TAB__updates`),
      component: <EncounterOverviewTab />,
    },
    plots: {
      label: t(`ENCOUNTER_TAB__plots`),
      component: <EncounterPlotsTab />,
    },
    observations: {
      label: t(`ENCOUNTER_TAB__observations`),
      component: <EncounterObservationsTab />,
    },
    medicines: {
      label: t(`ENCOUNTER_TAB__medicines`),
      component: <EncounterMedicinesTab />,
    },
    files: {
      label: t(`ENCOUNTER_TAB__files`),
      component: <EncounterFilesTab />,
    },
    notes: {
      label: t(`ENCOUNTER_TAB__notes`),
      component: <EncounterNotesTab />,
    },
    devices: {
      label: t(`ENCOUNTER_TAB__devices`),
      component: <EncounterDevicesTab />,
    },
    consents: {
      label: t(`ENCOUNTER_TAB__consents`),
      component: <EncounterConsentsTab />,
    },
    service_requests: {
      label: t(`ENCOUNTER_TAB__service_requests`),
      component: <EncounterServiceRequestTab />,
    },
    diagnostic_reports: {
      label: t(`ENCOUNTER_TAB__diagnostic_reports`),
      component: <EncounterDiagnosticReportsTab />,
    },

    ...Object.fromEntries(
      entriesOf(pluginTabs).map(([key, Component]) => [
        key,
        {
          label: t(`ENCOUNTER_TAB__${key}`),
          component: (
            <Component encounter={selectedEncounter!} patient={patient!} />
          ),
        },
      ]),
    ),
  } as const;

  if (!props.tab || !Object.keys(tabs).includes(props.tab)) {
    return <ErrorPage />;
  }

  return (
    <Page
      title={t("encounter")}
      className="block md:px-1 -mt-4"
      hideTitleOnPage
    >
      <EncounterHeader
        encounter={selectedEncounter}
        canWriteSelectedEncounter={canWriteSelectedEncounter}
      />
      <div className="flex flex-col gap-4 lg:gap-0 lg:flex-row mt-4">
        <EncounterHistorySelector />
        <NavTabs
          showMoreAfterIndex={showMoreAfterIndex}
          className="w-full"
          tabContentClassName="flex-none overflow-x-auto overflow-y-hidden lg:overflow-y-auto lg:h-[calc(100vh-12rem)]"
          tabs={tabs}
          currentTab={props.tab}
          tabTriggerClassName="max-w-36"
          onTabChange={(tab) =>
            navigate(tab, {
              query:
                primaryEncounterId !== selectedEncounterId
                  ? { selectedEncounter: selectedEncounterId }
                  : undefined,
            })
          }
        />
      </div>
    </Page>
  );
};
