import { navigate } from "raviger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { NavTabs } from "@/components/ui/nav-tabs";

import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";

import useAppHistory from "@/hooks/useAppHistory";
import useBreakpoints from "@/hooks/useBreakpoints";
import { useCareAppEncounterTabs } from "@/hooks/useCareApps";
import {
  useEncounterShortcutDisplays,
  useEncounterShortcuts,
} from "@/hooks/useEncounterShortcuts";
import { useSidebarAutoCollapse } from "@/hooks/useSidebarAutoCollapse";

import { getPermissions } from "@/common/Permissions";

import { usePermissions } from "@/context/PermissionContext";
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
import { entriesOf } from "@/Utils/utils";

import { EncounterCommandDialog } from "@/components/Encounter/EncounterCommandDialog";
import { Button } from "@/components/ui/button";
import { CommandShortcut } from "@/components/ui/command";
import {
  SelectActionButton,
  SelectActionOption,
} from "@/components/ui/select-action-button";
import {
  PatientDeceasedInfo,
  PatientHeader,
} from "@/pages/Facility/services/serviceRequests/PatientHeader";
import { PLUGIN_Component } from "@/PluginEngine";
import batchApi from "@/types/base/batch/batchApi";
import encounterApi from "@/types/emr/encounter/encounterApi";
import { BatchSubmissionResult } from "@/types/questionnaire/batch";
import scheduleApi from "@/types/scheduling/scheduleApi";
import tokenApi from "@/types/tokens/token/tokenApi";
import mutate from "@/Utils/request/mutate";
import { NonEmptyArray } from "@/Utils/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  const [actionsOpen, setActionsOpen] = useState(false);
  const getShortcutDisplay = useEncounterShortcutDisplays();

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

  useEncounterShortcuts();
  const { canViewClinicalData } = getPermissions(
    hasPermission,
    patient?.permissions ?? [],
  );

  const canAccess = canViewClinicalData || canViewEncounter;
  const queryClient = useQueryClient();

  const { mutate: updateEncounter } = useMutation({
    mutationFn: mutate(encounterApi.update, {
      pathParams: { id: primaryEncounter?.id || "" },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["encounter", primaryEncounterId],
      });
    },
  });

  const batchRequest = useMutation({
    mutationFn: mutate(batchApi.batchRequest),
    onSuccess: (results: { results: BatchSubmissionResult[] }) => {
      queryClient.invalidateQueries({
        queryKey: ["encounter", primaryEncounterId],
      });
      queryClient.invalidateQueries({
        queryKey: ["appointment", primaryEncounter?.appointment?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["tokens", primaryEncounter?.appointment?.token?.id],
      });
      if (
        results.results.some(
          (result) => result.reference_id === "encounter-closed",
        )
      ) {
        toast.success(t("encounter_marked_as_complete"));
        return;
      }
      if (
        results.results.some(
          (result) => result.reference_id === "appointment-closed",
        )
      ) {
        toast.success(t("appointment_closed_successfully"));
      }
    },
  });

  const handleStartEncounter = (encounter: EncounterRead) => {
    updateEncounter({
      ...encounter,
      status: "in_progress",
      patient: encounter.patient.id,
      facility: encounter.facility.id,
    });
  };

  const handleCloseAppointment = (encounter: EncounterRead) => {
    if (!encounter || !encounter.appointment) return;

    const requests = [
      {
        url: scheduleApi.appointments.update.path
          .replace("{facilityId}", encounter.facility.id)
          .replace("{id}", encounter.appointment.id),
        method: scheduleApi.appointments.update.method,
        reference_id: "appointment-closed",
        body: {
          status: "fulfilled",
          note: encounter.appointment.note || "",
        },
      },
    ];

    if (encounter.appointment.token) {
      requests.push({
        url: tokenApi.update.path
          .replace("{facility_id}", encounter.facility.id)
          .replace("{queue_id}", encounter.appointment.token.queue.id)
          .replace("{id}", encounter.appointment.token.id),
        method: tokenApi.update.method,
        reference_id: "token-closed",
        body: {
          ...encounter.appointment.token,
          status: "FULFILLED",
        },
      });
    }

    batchRequest.mutate({ requests });
  };
  const handleCompleteEncounter = (encounter: EncounterRead) => {
    if (!encounter || !encounter.appointment) return;
    const requests = [
      {
        url: encounterApi.update.path.replace("{id}", encounter.id),
        method: encounterApi.update.method,
        reference_id: "encounter-closed",
        body: {
          ...encounter,
          patient: encounter.patient.id,
          facility: encounter.facility.id,
          status: "completed",
        },
      },
      {
        url: scheduleApi.appointments.update.path
          .replace("{facilityId}", encounter.facility.id)
          .replace("{id}", encounter.appointment?.id || ""),
        method: scheduleApi.appointments.update.method,
        reference_id: "appointment-closed",
        body: {
          status: "fulfilled",
          note: encounter.appointment.note || "",
        },
      },
    ];

    if (encounter.appointment.token) {
      requests.push({
        url: tokenApi.update.path
          .replace("{facility_id}", encounter.facility.id)
          .replace("{queue_id}", encounter.appointment.token.queue.id)
          .replace("{id}", encounter.appointment.token.id),
        method: tokenApi.update.method,
        reference_id: "token-closed",
        body: {
          ...encounter.appointment.token,
          status: "FULFILLED",
        },
      });
    }

    batchRequest.mutate({ requests });
  };

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

  const availableOptions: NonEmptyArray<SelectActionOption<string>> =
    primaryEncounter.appointment?.status === "fulfilled"
      ? [
          {
            value: "mark_as_complete",
            label: t("mark_as_complete"),
          },
        ]
      : [
          {
            value: "mark_as_complete",
            label: t("mark_as_complete"),
          },
          {
            value: "close_appointment",
            label: t("close_appointment"),
          },
        ];

  return (
    <Page
      title={t("encounter")}
      className="block md:px-1 -mt-4"
      hideTitleOnPage
    >
      {primaryEncounter && primaryEncounter.appointment?.id && (
        <div className="flex justify-between border border-gray-200 rounded-md p-2 bg-white w-full items-center mb-2">
          <span>
            {t("token_number")}:{" "}
            {primaryEncounter.appointment.token?.number || t("no_token")}
          </span>
          {primaryEncounter.status !== "in_progress" &&
          primaryEncounter.status !== "completed" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStartEncounter(primaryEncounter)}
            >
              {t("start_encounter")}
            </Button>
          ) : (
            <SelectActionButton
              options={availableOptions}
              onAction={(value) => {
                if (value === "mark_as_complete") {
                  handleCompleteEncounter(primaryEncounter);
                } else if (value === "close_appointment") {
                  handleCloseAppointment(primaryEncounter);
                }
              }}
              disabled={primaryEncounter.status === "completed"}
            />
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <PatientHeader
          patient={patient}
          facilityId={facilityId}
          className="bg-white shadow-sm border-none rounded-sm"
          actions={
            <>
              {canWriteSelectedEncounter && selectedEncounter && (
                <div className="flex flex-col items-end justify-center gap-4">
                  <PLUGIN_Component
                    __name="PatientInfoCardQuickActions"
                    encounter={selectedEncounter}
                    className="w-full lg:w-auto bg-primary-700 text-white hover:bg-primary-600"
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
            </>
          }
        />
        <PatientDeceasedInfo patient={patient} />
      </div>
      <div className="flex flex-col gap-4 lg:gap-0 lg:flex-row mt-4">
        <EncounterHistorySelector />
        <NavTabs
          showMoreAfterIndex={showMoreAfterIndex}
          className="@container w-full"
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
