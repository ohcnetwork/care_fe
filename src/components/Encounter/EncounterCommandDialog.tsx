import { CardListSkeleton } from "@/components/Common/SkeletonLoading";
import { appendReferralNativeContext } from "@/components/Referral/referralNativeNavigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import { useShortcutDisplay } from "@/context/ShortcutContext";
import {
  ArrowBigRight,
  Building2,
  CheckCircle2,
  Component,
  Edit,
  HistoryIcon,
  MapPin,
  NotebookPen,
  Pill,
  Plus,
  RotateCcw,
  Users,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { PLUGIN_Component } from "@/PluginEngine";
import query from "@/Utils/request/query";
import { useCareApps } from "@/hooks/useCareApps";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import { encounterRequiresDischarge } from "@/pages/Encounters/utils/useEncounterProgressController";
import { parseEncounterWorkspace } from "@/pages/Encounters/workspace/parseEncounterWorkspace";
import { useEncounterWorkspaces } from "@/pages/Encounters/workspace/useEncounterWorkspaces";
import { EncounterRead } from "@/types/emr/encounter/encounter";
import questionnaireApi from "@/types/questionnaire/questionnaireApi";
import { SYSTEM_PAGE_KEYS } from "@/types/workspace/encounterWorkspace";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "raviger";
import { useTranslation } from "react-i18next";

interface ActionItem {
  id: string;
  label: string;
  shortcut?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface ActionGroup {
  group: string;
  items: ActionItem[];
}

interface EncounterCommandDialogProps {
  encounter: EncounterRead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function EncounterCommandDialog({
  encounter,
  open,
  onOpenChange,
  trigger,
}: EncounterCommandDialogProps) {
  const {
    canWriteSelectedEncounter,
    canRestartSelectedEncounter,
    selectedEncounterPermissions,
    actions,
    selectedEncounterId,
    primaryEncounterId,
  } = useEncounter();
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { defaults, list, workspace } = useEncounterWorkspaces(
    encounter.encounter_class,
  );
  const canNavigateToReferrals =
    !defaults.isLoading &&
    !list.isLoading &&
    (!workspace ||
      parseEncounterWorkspace(workspace.template, SYSTEM_PAGE_KEYS).pages.some(
        (page) =>
          page.kind === "system" && page.key === "referrals" && !page.hidden,
      ));

  const { data: questionnaires, isLoading } = useQuery({
    queryKey: ["questionnaires", search, "encounter"],
    queryFn: query.debounced(questionnaireApi.list, {
      queryParams: {
        title: search,
        status: "active",
        subject_type: "encounter",
      },
    }),
  });

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        setSearch("");
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange],
  );

  const getShortcutDisplay = useShortcutDisplay();

  const STORAGE_KEY = "encounter-command-dialog-recent-actions";
  const MAX_RECENT_ACTIONS = 4;

  const getRecentActions = useCallback((): string[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT_ACTIONS) : [];
    }
    return [];
  }, []);

  const [recentActionsState, setRecentActionsState] =
    useState<string[]>(getRecentActions);

  // Build encounter URL helper
  const buildEncounterUrl = useCallback(
    (path: string) => {
      const currentEncounterIdToUse = primaryEncounterId || encounter.id;
      const baseUrl = `/facility/${encounter.facility.id}/patient/${encounter.patient.id}/encounter/${currentEncounterIdToUse}${path}`;

      // Add selectedEncounter parameter if we're viewing a different encounter
      if (
        selectedEncounterId &&
        primaryEncounterId &&
        selectedEncounterId !== primaryEncounterId
      ) {
        const separator = path.includes("?") ? "&" : "?";
        return appendReferralNativeContext(
          `${baseUrl}${separator}selectedEncounter=${selectedEncounterId}`,
          window.location.search,
        );
      }

      return appendReferralNativeContext(baseUrl, window.location.search);
    },
    [encounter, selectedEncounterId, primaryEncounterId],
  );

  // Handle action execution
  const handleAction = useCallback(
    (actionId: string) => {
      const actionHandlers: Record<string, () => void> = {
        "add-service-request": () =>
          navigate(buildEncounterUrl("/questionnaire/service_request")),
        "add-medication-request": () =>
          navigate(buildEncounterUrl("/questionnaire/medication_request")),
        "add-allergy": () =>
          navigate(buildEncounterUrl("/questionnaire/allergy_intolerance")),
        "add-symptoms": () =>
          navigate(buildEncounterUrl("/questionnaire/symptom")),
        "add-diagnosis": () =>
          navigate(buildEncounterUrl("/questionnaire/diagnosis")),
        "update-encounter": () =>
          navigate(buildEncounterUrl("/questionnaire/encounter")),
        "service-requests": () =>
          navigate(buildEncounterUrl("/service_requests")),
        "diagnostic-reports": () =>
          navigate(buildEncounterUrl("/diagnostic_reports")),
        "clinical-history": () =>
          navigate(
            `/facility/${encounter.facility.id}/patient/${encounter.patient.id}/history/responses?sourceUrl=${encodeURIComponent(
              buildEncounterUrl("/updates"),
            )}`,
          ),
        "encounter-overview": () => navigate(buildEncounterUrl("/updates")),
        plots: () => navigate(buildEncounterUrl("/plots")),
        observations: () => navigate(buildEncounterUrl("/observations")),
        medicines: () => navigate(buildEncounterUrl("/medicines")),
        immunizations: () => navigate(buildEncounterUrl("/immunizations")),
        responses: () => navigate(buildEncounterUrl("/responses")),
        files: () => navigate(buildEncounterUrl("/files")),
        referrals: () => navigate(buildEncounterUrl("/referrals")),
        notes: () => navigate(buildEncounterUrl("/notes")),
        devices: () => navigate(buildEncounterUrl("/devices")),
        consents: () => navigate(buildEncounterUrl("/consents")),
        "mark-as-completed": () => actions.markAsCompleted(),
        "mark-as-complete": () => actions.markAsCompleted(true),
        "assign-location": () => actions.assignLocation(),
        "view-location-history": () => actions.viewLocationHistory(),
        "manage-care-team": () => actions.manageCareTeam(),
        "manage-departments": () => actions.manageDepartments(),
        dispense: () => actions.dispense(),
        "restart-encounter": () => actions.restartEncounter(),
      };

      const handler = actionHandlers[actionId];
      if (handler) {
        handler();
        return;
      }

      // Handle dynamic questionnaire actions
      if (actionId.startsWith("questionnaire-")) {
        const questionnaireId = actionId.replace("questionnaire-", "");
        navigate(buildEncounterUrl(`/questionnaire/${questionnaireId}`));
      }
    },
    [navigate, buildEncounterUrl, actions, encounter],
  );

  const addRecentAction = useCallback(
    (actionId: string): void => {
      const currentRecent = getRecentActions();
      const filteredRecent = currentRecent.filter((id) => id !== actionId);
      const updatedRecent = [actionId, ...filteredRecent].slice(
        0,
        MAX_RECENT_ACTIONS,
      );

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRecent));
      setRecentActionsState(updatedRecent);
    },
    [getRecentActions],
  );

  const recentActions = recentActionsState;

  const baseEncounterActions: ActionGroup[] = useMemo(() => {
    const groups: ActionGroup[] = [];

    // Write actions - only show when user has write permission
    if (canWriteSelectedEncounter) {
      groups.push({
        group: t("encounter_actions"),
        items: [
          {
            id: "add-allergy",
            label: t("add_allergy_one"),
            shortcut: getShortcutDisplay("add-allergy"),
            icon: <Plus />,
          },
          {
            id: "add-symptoms",
            label: t("add_symptom"),
            shortcut: getShortcutDisplay("add-symptoms"),
            icon: <Plus />,
          },
          {
            id: "add-diagnosis",
            label: t("add_diagnosis"),
            shortcut: getShortcutDisplay("add-diagnosis"),
            icon: <Plus />,
          },
          {
            id: "add-service-request",
            label: t("service_request"),
            shortcut: getShortcutDisplay("add-service-request"),
            icon: <Plus />,
          },
          {
            id: "add-medication-request",
            label: t("add_medication"),
            shortcut: getShortcutDisplay("add-medication-request"),
            icon: <Plus />,
          },
          {
            id: "update-encounter",
            label: t("update_encounter_details"),
            shortcut: getShortcutDisplay("update-encounter"),
            icon: <Edit />,
          },
        ],
      });
    }

    // Actions group - different items based on encounter status
    const actionItems: ActionItem[] = [
      {
        id: "clinical-history",
        label: t("see_clinical_history"),
        shortcut: getShortcutDisplay("clinical-history"),
        icon: <Component />,
      },
      {
        id: "view-location-history",
        label: t("location_history"),
        shortcut: getShortcutDisplay("view-location-history"),
        icon: <HistoryIcon />,
      },
    ];

    // Add write actions only when user has write permission
    if (canWriteSelectedEncounter) {
      actionItems.push(
        {
          id: "consents",
          label: t("manage_consents"),
          shortcut: getShortcutDisplay("consents"),
          icon: <NotebookPen />,
        },
        {
          id: "mark-as-completed",
          label: encounterRequiresDischarge(encounter)
            ? t("mark_for_discharge")
            : t("mark_as_completed"),
          icon: <CheckCircle2 />,
        },
        {
          id: "assign-location",
          label: t("assign_location"),
          shortcut: getShortcutDisplay("assign-location"),
          icon: <MapPin />,
        },
        {
          id: "manage-care-team",
          label: t("manage_care_team"),
          shortcut: getShortcutDisplay("manage-care-team"),
          icon: <Users />,
        },
        {
          id: "manage-departments",
          label: t("update_department"),
          shortcut: getShortcutDisplay("manage-departments"),
          icon: <Building2 />,
        },
        {
          id: "dispense",
          label: t("dispense"),
          shortcut: getShortcutDisplay("dispense"),
          icon: <Pill />,
        },
      );
    }

    // Add restart action only when user can restart
    if (canRestartSelectedEncounter) {
      actionItems.push({
        id: "restart-encounter",
        label: t("restart_encounter"),
        shortcut: getShortcutDisplay("restart-encounter"),
        icon: <RotateCcw />,
      });
    }

    groups.push({
      group: t("actions"),
      items: actionItems,
    });

    if (
      canNavigateToReferrals &&
      (selectedEncounterPermissions.canReadReferral ||
        selectedEncounterPermissions.canCreateReferral)
    ) {
      actionItems.push({
        id: "referrals",
        label: t("referrals"),
        icon: <ArrowBigRight />,
      });
    }

    // Go to navigation - always available
    groups.push({
      group: t("go_to"),
      items: [
        {
          id: "encounter-overview",
          label: t("ENCOUNTER_TAB__updates"),
          shortcut: getShortcutDisplay("encounter-overview"),
          icon: <ArrowBigRight />,
        },
        {
          id: "plots",
          label: t("ENCOUNTER_TAB__plots"),
          shortcut: getShortcutDisplay("plots"),
          icon: <ArrowBigRight />,
        },
        {
          id: "observations",
          label: t("observations"),
          shortcut: getShortcutDisplay("observations"),
          icon: <ArrowBigRight />,
        },
        {
          id: "medicines",
          label: t("medicines"),
          shortcut: getShortcutDisplay("medicines"),
          icon: <ArrowBigRight />,
        },
        {
          id: "immunizations",
          label: t("immunizations"),
          shortcut: getShortcutDisplay("immunizations"),
          icon: <ArrowBigRight />,
        },
        {
          id: "responses",
          label: t("responses"),
          shortcut: getShortcutDisplay("responses"),
          icon: <ArrowBigRight />,
        },
        {
          id: "files",
          label: t("files"),
          shortcut: getShortcutDisplay("files"),
          icon: <ArrowBigRight />,
        },
        {
          id: "notes",
          label: t("notes"),
          shortcut: getShortcutDisplay("notes"),
          icon: <ArrowBigRight />,
        },
        {
          id: "devices",
          label: t("devices"),
          shortcut: getShortcutDisplay("devices"),
          icon: <ArrowBigRight />,
        },
        {
          id: "consents",
          label: t("consents"),
          shortcut: getShortcutDisplay("consents"),
          icon: <ArrowBigRight />,
        },
        {
          id: "service-requests",
          label: t("service_requests"),
          shortcut: getShortcutDisplay("service-requests"),
          icon: <ArrowBigRight />,
        },
        {
          id: "diagnostic-reports",
          label: t("ENCOUNTER_TAB__diagnostic_reports"),
          shortcut: getShortcutDisplay("diagnostic-reports"),
          icon: <ArrowBigRight />,
        },
      ],
    });

    // Questionnaires - only show when user has write permission
    if (canWriteSelectedEncounter) {
      groups.push({
        group: t("questionnaire"),
        items: [
          ...(questionnaires?.results || []).map((option) => ({
            id: `questionnaire-${option.id}`,
            label: option.title,
            icon: <NotebookPen />,
            shortcut: getShortcutDisplay(`questionnaire-${option.id}`),
          })),
        ],
      });
    }

    return groups;
  }, [
    t,
    questionnaires,
    getShortcutDisplay,
    canWriteSelectedEncounter,
    canRestartSelectedEncounter,
    canNavigateToReferrals,
    encounter,
    selectedEncounterPermissions.canReadReferral,
    selectedEncounterPermissions.canCreateReferral,
  ]);

  const findRecentActions = useCallback(
    (actionIds: string[], groups: ActionGroup[]) => {
      const allActions = groups.flatMap((group) => group.items);
      return actionIds
        .map((id) => allActions.find((action) => action.id === id))
        .filter((action): action is ActionItem => action !== undefined);
    },
    [],
  );

  const encounterActions: ActionGroup[] = useMemo(() => {
    if (!recentActions.length) return baseEncounterActions;

    const recentlyUsedActions = findRecentActions(
      recentActions,
      baseEncounterActions,
    );
    if (!recentlyUsedActions.length) return baseEncounterActions;

    const recentlyUsedGroup: ActionGroup = {
      group: t("recently_used"),
      items: recentlyUsedActions,
    };

    return [recentlyUsedGroup, ...baseEncounterActions];
  }, [baseEncounterActions, recentActions, findRecentActions, t]);

  const handleSelect = useCallback(
    (actionId: string) => {
      addRecentAction(actionId);
      handleAction(actionId);
      handleOpenChange(false);
    },
    [handleAction, handleOpenChange, addRecentAction],
  );

  const careApps = useCareApps();

  return (
    <>
      {trigger}
      <CommandDialog
        open={open}
        onOpenChange={handleOpenChange}
        className="md:max-w-2xl"
      >
        <div>
          <CommandInput
            placeholder={t("search_encounter_command")}
            className="text-base border-none focus:ring-0 sm:text-sm"
            onValueChange={setSearch}
          />
        </div>
        <CommandList className="w-full md:max-h-[min(24rem,calc(75dvh-8rem))]">
          <CommandEmpty>
            {isLoading && search.length > 0 ? (
              <div className="space-y-2">
                <CardListSkeleton count={3} />
              </div>
            ) : (
              t("no_results")
            )}
          </CommandEmpty>
          {encounterActions.map((group) => (
            <div key={group.group}>
              <CommandGroup heading={group.group} className="px-2">
                {group.items.map((action) => (
                  <CommandItem
                    key={`${group.group}-${action.id}`}
                    value={`${group.group} ${action.id} ${action.label}`}
                    onSelect={() => handleSelect(action.id)}
                    className="flex justify-between rounded-sm cursor-pointer hover:bg-soft-background aria-selected:bg-muted"
                    autoFocus={false}
                    disabled={action.disabled}
                  >
                    {action.icon}
                    <span className="flex-1">{action.label}</span>
                    {action.shortcut && (
                      <CommandShortcut className="ml-2 tracking-normal">
                        <Kbd>{action.shortcut}</Kbd>
                      </CommandShortcut>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </div>
          ))}
          {careApps.some(
            (plugin) =>
              !plugin.isLoading && plugin.components?.EncounterActions,
          ) && (
            <CommandGroup heading={t("plugin_actions")} className="px-0">
              <PLUGIN_Component
                __name="EncounterActions"
                encounter={encounter}
                className="flex w-full p-2 text-muted-foreground rounded-md cursor-pointer hover:bg-soft-background justify-baseline aria-selected:bg-muted"
              />
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
