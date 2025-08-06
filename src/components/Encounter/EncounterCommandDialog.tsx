import {
  ArrowBigRight,
  Edit,
  FileText,
  HistoryIcon,
  NotebookPen,
  Plus,
} from "lucide-react";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

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
import useQuestionnaireOptions from "@/hooks/useQuestionnaireOptions";

import { EncounterRead } from "@/types/emr/encounter/encounter";

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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  encounter: EncounterRead;
  readOnly?: boolean;
  canEdit?: boolean;
  selectedEncounterId?: string;
  currentEncounterId?: string;
}

export function EncounterCommandDialog({
  open,
  onOpenChange,
  encounter,
  readOnly = false,
  canEdit = true,
  selectedEncounterId,
  currentEncounterId,
}: EncounterCommandDialogProps) {
  const { t } = useTranslation();
  const questionnaireOptions = useQuestionnaireOptions("encounter_actions");
  const getShortcutDisplay = useEncounterShortcutDisplays();
  const { handleAction } = useEncounterShortcuts(encounter, {
    readOnly,
    canEdit,
    questionnairesEnabled: !readOnly && canEdit,
    selectedEncounterId,
    currentEncounterId,
  });

  const encounterActions: ActionGroup[] = useMemo(
    () => [
      {
        group: t("encounter"),
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
            id: "update-encounter",
            label: t("update_encounter"),
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
            icon: <HistoryIcon />,
          },
          {
            id: "manage-consents",
            label: t("manage_consents"),
            shortcut: getShortcutDisplay("manage-consents"),
            icon: <NotebookPen />,
          },
        ],
      },
      {
        group: t("available_reports"),
        items: [
          {
            id: "treatment-summary",
            label: t("treatment_summary"),
            icon: <FileText />,
          },
          {
            id: "discharge-summary",
            label: t("discharge_summary"),
            icon: <FileText />,
          },
        ],
      },
      {
        group: t("navigation"),
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
          {
            id: "add-questionnaire",
            label: t("add_questionnaire"),
            shortcut: getShortcutDisplay("add-questionnaire"),
            icon: <Plus />,
          },
          ...questionnaireOptions.map((option) => ({
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

  const handleSelect = useCallback(
    (actionId: string) => {
      handleAction(actionId);
      onOpenChange(false);
    },
    [handleAction, onOpenChange],
  );

  return (
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
      </CommandList>
    </CommandDialog>
  );
}
