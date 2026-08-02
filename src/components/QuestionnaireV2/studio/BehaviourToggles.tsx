import { useId } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { NON_REPEATABLE_TYPES } from "@/components/QuestionnaireV2/builder/BehaviourSettingsCard";

import { Question } from "@/types/questionnaire/question";

interface BehaviourTogglesProps {
  question: Question;
  onChange: (patch: Partial<Question>) => void;
}

const FLAGS: readonly {
  key: "required" | "repeats" | "read_only";
  labelKey: string;
  hintKey: string;
}[] = [
  {
    key: "required",
    labelKey: "required",
    hintKey: "required_toggle_hint",
  },
  {
    key: "repeats",
    labelKey: "repeatable",
    hintKey: "repeatable_toggle_hint",
  },
  {
    key: "read_only",
    labelKey: "read_only",
    hintKey: "read_only_toggle_hint",
  },
];

/**
 * The reference design's behaviour rows: title + explanatory subtitle with
 * a switch visual. Semantically these stay checkboxes (role + aria-checked
 * + aria-label), matching the previous chips' accessibility contract —
 * `checkbox "Required"` etc. — so the Playwright surface is unchanged.
 */
export function BehaviourToggles({
  question,
  onChange,
}: BehaviourTogglesProps) {
  const { t } = useTranslation();
  const idBase = useId();

  const flags = FLAGS.filter(
    (flag) =>
      flag.key !== "repeats" || !NON_REPEATABLE_TYPES.includes(question.type),
  );

  return (
    <div className="divide-y divide-gray-100">
      {flags.map((flag) => {
        const checked = !!question[flag.key];
        return (
          <button
            key={flag.key}
            type="button"
            role="checkbox"
            aria-checked={checked}
            // labelledby/describedby (not aria-label) so the visible title
            // stays the accessible name — `checkbox "Required"` in specs —
            // while the explanatory hint remains announced as description.
            aria-labelledby={`${idBase}-${flag.key}-label`}
            aria-describedby={`${idBase}-${flag.key}-hint`}
            onClick={() => onChange({ [flag.key]: !checked })}
            className="flex w-full items-center gap-3 py-2.5 text-left"
          >
            <span className="min-w-0 flex-1">
              <span
                id={`${idBase}-${flag.key}-label`}
                className="block text-sm font-semibold text-gray-900"
              >
                {t(flag.labelKey)}
              </span>
              <span
                id={`${idBase}-${flag.key}-hint`}
                className="block text-xs text-gray-500"
              >
                {t(flag.hintKey)}
              </span>
            </span>
            <span
              aria-hidden
              className={cn(
                "relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors",
                checked ? "bg-primary-600" : "bg-gray-200",
              )}
            >
              <span
                className={cn(
                  "absolute top-[3px] size-4 rounded-full bg-white shadow transition-all",
                  checked ? "left-[19px]" : "left-[3px]",
                )}
              />
            </span>
          </button>
        );
      })}
    </div>
  );
}
