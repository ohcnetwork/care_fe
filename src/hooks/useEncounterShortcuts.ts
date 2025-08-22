import { useNavigate } from "raviger";
import { useCallback, useMemo } from "react";

import {
  type ShortcutConditions as BaseShortcutConditions,
  type KeyboardShortcut,
  useKeyboardShortcuts,
} from "@/hooks/useKeyboardShortcuts";
import useQuestionnaireOptions from "@/hooks/useQuestionnaireOptions";

import { formatKeyboardShortcut } from "@/Utils/formatKeyboardShortcut";
import shortcutsConfig from "@/config/keyboardShortcuts.json";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";

interface ShortcutsConfig {
  global: KeyboardShortcut[];
  encounter: KeyboardShortcut[];
}

export function useEncounterShortcuts() {
  const navigate = useNavigate();
  const questionnaireOptions = useQuestionnaireOptions("encounter_actions");
  const {
    selectedEncounter: encounter,
    selectedEncounterId,
    primaryEncounterId,
    canWriteSelectedEncounter,
    actions,
  } = useEncounter();

  // Determine conditions based on encounter context
  const readOnly = selectedEncounterId !== primaryEncounterId;
  const canEdit = canWriteSelectedEncounter;

  const conditions: BaseShortcutConditions = {
    readOnly,
    canEdit,
    questionnairesEnabled: !readOnly && canEdit,
  };

  const buildEncounterUrl = useCallback(
    (path: string) => {
      if (!encounter) {
        return "";
      }

      const currentEncounterIdToUse = primaryEncounterId || encounter.id;
      const baseUrl = `/facility/${encounter.facility.id}/patient/${encounter.patient.id}/encounter/${currentEncounterIdToUse}${path}`;

      // Add selectedEncounter parameter if we're viewing a different encounter
      if (
        selectedEncounterId &&
        primaryEncounterId &&
        selectedEncounterId !== primaryEncounterId
      ) {
        const separator = path.includes("?") ? "&" : "?";
        return `${baseUrl}${separator}selectedEncounter=${selectedEncounterId}`;
      }

      return baseUrl;
    },
    [encounter, selectedEncounterId, primaryEncounterId],
  );

  // Define action handlers for encounter shortcuts
  const shortcutHandlers = useCallback((): Record<string, () => void> => {
    if (!encounter) {
      return {
        "close-dialog": () => {
          const escapeEvent = new KeyboardEvent("keydown", {
            key: "Escape",
            code: "Escape",
            bubbles: true,
          });
          document.dispatchEvent(escapeEvent);
        },
        "open-command-dialog": () => {
          document.dispatchEvent(
            new CustomEvent("open-encounter-command-dialog"),
          );
        },
      };
    }

    return {
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
          `/facility/${encounter.facility.id}/patient/${encounter.patient.id}/history/symptoms?sourceUrl=${encodeURIComponent(
            buildEncounterUrl("/updates"),
          )}`,
        ),
      "treatment-summary": () =>
        navigate(buildEncounterUrl("/treatment_summary")),
      "discharge-summary": () =>
        navigate(buildEncounterUrl("/files?file=discharge_summary")),
      "encounter-overview": () => navigate(buildEncounterUrl("/updates")),
      "add-questionnaire": () => navigate(buildEncounterUrl("/questionnaire")),
      plots: () => navigate(buildEncounterUrl("/plots")),
      observations: () => navigate(buildEncounterUrl("/observations")),
      medicines: () => navigate(buildEncounterUrl("/medicines")),
      files: () => navigate(buildEncounterUrl("/files")),
      notes: () => navigate(buildEncounterUrl("/notes")),
      devices: () => navigate(buildEncounterUrl("/devices")),
      consents: () => navigate(buildEncounterUrl("/consents")),

      "mark-as-completed": () => actions.markAsCompleted(),
      "assign-location": () => actions.assignLocation(),
      "view-location-history": () => actions.viewLocationHistory(),
      "manage-care-team": () => actions.manageCareTeam(),
      "manage-departments": () => actions.manageDepartments(),
      "dispense-medicine": () => actions.dispenseMedicine(),
      "open-command-dialog": () => {
        document.dispatchEvent(
          new CustomEvent("open-encounter-command-dialog"),
        );
      },
      ...(questionnaireOptions?.results || []).reduce(
        (acc, option, index) => {
          const navigateToQuestionnaire = () =>
            navigate(buildEncounterUrl(`/questionnaire/${option.slug}`));
          acc[`questionnaire-${option.slug}`] = navigateToQuestionnaire;
          acc[`questionnaire-${index + 1}`] = navigateToQuestionnaire;
          return acc;
        },
        {} as Record<string, () => void>,
      ),
    };
  }, [encounter, navigate, buildEncounterUrl, questionnaireOptions, actions]);

  // Use the generic keyboard shortcuts system
  const handlers = shortcutHandlers();
  const keyboardShortcuts = useKeyboardShortcuts(
    ["global", "encounter"],
    conditions,
    handlers,
  );

  // Provide handleAction for backward compatibility
  const handleAction = useCallback(
    (actionId: string) => {
      const handler = handlers[actionId];
      if (handler) {
        handler();
      }
    },
    [handlers],
  );

  return {
    ...keyboardShortcuts,
    handleAction,
  };
}

// Helper hook for getting shortcut descriptions
export function useEncounterShortcutDescriptions() {
  const questionnaireOptions = useQuestionnaireOptions("encounter_actions");

  const descriptions = useMemo(() => {
    const result: Record<string, string> = {};

    const config = shortcutsConfig as ShortcutsConfig;
    const allShortcuts = [...config.global, ...config.encounter];

    allShortcuts.forEach((shortcut) => {
      const keyDisplay = formatKeyDisplay(shortcut.key);
      result[keyDisplay] = shortcut.description;
    });

    return result;
  }, [questionnaireOptions]);

  return descriptions;
}

function formatKeyDisplay(key: string): string {
  return formatKeyboardShortcut(key);
}

// Hook to get shortcut display strings for actions
export function useEncounterShortcutDisplays() {
  const questionnaireOptions = useQuestionnaireOptions("encounter_actions");

  return useMemo(() => {
    const getDisplay = (actionId: string): string | undefined => {
      // Find shortcut by action in the config
      const config = shortcutsConfig as ShortcutsConfig;
      const allShortcuts = [...config.global, ...config.encounter];

      const shortcut = allShortcuts.find((s) => s.action === actionId);
      if (shortcut) {
        return formatKeyDisplay(shortcut.key);
      }

      // Handle dynamic questionnaire shortcuts
      if (actionId.startsWith("questionnaire-")) {
        const slug = actionId.replace("questionnaire-", "");
        const index = (questionnaireOptions?.results || []).findIndex(
          (q) => q.slug === slug,
        );
        if (index !== -1 && index < 9) {
          const questionnaireShortcut = config.encounter.find(
            (s) => s.action === `questionnaire-${index + 1}`,
          );
          if (questionnaireShortcut) {
            return formatKeyDisplay(questionnaireShortcut.key);
          }
        }
      }

      return undefined;
    };

    return getDisplay;
  }, [questionnaireOptions]);
}
