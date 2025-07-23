import {
  ArrowBigRight,
  Check,
  Edit,
  FileText,
  HistoryIcon,
  NotebookPen,
  Plus,
  Users,
} from "lucide-react";
import { useNavigate } from "raviger";
import { useEffect } from "react";
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
}

export function EncounterCommandDialog({
  open,
  onOpenChange,
  encounter,
}: EncounterCommandDialogProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const questionnaireOptions = useQuestionnaireOptions("encounter_actions");

  const encounterActions: ActionGroup[] = [
    {
      group: t("encounter"),
      items: [
        {
          id: "add-allergy",
          label: t("add_allergy_one"),
          shortcut: "A",
          icon: <Plus />,
        },
        {
          id: "add-symptoms",
          label: t("add_symptom"),
          shortcut: "S",
          icon: <Plus />,
        },
        {
          id: "add-diagnosis",
          label: t("add_diagnosis"),
          shortcut: "D",
          icon: <Plus />,
        },
        {
          id: "update-encounter",
          label: t("update_encounter"),
          shortcut: "E",
          icon: <Edit />,
        },
      ],
    },
    // {
    //   group: t("account"),
    //   items: [
    //     { id: "billing-account", label: t("billing"), shortcut: "B" },
    //     { id: "add-charge-item", label: t("add_charge_item"), shortcut: "C" },
    //   ],
    // },
    {
      group: t("actions"),
      items: [
        {
          id: "clinical-history",
          label: t("see_clinical_history"),
          shortcut: "H",
          icon: <HistoryIcon />,
        },
        {
          id: "manage-consents",
          label: t("manage_consents"),
          shortcut: "C",
          icon: <NotebookPen />,
        },
        {
          id: "mark-complete",
          label: t("mark_as_complete"),
          icon: <Check />,
          disabled: true,
        },
        {
          id: "manage-care-team",
          label: t("manage_care_team"),
          icon: <Users />,
          disabled: true,
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
          id: "plots",
          label: t("ENCOUNTER_TAB__plots"),
          shortcut: "G then P",
          icon: <ArrowBigRight />,
        },
        {
          id: "observations",
          label: t("observations"),
          shortcut: "G then O",
          icon: <ArrowBigRight />,
        },
        {
          id: "medicines",
          label: t("medicines"),
          shortcut: "G then M",
          icon: <ArrowBigRight />,
        },
        {
          id: "files",
          label: t("files"),
          shortcut: "G then F",
          icon: <ArrowBigRight />,
        },
        {
          id: "notes",
          label: t("notes"),
          shortcut: "G then N",
          icon: <ArrowBigRight />,
        },
        {
          id: "devices",
          label: t("devices"),
          shortcut: "G then D",
          icon: <ArrowBigRight />,
        },
        {
          id: "consents",
          label: t("consents"),
          shortcut: "G then C",
          icon: <ArrowBigRight />,
        },
        {
          id: "service-requests",
          label: t("service_requests"),
          shortcut: "G then S",
          icon: <ArrowBigRight />,
        },
        {
          id: "diagnostic-reports",
          label: t("ENCOUNTER_TAB__diagnostic_reports"),
          shortcut: "G then R",
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
          shortcut: "Q",
          icon: <Plus />,
        },
        ...questionnaireOptions.map((option, index) => ({
          id: `questionnaire-${option.slug}`,
          label: option.title,
          icon: <NotebookPen />,
          shortcut: `Q then ${index + 1}`,
        })),
      ],
    },
  ];

  const handleAction = (actionId: string) => {
    // Handle dynamic questionnaire cases
    if (actionId.startsWith("questionnaire-")) {
      const slug = actionId.replace("questionnaire-", "");
      navigate(
        `/facility/${encounter.facility.id}/patient/${encounter.patient.id}/encounter/${encounter.id}/questionnaire/${slug}`,
      );
      return;
    }

    switch (actionId) {
      case "add-allergy":
        navigate(
          `/facility/${encounter.facility.id}/patient/${encounter.patient.id}/encounter/${encounter.id}/questionnaire/allergy_intolerance`,
        );
        break;
      case "add-symptoms":
        navigate(
          `/facility/${encounter.facility.id}/patient/${encounter.patient.id}/encounter/${encounter.id}/questionnaire/symptom`,
        );
        break;
      case "add-diagnosis":
        navigate(
          `/facility/${encounter.facility.id}/patient/${encounter.patient.id}/encounter/${encounter.id}/questionnaire/diagnosis`,
        );
        break;
      case "update-encounter":
        navigate(
          `/facility/${encounter.facility.id}/patient/${encounter.patient.id}/encounter/${encounter.id}/questionnaire/encounter`,
        );
        break;
      //   case "billing-account":
      //     // Navigate to billing account
      //     break;
      //   case "add-charge-item":
      //     // Navigate to add charge item
      // break;
      case "clinical-history":
        navigate(
          `/facility/${encounter.facility.id}/patient/${encounter.patient.id}/history/symptoms?sourceUrl=${encodeURIComponent(`/facility/${encounter.facility.id}/patient/${encounter.patient.id}/encounter/${encounter.id}/updates`)}`,
        );
        break;
      case "mark-complete":
        // Handle mark as complete
        break;
      case "manage-care-team":
        onOpenChange(true);
        break;
      case "manage-consents":
        navigate(
          `/facility/${encounter.facility.id}/patient/${encounter.patient.id}/encounter/${encounter.id}/consents`,
        );
        // Navigate to manage consents
        break;
      case "treatment-summary":
        navigate(
          `/facility/${encounter.facility.id}/patient/${encounter.patient.id}/encounter/${encounter.id}/treatment_summary`,
        );
        break;
      case "discharge-summary":
        navigate(
          `/facility/${encounter.facility.id}/patient/${encounter.patient.id}/encounter/${encounter.id}/files?file=discharge_summary`,
        );
        break;
      case "questionnaire-search":
        // This will be handled by the QuestionnaireSearch component
        break;
      case "plots":
        navigate(
          `/facility/${encounter.facility.id}/patient/${encounter.patient.id}/encounter/${encounter.id}/plots`,
        );
        break;
      case "observations":
        navigate(
          `/facility/${encounter.facility.id}/patient/${encounter.patient.id}/encounter/${encounter.id}/observations`,
        );
        break;
      case "medicines":
        navigate(
          `/facility/${encounter.facility.id}/patient/${encounter.patient.id}/encounter/${encounter.id}/medicines`,
        );
        break;
      case "files":
        navigate(
          `/facility/${encounter.facility.id}/patient/${encounter.patient.id}/encounter/${encounter.id}/files`,
        );
        break;
      case "notes":
        navigate(
          `/facility/${encounter.facility.id}/patient/${encounter.patient.id}/encounter/${encounter.id}/notes`,
        );
        break;
      case "devices":
        navigate(
          `/facility/${encounter.facility.id}/patient/${encounter.patient.id}/encounter/${encounter.id}/devices`,
        );
        break;
      case "consents":
        navigate(
          `/facility/${encounter.facility.id}/patient/${encounter.patient.id}/encounter/${encounter.id}/consents`,
        );
        break;
      case "service-requests":
        navigate(
          `/facility/${encounter.facility.id}/patient/${encounter.patient.id}/encounter/${encounter.id}/service_requests`,
        );
        break;
      case "diagnostic-reports":
        navigate(
          `/facility/${encounter.facility.id}/patient/${encounter.patient.id}/encounter/${encounter.id}/diagnostic_reports`,
        );
        break;
      case "add-questionnaire":
        navigate(
          `/facility/${encounter.facility.id}/patient/${encounter.patient.id}/encounter/${encounter.id}/questionnaire`,
        );
        break;
      case "doctors-notes":
        // Handle doctors notes
        break;
      case "feedback-form":
        // Handle feedback form
        break;
      case "community-nurse":
        // Handle community nurse form
        break;
    }
    onOpenChange(false);
  };

  useEffect(() => {
    if (!open) return;

    let gKeyPressed = false;
    let qKeyPressed = false;
    let gKeyTimeout: NodeJS.Timeout;
    let qKeyTimeout: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts if user is typing in an input field
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.contentEditable === "true"
      ) {
        return;
      }

      // Handle direct shortcuts
      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        const key = e.key.toUpperCase();
        const directAction = encounterActions.flatMap((group) =>
          group.items.filter((item) => item.shortcut === key),
        )[0];

        if (directAction) {
          e.preventDefault();
          handleAction(directAction.id);
          return;
        }
      }

      // Handle G + letter shortcuts
      if (e.key.toLowerCase() === "g") {
        gKeyPressed = true;
        clearTimeout(gKeyTimeout);
        gKeyTimeout = setTimeout(() => {
          gKeyPressed = false;
        }, 2000); // Reset after 2 seconds
        return;
      }

      // Handle Q + number shortcuts
      if (e.key.toLowerCase() === "q") {
        qKeyPressed = true;
        clearTimeout(qKeyTimeout);
        qKeyTimeout = setTimeout(() => {
          qKeyPressed = false;
        }, 2000); // Reset after 2 seconds
        return;
      }

      if (gKeyPressed) {
        const key = e.key.toUpperCase();
        const navigationAction = encounterActions
          .find((group) => group.group === t("navigation"))
          ?.items.find((item) => item.shortcut === `G then ${key}`);

        if (navigationAction) {
          e.preventDefault();
          handleAction(navigationAction.id);
          gKeyPressed = false;
          clearTimeout(gKeyTimeout);
        }
      }

      if (qKeyPressed) {
        const key = e.key;
        const questionnaireAction = encounterActions
          .find((group) => group.group === t("questionnaire"))
          ?.items.find((item) => item.shortcut === `Q then ${key}`);

        if (questionnaireAction) {
          e.preventDefault();
          handleAction(questionnaireAction.id);
          qKeyPressed = false;
          clearTimeout(qKeyTimeout);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(gKeyTimeout);
      clearTimeout(qKeyTimeout);
    };
  }, [open, encounterActions, handleAction]);

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
      <CommandList className="h-[80vh] max-h-[80vh] w-full ">
        <CommandEmpty>{t("no_results")}</CommandEmpty>
        {encounterActions.map((group) => (
          <>
            <CommandGroup
              key={group.group}
              heading={group.group}
              className="px-2"
            >
              {group.items.map((action) => {
                return (
                  <CommandItem
                    key={action.id}
                    value={action.id}
                    onSelect={() => handleAction(action.id)}
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
                );
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
