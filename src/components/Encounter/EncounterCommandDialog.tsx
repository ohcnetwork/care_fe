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
import {
  useEncounterShortcutDisplays,
  useEncounterShortcuts,
} from "@/hooks/useEncounterShortcuts";
import {
  ArrowBigRight,
  Building2,
  CheckCircle2,
  Component,
  Edit,
  FileText,
  HistoryIcon,
  MapPin,
  NotebookPen,
  Pill,
  Plus,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { PLUGIN_Component } from "@/PluginEngine";
import { useCareApps } from "@/hooks/useCareApps";
import useQuestionnaireOptions from "@/hooks/useQuestionnaireOptions";
import { EncounterRead } from "@/types/emr/encounter/encounter";
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
  const { t } = useTranslation();
  const questionnaireOptions = useQuestionnaireOptions("encounter_actions");
  const getShortcutDisplay = useEncounterShortcutDisplays();
  const { handleAction } = useEncounterShortcuts();

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

  // Handle keyboard shortcut to open command dialog
  useEffect(() => {
    const handleOpenCommandDialog = () => {
      onOpenChange(true);
    };

    document.addEventListener(
      "open-encounter-command-dialog",
      handleOpenCommandDialog,
    );

    return () => {
      document.removeEventListener(
        "open-encounter-command-dialog",
        handleOpenCommandDialog,
      );
    };
  }, [onOpenChange]);

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

  const baseEncounterActions: ActionGroup[] = useMemo(
    () => [
      {
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
            id: "add-questionnaire",
            label: t("add_form"),
            shortcut: getShortcutDisplay("add-questionnaire"),
            icon: <Plus />,
          },
          {
            id: "update-encounter",
            label: t("update_encounter_details"),
            shortcut: getShortcutDisplay("update-encounter"),
            icon: <Edit />,
          },
        ],
      },
      {
        group: t("actions"),
        items: [
          {
            id: "clinical-history",
            label: t("see_clinical_history"),
            shortcut: getShortcutDisplay("clinical-history"),
            icon: <Component />,
          },
          {
            id: "consents",
            label: t("manage_consents"),
            shortcut: getShortcutDisplay("consents"),
            icon: <NotebookPen />,
          },
          {
            id: "mark-as-completed",
            label: t("mark_as_completed"),
            shortcut: getShortcutDisplay("mark-as-completed"),
            icon: <CheckCircle2 />,
          },
          {
            id: "assign-location",
            label: t("assign_location"),
            shortcut: getShortcutDisplay("assign-location"),
            icon: <MapPin />,
          },
          {
            id: "view-location-history",
            label: t("location_history"),
            shortcut: getShortcutDisplay("view-location-history"),
            icon: <HistoryIcon />,
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
            id: "dispense-medicine",
            label: t("dispense_medicine"),
            shortcut: getShortcutDisplay("dispense-medicine"),
            icon: <Pill />,
          },
        ],
      },
      {
        group: t("available_reports"),
        items: [
          {
            id: "treatment-summary",
            label: t("treatment_summary"),
            shortcut: getShortcutDisplay("treatment-summary"),
            icon: <FileText />,
          },
          {
            id: "discharge-summary",
            label: t("discharge_summary"),
            shortcut: getShortcutDisplay("discharge-summary"),
            icon: <FileText />,
          },
        ],
      },
      {
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
      },
      {
        group: t("questionnaire"),
        items: [
          ...(questionnaireOptions?.results || []).map((option) => ({
            id: `questionnaire-${option.slug}`,
            label: option.title,
            icon: <NotebookPen />,
            shortcut: getShortcutDisplay(`questionnaire-${option.slug}`),
          })),
        ],
      },
    ],
    [t, questionnaireOptions, getShortcutDisplay],
  );

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
      onOpenChange(false);
    },
    [handleAction, onOpenChange, addRecentAction],
  );

  return (
    <>
      {trigger}
      <CommandDialog
        open={open}
        onOpenChange={onOpenChange}
        className="md:max-w-2xl"
      >
        <div className="border-b border-gray-100 shadow-xs">
          <CommandInput
            placeholder={t("search_encounter_command")}
            className="border-none focus:ring-0"
          />
        </div>
        <CommandList className="h-[80vh] max-h-[80vh] w-full">
          <CommandEmpty>{t("no_results")}</CommandEmpty>
          {encounterActions.map((group) => (
            <div key={group.group}>
              <CommandGroup heading={group.group} className="px-2">
                {group.items.map((action) => (
                  <CommandItem
                    key={action.id}
                    value={action.id}
                    onSelect={() => handleSelect(action.id)}
                    className="rounded-md cursor-pointer hover:bg-gray-100 flex justify-between aria-selected:bg-gray-100"
                    autoFocus={false}
                    disabled={action.disabled}
                  >
                    {action.icon}
                    <span className="flex-1">{action.label}</span>
                    {action.shortcut && (
                      <CommandShortcut className="ml-2 text-xs text-gray-500 bg-white border border-gray-200 shadow-xs px-1.5 py-0.5 rounded">
                        {action.shortcut}
                      </CommandShortcut>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </div>
          ))}
          {useCareApps().some(
            (plugin) => plugin.components?.PatientInfoCardActions,
          ) && (
            <CommandGroup heading={t("plugin_actions")} className="px-2">
              <PLUGIN_Component
                __name="PatientInfoCardActions"
                encounter={encounter}
                className="rounded-md cursor-pointer hover:bg-gray-100 flex justify-between aria-selected:bg-gray-100 w-full py-2"
              />
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
