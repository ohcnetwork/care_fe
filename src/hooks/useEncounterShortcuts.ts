import { useNavigate } from "raviger";
import { useCallback, useEffect, useMemo } from "react";

import useQuestionnaireOptions from "@/hooks/useQuestionnaireOptions";

import shortcutsConfig from "@/config/keyboardShortcuts.json";
import { EncounterRead } from "@/types/emr/encounter/encounter";

interface ShortcutConditions {
  readOnly: boolean;
  canEdit: boolean;
  questionnairesEnabled: boolean;
  selectedEncounterId?: string;
  currentEncounterId?: string;
}

export function useEncounterShortcuts(
  encounter: EncounterRead | undefined,
  conditions: ShortcutConditions,
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

  const handleAction = useCallback(
    (actionId: string) => {
      // Early return if encounter is not available
      if (!encounter) {
        return;
      }

      // Handle dynamic questionnaire cases
      if (actionId.startsWith("questionnaire-")) {
        const slug = actionId.replace("questionnaire-", "");
        navigate(buildEncounterUrl(`/questionnaire/${slug}`));
        return;
      }

      const actionMap: Record<string, () => void> = {
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
        "manage-consents": () => navigate(buildEncounterUrl("/consents")),
        "treatment-summary": () =>
          navigate(buildEncounterUrl("/treatment_summary")),
        "discharge-summary": () =>
          navigate(buildEncounterUrl("/files?file=discharge_summary")),
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
        "add-questionnaire": () =>
          navigate(buildEncounterUrl("/questionnaire")),
      };

      const action = actionMap[actionId];
      if (action) {
        action();
      }
    },
    [navigate, buildEncounterUrl, encounter],
  );

  const evaluateWhenCondition = useCallback(
    (whenClause: string) => {
      if (whenClause === "always") return true;

      // Parse the when clause and evaluate conditions
      const context = {
        canEdit: !conditions.readOnly && conditions.canEdit,
        questionnairesEnabled: conditions.questionnairesEnabled,
        readOnly: conditions.readOnly,
      };

      try {
        // Simple condition evaluation - you can expand this for more complex logic
        return whenClause.split(" && ").every((condition) => {
          const trimmed = condition.trim();
          if (trimmed.startsWith("!")) {
            const prop = trimmed.slice(1) as keyof typeof context;
            return !context[prop];
          }
          const prop = trimmed as keyof typeof context;
          return context[prop];
        });
      } catch {
        return false;
      }
    },
    [conditions],
  );

  // Parse shortcuts by key patterns
  const shortcuts = useMemo(() => {
    const direct: Record<string, any> = {};
    const gPrefix: Record<string, any> = {};
    const qPrefix: Record<string, any> = {};
    const modified: Record<string, any> = {};

    shortcutsConfig.forEach((shortcut) => {
      const key = shortcut.key;

      // Check if it's a modifier key combination (shift+a, cmd+g, etc.)
      if (key.includes("+")) {
        modified[key] = shortcut;
      } else {
        const keys = key.split(" ");

        if (keys.length === 1) {
          // Direct shortcuts (single key like "a", "escape")
          direct[keys[0]] = shortcut;
        } else if (keys.length === 2) {
          if (keys[0] === "g") {
            // G-prefixed shortcuts
            gPrefix[keys[1]] = shortcut;
          } else if (keys[0] === "q") {
            // Q-prefixed shortcuts
            qPrefix[keys[1]] = shortcut;
          }
        }
      }
    });

    return { direct, gPrefix, qPrefix, modified };
  }, []);

  // Helper function to check if event matches key combination
  const matchesKeyCombo = useCallback(
    (keyCombo: string, event: KeyboardEvent) => {
      const parts = keyCombo.split("+");
      if (parts.length === 1) {
        // Simple key
        return event.key.toLowerCase() === parts[0].toLowerCase();
      }

      // Modifier + key combination
      const key = parts[parts.length - 1].toLowerCase();
      const modifiers = parts.slice(0, -1);

      if (event.key.toLowerCase() !== key) return false;

      return modifiers.every((mod) => {
        switch (mod.toLowerCase()) {
          case "shift":
            return event.shiftKey;
          case "ctrl":
            return event.ctrlKey;
          case "cmd":
          case "meta":
            return event.metaKey;
          case "alt":
            return event.altKey;
          default:
            return false;
        }
      });
    },
    [],
  );

  useEffect(() => {
    let gKeyPressed = false;
    let qKeyPressed = false;

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

      // Handle modifier key combinations first
      for (const [keyCombo, shortcut] of Object.entries(shortcuts.modified)) {
        if (
          matchesKeyCombo(keyCombo, e) &&
          evaluateWhenCondition(shortcut.when)
        ) {
          e.preventDefault();
          handleAction(shortcut.action);
          return;
        }
      }

      // Handle direct shortcuts (no modifiers, no prefix keys active)
      if (
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.shiftKey &&
        !gKeyPressed &&
        !qKeyPressed
      ) {
        const key = e.key.toLowerCase();
        const shortcut = shortcuts.direct[key];
        if (shortcut && evaluateWhenCondition(shortcut.when)) {
          e.preventDefault();
          handleAction(shortcut.action);
          return;
        }
      }

      // Handle G + letter shortcuts
      if (e.key.toLowerCase() === "g" && !gKeyPressed && !qKeyPressed) {
        e.preventDefault();
        gKeyPressed = true;
        setTimeout(() => {
          gKeyPressed = false;
        }, 1000);
        return;
      }

      // Handle Q + key shortcuts
      if (e.key.toLowerCase() === "q" && !gKeyPressed && !qKeyPressed) {
        e.preventDefault();
        qKeyPressed = true;
        setTimeout(() => {
          qKeyPressed = false;
        }, 1000);
        return;
      }

      if (gKeyPressed) {
        const key = e.key.toLowerCase();
        const shortcut = shortcuts.gPrefix[key];
        if (shortcut && evaluateWhenCondition(shortcut.when)) {
          e.preventDefault();
          handleAction(shortcut.action);
          gKeyPressed = false;
          return;
        }
      }

      if (qKeyPressed) {
        const key = e.key;

        // Handle Q + defined shortcuts (like Q + 0)
        const qShortcut = shortcuts.qPrefix[key];
        if (qShortcut && evaluateWhenCondition(qShortcut.when)) {
          e.preventDefault();
          handleAction(qShortcut.action);
          qKeyPressed = false;
          return;
        }

        // Handle Q + 1-9 for dynamic questionnaires
        const index = parseInt(key) - 1;
        if (
          !isNaN(index) &&
          index >= 0 &&
          index < questionnaireOptions.length &&
          evaluateWhenCondition("canEdit && questionnairesEnabled")
        ) {
          e.preventDefault();
          handleAction(`questionnaire-${questionnaireOptions[index].slug}`);
          qKeyPressed = false;
          return;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    handleAction,
    evaluateWhenCondition,
    matchesKeyCombo,
    questionnaireOptions,
    conditions,
    shortcuts,
  ]);

  return { handleAction };
}

// Helper hook for getting shortcut descriptions
export function useEncounterShortcutDescriptions() {
  const questionnaireOptions = useQuestionnaireOptions("encounter_actions");

  const descriptions = useMemo(() => {
    const result: Record<string, string> = {};

    // Process all shortcuts from the config
    shortcutsConfig.forEach((shortcut) => {
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
      // Find shortcut by action in the config array
      const shortcut = shortcutsConfig.find((s) => s.action === actionId);
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
