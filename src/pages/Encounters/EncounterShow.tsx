import {
  PatientDeceasedInfo,
  PatientHeader,
} from "@/components/Patient/PatientHeader";
import { PatientTagsDisplay } from "@/components/Patient/PatientTagsDisplay";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Blocks,
  ChartLine,
  Eye,
  File,
  FileCheck,
  FileText,
  Folder,
  ListChecks,
  MessageCircle,
  Monitor,
  PanelsTopLeft,
  Pill,
} from "lucide-react";
import { useEffect, useState } from "react";

import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import { EncounterCommandDialog } from "@/components/Encounter/EncounterCommandDialog";
import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";
import { Card } from "@/components/ui/card";
import { useShortcutSubContext } from "@/context/ShortcutContext";
import { useCareAppTabs } from "@/hooks/useCareApps";
import { useSidebarAutoCollapse } from "@/hooks/useSidebarAutoCollapse";
import { cn } from "@/lib/utils";
import EncounterDetailsHeader from "@/pages/Encounters/EncounterDetailsHeader";
import EncounterNavigation, {
  EncounterTab,
} from "@/pages/Encounters/EncounterNavigation";
import { EncounterConsentsTab } from "@/pages/Encounters/tabs/consents";
import { EncounterDevicesTab } from "@/pages/Encounters/tabs/devices";
import { EncounterFilesTab } from "@/pages/Encounters/tabs/files";
import { EncounterMedicinesTab } from "@/pages/Encounters/tabs/medicines";
import { EncounterObservationsTab } from "@/pages/Encounters/tabs/observations";
import { EncounterOverviewTab } from "@/pages/Encounters/tabs/overview";
import { EncounterPlotsTab } from "@/pages/Encounters/tabs/plots";
import { EncounterResponsesTab } from "@/pages/Encounters/tabs/responses";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import { PLUGIN_Component } from "@/PluginEngine";
import { EncounterRead } from "@/types/emr/encounter/encounter";
import { PatientRead } from "@/types/emr/patient/patient";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import { entriesOf, goBack } from "@/Utils/utils";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AppointmentEncounterHeader } from "./AppointmentEncounterHeader";
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
    isSelectedEncounterLoading,
    primaryEncounterId,
    selectedEncounterId,
    setSelectedEncounter,
    isPrimaryEncounterLoading,
    patientId,
    patient,
    isPatientLoading,
    canWritePrimaryEncounter,
    canWriteSelectedEncounter,
    canReadClinicalData,
    canReadSelectedEncounter,
  } = useEncounter();

  useSidebarAutoCollapse();
  const [actionsOpen, setActionsOpen] = useState(false);
  useShortcutSubContext("encounter");

  const { t } = useTranslation();
  const pluginTabs = useCareAppTabs<PluginEncounterTabProps>("encounterTabs");

  const canAccess = canReadClinicalData || canReadSelectedEncounter;
  const hasToken = primaryEncounter?.appointment?.token;
  // const isEncounterActive =
  //   primaryEncounter?.appointment?.id &&
  //   !inactiveEncounterStatus.includes(primaryEncounter?.status ?? "");

  const hasAppointmentId = primaryEncounter?.appointment?.id;

  // Header is shown either when token is present or encounter is active and has an appointment
  const canViewAppointmentEncounterHeader = hasToken || hasAppointmentId;

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

  const tabs: Record<string, EncounterTab> = {
    updates: {
      icon: PanelsTopLeft,
      label: t(`ENCOUNTER_TAB__updates`),
      component: <EncounterOverviewTab />,
      hideTitle: true,
      shortcutId: "encounter-overview",
    },
    responses: {
      icon: MessageCircle,
      label: t(`ENCOUNTER_TAB__qnr_responses`),
      visible: canReadClinicalData,
      component: (
        <EncounterResponsesTab
          patientId={patientId}
          encounterId={selectedEncounterId}
          canAccess={canAccess}
        />
      ),
      shortcutId: "responses",
    },
    observations: {
      icon: Eye,
      label: t(`ENCOUNTER_TAB__observations`),
      visible: canReadClinicalData,
      component: <EncounterObservationsTab />,
      shortcutId: "observations",
    },
    medicines: {
      icon: Pill,
      label: t("medications"),
      visible: canReadClinicalData,
      component: <EncounterMedicinesTab />,
      shortcutId: "medicines",
    },
    service_requests: {
      icon: ListChecks,
      label: t(`ENCOUNTER_TAB__service_requests`),
      visible: canReadClinicalData,
      component: <EncounterServiceRequestTab />,
      shortcutId: "service-requests",
    },
    diagnostic_reports: {
      icon: FileText,
      label: t(`ENCOUNTER_TAB__diagnostic_reports`),
      visible: canReadClinicalData,
      component: <EncounterDiagnosticReportsTab />,
      shortcutId: "diagnostic-reports",
    },
    plots: {
      icon: ChartLine,
      label: t(`ENCOUNTER_TAB__plots`),
      visible: canReadClinicalData,
      component: <EncounterPlotsTab />,
      shortcutId: "plots",
    },
    files: {
      icon: Folder,
      label: t(`ENCOUNTER_TAB__files`),
      visible: canReadClinicalData,
      component: <EncounterFilesTab />,
      shortcutId: "files",
    },
    notes: {
      icon: File,
      label: t(`ENCOUNTER_TAB__notes`),
      visible: canReadClinicalData,
      component: <EncounterNotesTab />,
      shortcutId: "notes",
    },
    devices: {
      icon: Monitor,
      label: t(`ENCOUNTER_TAB__devices`),
      component: <EncounterDevicesTab />,
      shortcutId: "devices",
    },
    consents: {
      icon: FileCheck,
      label: t(`ENCOUNTER_TAB__consents`),
      component: <EncounterConsentsTab />,
      shortcutId: "consents",
    },

    ...Object.fromEntries(
      entriesOf(pluginTabs).map(([key, Component]) => [
        key,
        {
          label: t(`ENCOUNTER_TAB__${key}`),
          icon: Blocks,
          component: (
            <Component encounter={selectedEncounter!} patient={patient!} />
          ),
        },
      ]),
    ),
  };

  if (!props.tab || !Object.keys(tabs).includes(props.tab)) {
    return <ErrorPage />;
  }

  return (
    <Page
      title={t("encounter")}
      className="block md:px-1 -mt-4"
      hideTitleOnPage
    >
      {primaryEncounter.appointment && canViewAppointmentEncounterHeader && (
        <div className="flex items-center justify-center -mt-2 mb-2">
          <AppointmentEncounterHeader
            canWritePrimaryEncounter={canWritePrimaryEncounter}
            appointment={primaryEncounter.appointment}
            encounter={primaryEncounter}
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Card className="grid gap-3 bg-white shadow-none border-gray-200 rounded-xl px-3 py-3 md:px-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <PatientHeader
            patient={patient}
            variant="encounter"
            facilityId={facilityId}
            className="p-0 bg-transparent shadow-none"
          />
          {selectedEncounter && (
            <div className="order-3 flex flex-wrap items-center justify-end gap-2 lg:order-2">
              <div className="w-full md:w-auto">
                <PLUGIN_Component
                  __name="PatientInfoCardQuickActions"
                  encounter={selectedEncounter}
                  className={cn(
                    buttonVariants({ variant: "primary_gradient" }),
                    "text-base font-semibold rounded-md w-full md:w-auto",
                  )}
                />
              </div>

              <EncounterCommandDialog
                encounter={selectedEncounter}
                open={actionsOpen}
                onOpenChange={setActionsOpen}
                trigger={
                  <Button
                    variant="primary_gradient"
                    onClick={() => setActionsOpen(true)}
                    className="h-9 px-3 text-sm font-medium rounded-lg w-full md:w-auto shadow-none"
                  >
                    {t("encounter_actions")}
                    <ShortcutBadge
                      actionId="open-command-dialog"
                      className="shrink-0"
                      alwaysShow={false}
                    />
                  </Button>
                }
              />
            </div>
          )}
          <PatientTagsDisplay
            patient={patient}
            className="order-2 min-w-0 flex-row flex-wrap items-baseline gap-x-2 gap-y-1 lg:order-3 lg:col-span-2 [&>span]:shrink-0 [&>span]:text-xs [&>span]:font-normal [&>span]:text-gray-500 [&>div]:min-w-0 [&>div]:flex-1 [&>div]:gap-1.5 [&_[data-slot=badge]]:max-w-full [&_[data-slot=badge]]:whitespace-normal [&_[data-slot=badge]]:wrap-anywhere"
          />
        </Card>
        <PatientDeceasedInfo patient={patient} />
      </div>
      <div className="mt-4 flex min-w-0 flex-col gap-4">
        <EncounterDetailsHeader
          encounter={selectedEncounter}
          currentFacilityId={facilityId}
          isLoading={isSelectedEncounterLoading}
          isHistorical={selectedEncounterId !== primaryEncounterId}
          onReturnToCurrent={() => setSelectedEncounter(null)}
          editUrl={
            canWriteSelectedEncounter && facilityId
              ? `/facility/${facilityId}/patient/${patientId}/encounter/${selectedEncounterId}/questionnaire/encounter`
              : undefined
          }
        />

        <EncounterNavigation
          tabs={tabs}
          currentTab={props.tab}
          onTabChange={(tab) => {
            const query =
              primaryEncounterId !== selectedEncounterId
                ? { selectedEncounter: selectedEncounterId }
                : undefined;
            const target = new URL(tab, window.location.href);
            target.search = new URLSearchParams(query).toString();
            // Radix activation and shortcut clicks can request the same tab.
            // Check the live URL so a single selection only adds one history entry.
            if (target.href === window.location.href) {
              return;
            }
            navigate(tab, { query });
          }}
        />
      </div>
    </Page>
  );
};
