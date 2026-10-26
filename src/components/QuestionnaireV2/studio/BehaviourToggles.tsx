import { useId } from "react";
import { useTranslation } from "react-i18next";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

import { NON_REPEATABLE_TYPES } from "@/components/QuestionnaireV2/builder/questionTypeRules";

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

export function BehaviourToggles({
  question,
  onChange,
}: BehaviourTogglesProps) {
  const { t } = useTranslation();
  const idBase = useId();

  const flags = FLAGS.filter(
    (flag) =>
      (flag.key !== "repeats" ||
        !NON_REPEATABLE_TYPES.includes(question.type)) &&
      !(
        question.type === "group" &&
        question.structured_type &&
        (flag.key === "repeats" ||
          (flag.key === "required" && !question.repeats))
      ),
  );

  return (
    <div className="divide-y divide-gray-100">
      {flags.map((flag) => {
        const checked = !!question[flag.key];
        return (
          <Label
            key={flag.key}
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
            <Checkbox
              checked={checked}
              aria-labelledby={`${idBase}-${flag.key}-label`}
              aria-describedby={`${idBase}-${flag.key}-hint`}
              onCheckedChange={(value) => onChange({ [flag.key]: value })}
            />
          </Label>
        );
      })}
    </div>
  );
}
