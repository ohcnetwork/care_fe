import {
  PatientDeceasedInfo,
  PatientHeader,
} from "@/components/Patient/PatientHeader";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  useEncounterShortcutDisplays,
  useEncounterShortcuts,
} from "@/hooks/useEncounterShortcuts";
import { format } from "date-fns";
import { useEffect, useState } from "react";

import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import { EncounterCommandDialog } from "@/components/Encounter/EncounterCommandDialog";
import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CommandShortcut } from "@/components/ui/command";
import { NavTabs } from "@/components/ui/nav-tabs";
import { Skeleton } from "@/components/ui/skeleton";
import useAppHistory from "@/hooks/useAppHistory";
import useBreakpoints from "@/hooks/useBreakpoints";
import { useCareAppEncounterTabs } from "@/hooks/useCareApps";
import { useSidebarAutoCollapse } from "@/hooks/useSidebarAutoCollapse";
import { cn } from "@/lib/utils";
import EncounterHistorySelector from "@/pages/Encounters/EncounterHistorySelector";
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
import {
  ENCOUNTER_STATUS_COLORS,
  EncounterRead,
} from "@/types/emr/encounter/encounter";
import { PatientRead } from "@/types/emr/patient/patient";
import { LocationTypeIcons } from "@/types/location/location";
import { entriesOf } from "@/Utils/utils";
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
    isPrimaryEncounterLoading,
    patientId,
    patient,
    isPatientLoading,
    canWritePrimaryEncounter,
    canReadClinicalData,
    canReadSelectedEncounter,
  } = useEncounter();

  useSidebarAutoCollapse();
  const [actionsOpen, setActionsOpen] = useState(false);
  const getShortcutDisplay = useEncounterShortcutDisplays();

  const { t } = useTranslation();
  const pluginTabs = useCareAppEncounterTabs();
  const { goBack } = useAppHistory();
  const showMoreAfterIndex = useBreakpoints({
    default: 2,
    xs: 2,
    sm: 6,
    xl: 9,
    "2xl": 12,
  });

  useEncounterShortcuts();

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

  const tabs = {
    updates: {
      label: t(`ENCOUNTER_TAB__updates`),
      component: <EncounterOverviewTab />,
    },
    plots: {
      label: t(`ENCOUNTER_TAB__plots`),
      visible: canReadClinicalData,
      component: <EncounterPlotsTab />,
    },
    observations: {
      label: t(`ENCOUNTER_TAB__observations`),
      visible: canReadClinicalData,
      component: <EncounterObservationsTab />,
    },
    medicines: {
      label: t(`ENCOUNTER_TAB__medicines`),
      visible: canReadClinicalData,
      component: <EncounterMedicinesTab />,
    },
    responses: {
      label: t(`ENCOUNTER_TAB__qnr_responses`),
      visible: canReadClinicalData,
      component: (
        <EncounterResponsesTab
          patientId={patientId}
          encounterId={selectedEncounterId}
          canAccess={canAccess}
        />
      ),
    },
    service_requests: {
      label: t(`ENCOUNTER_TAB__service_requests`),
      visible: canReadClinicalData,
      component: <EncounterServiceRequestTab />,
    },
    diagnostic_reports: {
      label: t(`ENCOUNTER_TAB__diagnostic_reports`),
      visible: canReadClinicalData,
      component: <EncounterDiagnosticReportsTab />,
    },
    files: {
      label: t(`ENCOUNTER_TAB__files`),
      visible: canReadClinicalData,
      component: <EncounterFilesTab />,
    },
    notes: {
      label: t(`ENCOUNTER_TAB__notes`),
      visible: canReadClinicalData,
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
      style={
        {
          "--encounter-header-offset": canViewAppointmentEncounterHeader
            ? "3rem"
            : "0rem",
        } as React.CSSProperties
      }
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
        <Card className="bg-white shadow-sm border-none rounded-sm p-2 md:p-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <PatientHeader
            patient={patient}
            facilityId={facilityId}
            className="flex-1 p-0 bg-transparent shadow-none"
          />
          {selectedEncounter && (
            <div className="flex max-md:flex-col items-end justify-center gap-4">
              <PLUGIN_Component
                __name="PatientInfoCardQuickActions"
                encounter={selectedEncounter}
                className={cn(
                  buttonVariants({ variant: "primary_gradient" }),
                  "text-base font-semibold rounded-md w-full",
                )}
              />

              <EncounterCommandDialog
                encounter={selectedEncounter}
                open={actionsOpen}
                onOpenChange={setActionsOpen}
                trigger={
                  <Button
                    variant="primary_gradient"
                    onClick={() => setActionsOpen(true)}
                    className="text-base font-semibold rounded-md w-full"
                  >
                    {t("encounter_actions")}
                    <CommandShortcut className="text-white hidden md:inline">
                      {getShortcutDisplay("open-command-dialog")}
                    </CommandShortcut>
                  </Button>
                }
              />
            </div>
          )}
        </Card>
        <PatientDeceasedInfo patient={patient} />
      </div>
      <div className="flex flex-col gap-4 lg:gap-0 lg:flex-row mt-4">
        <EncounterHistorySelector />
        <div className="w-full">
          <div className="hidden lg:block">
            {isSelectedEncounterLoading ? (
              <Skeleton className="h-10 w-md" />
            ) : (
              selectedEncounter && (
                <div className="flex gap-2 items-center">
                  <h4 className="font-bold">
                    {t(
                      `encounter_class__${selectedEncounter?.encounter_class}`,
                    )}
                  </h4>
                  <div className="text-sm text-gray-700 space-x-2">
                    {primaryEncounterId !== selectedEncounterId && (
                      <>
                        <span>{selectedEncounter?.facility.name}</span>
                        <span>|</span>
                      </>
                    )}

                    {selectedEncounter.current_location && (
                      <>
                        <span className="inline-flex items-center gap-1">
                          {(() => {
                            const LocationIcon =
                              LocationTypeIcons[
                                selectedEncounter.current_location.form
                              ];
                            return <LocationIcon className="size-3" />;
                          })()}
                          {selectedEncounter.current_location.name}
                        </span>
                        <span>|</span>
                      </>
                    )}

                    <span className="whitespace-nowrap">
                      {selectedEncounter.period.start && (
                        <span>
                          {format(
                            new Date(selectedEncounter.period.start!),
                            "dd MMM",
                          )}
                        </span>
                      )}
                      {selectedEncounter.period.end &&
                        selectedEncounter.period.start && <span>{" - "}</span>}
                      {selectedEncounter.period.end ? (
                        <span>
                          {format(
                            new Date(selectedEncounter.period.end),
                            "dd MMM",
                          )}
                        </span>
                      ) : (
                        <span>
                          {" - "}
                          {t("ongoing")}
                        </span>
                      )}
                    </span>
                  </div>

                  <Badge
                    variant={ENCOUNTER_STATUS_COLORS[selectedEncounter.status]}
                    size="sm"
                    className="whitespace-nowrap"
                  >
                    {t(`encounter_status__${selectedEncounter.status}`)}
                  </Badge>
                </div>
              )
            )}
          </div>

          <NavTabs
            showMoreAfterIndex={showMoreAfterIndex}
            className="@container w-full"
            tabContentClassName="flex-none overflow-x-auto overflow-y-hidden lg:overflow-y-auto lg:h-[calc(100vh-14rem-var(--encounter-header-offset))]"
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
      </div>
    </Page>
  );
};
