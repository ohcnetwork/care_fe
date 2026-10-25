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
  Syringe,
} from "lucide-react";
import { useEffect, useState } from "react";

import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import { WorkspaceHeaderContent } from "@/components/Common/WorkspaceHeaderContent";
import { EncounterCommandDialog } from "@/components/Encounter/EncounterCommandDialog";
import { Card } from "@/components/ui/card";
import { useShortcutSubContext } from "@/context/ShortcutContext";
import { useCareAppTabs } from "@/hooks/useCareApps";
import { useSidebarAutoCollapse } from "@/hooks/useSidebarAutoCollapse";
import { cn } from "@/lib/utils";
import EncounterDetailsHeader from "@/pages/Encounters/EncounterDetailsHeader";
import { EncounterTab } from "@/pages/Encounters/EncounterNavigation";
import { EncounterConsentsTab } from "@/pages/Encounters/tabs/consents";
import { EncounterDevicesTab } from "@/pages/Encounters/tabs/devices";
import { EncounterFilesTab } from "@/pages/Encounters/tabs/files";
import { EncounterImmunizationsTab } from "@/pages/Encounters/tabs/immunizations";
import { EncounterMedicinesTab } from "@/pages/Encounters/tabs/medicines";
import { EncounterObservationsTab } from "@/pages/Encounters/tabs/observations";
import { EncounterOverviewTab } from "@/pages/Encounters/tabs/overview";
import { EncounterPlotsTab } from "@/pages/Encounters/tabs/plots";
import { EncounterResponsesTab } from "@/pages/Encounters/tabs/responses";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import { EncounterWorkspaceContent } from "@/pages/Encounters/workspace/EncounterWorkspaceContent";
import { EncounterWorkspaceSwitcher } from "@/pages/Encounters/workspace/EncounterWorkspaceSwitcher";
import { PLUGIN_Component } from "@/PluginEngine";
import { EncounterRead } from "@/types/emr/encounter/encounter";
import { PatientRead } from "@/types/emr/patient/patient";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import { entriesOf, goBack } from "@/Utils/utils";
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
    immunizations: {
      icon: Syringe,
      label: t(`ENCOUNTER_TAB__immunizations`),
      visible: canReadClinicalData,
      component: <EncounterImmunizationsTab />,
      shortcutId: "immunizations",
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

  return (
    <Page title={t("encounter")} className="block md:px-1" hideTitleOnPage>
      <WorkspaceHeaderContent>
        {/* The API returns an empty object when there is no appointment. */}
        {primaryEncounter.appointment?.id ? (
          <AppointmentEncounterHeader
            canWritePrimaryEncounter={canWritePrimaryEncounter}
            appointment={primaryEncounter.appointment}
            encounter={primaryEncounter}
          />
        ) : (
          <span className="text-sm font-medium">{t("encounter")}</span>
        )}
        <div className="ml-auto pl-2">
          <EncounterWorkspaceSwitcher systemTabs={tabs} />
        </div>
      </WorkspaceHeaderContent>

      <div className="flex flex-col gap-2">
        <Card className="grid gap-2 bg-white shadow-none border-gray-200 rounded-xl px-3 py-2 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
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
      <div className="mt-2 flex min-w-0 flex-col gap-2">
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

        <EncounterWorkspaceContent
          systemTabs={tabs}
          currentTab={props.tab ?? "updates"}
        />
      </div>
    </Page>
  );
};
