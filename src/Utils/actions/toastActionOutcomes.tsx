import { t } from "i18next";
import { InfoIcon } from "lucide-react";
import { toast } from "sonner";

import type { ActionOutcome } from "@/types/questionnaire/actions";

import { outcomeMessage } from "./actionOutcomes";
import { instructionLabel } from "./instructionLabels";

/** Long enough to read after the page underneath has changed — a
 *  clinical instruction produced by an action must not vanish with the
 *  default four seconds. */
const ACTION_TOAST_DURATION = 15_000;
const ACTION_TOASTS_BEFORE_SUMMARY = 3;

interface ReadableActionOutcome {
  title: string;
  message: string;
}

interface ActionOutcomesSummaryProps {
  heading: string;
  entries: ReadableActionOutcome[];
}

/** Match Sonner styled toast slots: [data-title] and [data-description] (13px). */
const actionToastTitleClassName = "font-medium leading-normal";
const actionToastDescriptionClassName =
  "font-normal leading-[1.4] whitespace-pre-wrap break-words";

/** Sonner keeps the type icon in a separate column from title + description,
 *  so tall lists center the icon. We render one row (icon + body) instead. */
function ActionOutcomesSummary({
  heading,
  entries,
}: ActionOutcomesSummaryProps) {
  return (
    <div className="w-full min-w-0">
      <div className="flex items-center gap-2">
        <InfoIcon className="size-4 shrink-0" aria-hidden />
        <p className={actionToastTitleClassName}>{heading}</p>
      </div>
      <ul className="mt-2 max-h-64 space-y-2 overflow-y-auto pr-1">
        {entries.map((entry, index) => (
          <li
            key={index}
            className="border-b border-current/10 pb-2 last:border-0"
          >
            <p className={actionToastTitleClassName}>{entry.title}</p>
            <p className={actionToastDescriptionClassName}>{entry.message}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Show what a record's actions reported: one toast per outcome titled by
 * the instruction's plain name, or a single summary when there are many.
 * Outcomes with no readable message are not shown. Toasts live at the app
 * root, so a page that navigates away right after its write still gets
 * them on the screen it lands on.
 */
export function toastActionOutcomes(outcomes: ActionOutcome[]) {
  const readable = outcomes.flatMap((outcome) => {
    const message = outcomeMessage(outcome);
    return message
      ? [{ title: instructionLabel(outcome.slug, t), message }]
      : [];
  });
  if (readable.length === 0) return;
  if (readable.length > ACTION_TOASTS_BEFORE_SUMMARY) {
    toast.info("", {
      icon: null,
      description: (
        <ActionOutcomesSummary
          heading={t("questionnaire_actions_ran", { count: readable.length })}
          entries={readable}
        />
      ),
      classNames: {
        title: "hidden",
        toast: "w-[var(--width)] !items-start",
        content: "min-w-0 flex-1",
        description: "w-full min-w-0",
      },
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
