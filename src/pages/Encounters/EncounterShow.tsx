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
  const showMoreAfterIndex = useBreakpoints({
    default: 1,
    xs: 2,
    sm: 6,
    xl: 9,
    "2xl": 12,
  });

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
    <Page title={t("encounter")} className="block" hideTitleOnPage>
      <EncounterHeader />
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-2 mt-4 sm:h-[calc(100vh-10rem)]">
        <EncounterHistorySelector />
        <NavTabs
          showMoreAfterIndex={showMoreAfterIndex}
          className="w-full overflow-x-auto"
          tabContentClassName="flex-none sm:h-[calc(100vh-14rem)] overflow-y-auto"
          tabs={tabs}
          currentTab={props.tab}
          tabTriggerClassName="max-w-36"
          onTabChange={(tab) =>
            navigate(tab, {
              query:
                currentEncounterId !== selectedEncounterId
                  ? { selectedEncounter: selectedEncounterId }
                  : undefined,
            })
          }
        />
      </div>
    </Page>
  );
};
