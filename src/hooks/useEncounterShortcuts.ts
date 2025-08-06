import { useNavigate } from "raviger";
import { useCallback, useMemo } from "react";

import {
  type ShortcutConditions as BaseShortcutConditions,
  type KeyboardShortcut,
  useKeyboardShortcuts,
} from "@/hooks/useKeyboardShortcuts";
import useQuestionnaireOptions from "@/hooks/useQuestionnaireOptions";

import shortcutsConfig from "@/config/keyboardShortcuts.json";
import { EncounterRead } from "@/types/emr/encounter/encounter";

interface ShortcutsConfig {
  global: KeyboardShortcut[];
  encounter: KeyboardShortcut[];
  patient: KeyboardShortcut[];
  facility: KeyboardShortcut[];
}

interface EncounterShortcutConditions extends BaseShortcutConditions {
  selectedEncounterId?: string;
  currentEncounterId?: string;
}

export function useEncounterShortcuts(
  encounter: EncounterRead | undefined,
  conditions: EncounterShortcutConditions,
) {
  const navigate = useNavigate();
  const questionnaireOptions = useQuestionnaireOptions("encounter_actions");

  const buildEncounterUrl = useCallback(
    (path: string) => {
      // Early return if encounter is not available
      if (!encounter) {
        return "";
      }

      // Always use the current encounter ID for the main URL path
      const currentEncounterIdToUse =
        conditions.currentEncounterId || encounter.id;
      const baseUrl = `/facility/${encounter.facility.id}/patient/${encounter.patient.id}/encounter/${currentEncounterIdToUse}${path}`;

      // Add selectedEncounter parameter if we're viewing a different encounter
      if (
        conditions.selectedEncounterId &&
        conditions.currentEncounterId &&
        conditions.selectedEncounterId !== conditions.currentEncounterId
      ) {
        const separator = path.includes("?") ? "&" : "?";
        return `${baseUrl}${separator}selectedEncounter=${conditions.selectedEncounterId}`;
      }

      return baseUrl;
    },
    [encounter, conditions.selectedEncounterId, conditions.currentEncounterId],
  );

  // Define action handlers for encounter shortcuts
  const shortcutHandlers = useCallback((): Record<string, () => void> => {
    if (!encounter) {
      return {
        "close-dialog": () => {
          // Close any open dialogs/modals
          const escapeEvent = new KeyboardEvent("keydown", {
            key: "Escape",
            code: "Escape",
            bubbles: true,
          });
          document.dispatchEvent(escapeEvent);
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
      "clinical-history": () =>
        navigate(
          `/facility/${encounter.facility.id}/patient/${encounter.patient.id}/history/symptoms?sourceUrl=${encodeURIComponent(
            buildEncounterUrl("/updates"),
          )}`,
        ),
      "encounter-overview": () => navigate(buildEncounterUrl("/updates")),
      plots: () => navigate(buildEncounterUrl("/plots")),
      observations: () => navigate(buildEncounterUrl("/observations")),
      medicines: () => navigate(buildEncounterUrl("/medicines")),
      files: () => navigate(buildEncounterUrl("/files")),
      notes: () => navigate(buildEncounterUrl("/notes")),
      devices: () => navigate(buildEncounterUrl("/devices")),
      consents: () => navigate(buildEncounterUrl("/consents")),
      "service-requests": () =>
        navigate(buildEncounterUrl("/service_requests")),
      "diagnostic-reports": () =>
        navigate(buildEncounterUrl("/diagnostic_reports")),
      "add-questionnaire": () => navigate(buildEncounterUrl("/questionnaire")),
      // Global actions
      "close-dialog": () => {
        // Close any open dialogs/modals
        const escapeEvent = new KeyboardEvent("keydown", {
          key: "Escape",
          code: "Escape",
          bubbles: true,
        });
        document.dispatchEvent(escapeEvent);
      },
      // Dynamic questionnaire shortcuts
      ...questionnaireOptions.reduce(
        (acc, questionnaire, index) => {
          const key = index + 1;
          if (key <= 9) {
            acc[`questionnaire-${questionnaire.slug}`] = () =>
              navigate(
                buildEncounterUrl(`/questionnaire/${questionnaire.slug}`),
              );
          }
          return acc;
        },
        {} as Record<string, () => void>,
      ),
    };
  }, [encounter, navigate, buildEncounterUrl, questionnaireOptions]);

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

    // Process all shortcuts from the config
    const config = shortcutsConfig as ShortcutsConfig;
    const allShortcuts = [...config.global, ...config.encounter];

    allShortcuts.forEach((shortcut) => {
      const keyDisplay = formatKeyDisplay(shortcut.key);
      result[keyDisplay] = shortcut.description;
    });

    // Dynamic questionnaire shortcuts
    questionnaireOptions.forEach((questionnaire, index) => {
      const key = index + 1;
      if (key <= 9) {
        result[`Q + ${key}`] = `Add ${questionnaire.title}`;
      }
    });

    return result;
  }, [questionnaireOptions]);

  return descriptions;
}

// Helper function to format key display
function formatKeyDisplay(key: string): string {
  if (key.includes("+")) {
    // Modifier key combination (shift+a -> SHIFT + A)
    return key
      .split("+")
      .map((k) => k.toUpperCase())
      .join(" + ");
  } else if (key.includes(" ")) {
    // Space-separated keys (g p -> G + P)
    return key
      .split(" ")
      .map((k) => k.toUpperCase())
      .join(" + ");
  } else {
    // Single key (a -> A)
    return key.toUpperCase();
  }
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
        const index = questionnaireOptions.findIndex((q) => q.slug === slug);
        if (index !== -1 && index < 9) {
          return `Q + ${index + 1}`;
        }
      }

      return undefined;
    };

    return getDisplay;
  }, [questionnaireOptions]);
}
