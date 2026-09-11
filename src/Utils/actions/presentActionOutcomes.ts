import { t } from "i18next";
import { toast } from "sonner";

import type { ActionOutcome } from "@/types/questionnaire/actions";

import { outcomeMessage } from "./actionOutcomes";
import { instructionLabel } from "./instructionLabels";

/** Long enough to read after the page underneath has changed — a
 *  clinical instruction produced by an action must not vanish with the
 *  default four seconds. */
const ACTION_TOAST_DURATION = 15_000;
const ACTION_TOASTS_BEFORE_SUMMARY = 3;

/**
 * Show what a record's actions reported: one toast per outcome titled by
 * the instruction's plain name, or a single summary when there are many.
 * Outcomes with no readable message are not shown. Toasts live at the app
 * root, so a page that navigates away right after its write still gets
 * them on the screen it lands on.
 */
export function presentActionOutcomes(outcomes: ActionOutcome[]) {
  const readable = outcomes.flatMap((outcome) => {
    const message = outcomeMessage(outcome);
    return message
      ? [{ title: instructionLabel(outcome.slug, t), message }]
      : [];
  });
  if (readable.length === 0) return;
  if (readable.length > ACTION_TOASTS_BEFORE_SUMMARY) {
    toast.message(t("questionnaire_actions_ran", { count: readable.length }), {
      description: readable
        .slice(0, 5)
        .map((entry) => `${entry.title}: ${entry.message}`)
        .join("\n"),
      duration: ACTION_TOAST_DURATION,
    });
    return;
  }
  for (const entry of readable) {
    toast.info(entry.title, {
      description: entry.message,
      duration: ACTION_TOAST_DURATION,
    });
  }
}
