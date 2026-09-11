import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";

import { ChoiceChip } from "@/components/QuestionnaireV2/shared/ChoiceChip";
import { CollapsibleSettingsCard } from "@/components/QuestionnaireV2/shared/CollapsibleSettingsCard";

import { Question, QuestionType } from "@/types/questionnaire/question";

interface BehaviourSettingsCardProps {
  question: Question;
  onChange: (patch: Partial<Question>) => void;
  /** Render the chip groups without the collapsible card shell — the
   *  studio inspector hosts each section flat inside its own tab. */
  bare?: boolean;
  /** Which chip groups to render (default both). The studio's Question tab
   *  takes "behaviour", its Coding tab takes "data_capture". */
  sections?: readonly ("behaviour" | "data_capture")[];
}

interface BehaviourFlag {
  key:
    | "required"
    | "repeats"
    | "read_only"
    | "is_component"
    | "collect_time"
    | "collect_performer"
    | "collect_method"
    | "collect_body_site";
  label: string;
}

const BEHAVIOUR_FLAGS: readonly BehaviourFlag[] = [
  { key: "required", label: "required" },
  { key: "repeats", label: "repeatable" },
  { key: "read_only", label: "read_only" },
];

const DATA_CAPTURE_FLAGS: readonly BehaviourFlag[] = [
  { key: "is_component", label: "component" },
  { key: "collect_time", label: "collect_time" },
  { key: "collect_performer", label: "collect_performer" },
  { key: "collect_method", label: "collect_method" },
  { key: "collect_body_site", label: "collect_body_site" },
];

/** Types that never offer the Repeats flag. */
export const NON_REPEATABLE_TYPES: readonly QuestionType[] = [
  "boolean",
  "group",
  "display",
  "structured",
];

export function BehaviourSettingsCard({
  question,
  onChange,
  bare = false,
  sections = ["behaviour", "data_capture"],
}: BehaviourSettingsCardProps) {
  const { t } = useTranslation();

  const behaviourFlags = BEHAVIOUR_FLAGS.filter(
    (flag) =>
      flag.key !== "repeats" || !NON_REPEATABLE_TYPES.includes(question.type),
  );

  // Derived from the same flag lists that render the chips, so adding a
  // flag can never silently miss the "configured" badge count.
  const count = [
    ...(sections.includes("behaviour") ? behaviourFlags : []),
    ...(sections.includes("data_capture") ? DATA_CAPTURE_FLAGS : []),
  ].filter((flag) => question[flag.key]).length;

  // A bare single-section host (the studio's tabs) provides its own label
  // above the chips — the inner group label would duplicate it.
  const showGroupLabels = !(bare && sections.length === 1);

  const chipGroup = (flags: readonly BehaviourFlag[], label: string) => (
    <div className="space-y-1.5">
      {showGroupLabels && (
        <p className="text-xs font-medium text-gray-500">{label}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {flags.map((flag) => (
          <ChoiceChip
            key={flag.key}
            control="checkbox"
            label={t(flag.label)}
            checked={!!question[flag.key]}
            onCheckedChange={(checked) => onChange({ [flag.key]: checked })}
          />
        ))}
      </div>
    </div>
  );

  const content = (
    <div className="space-y-4">
      {sections.includes("behaviour") &&
        chipGroup(behaviourFlags, t("behaviour"))}
      {sections.includes("data_capture") &&
        chipGroup(DATA_CAPTURE_FLAGS, t("data_capture"))}
    </div>
  );

  if (bare) return content;

  return (
    <CollapsibleSettingsCard
      title={t("question_behaviour_title")}
      subtitle={t("question_behaviour_subtitle")}
      badge={
        count > 0 ? (
          <Badge variant="green">
            <Check className="size-3" />
            {t("configured_count", { count })}
          </Badge>
        ) : undefined
      }
    >
      {content}
    </CollapsibleSettingsCard>
  );
}
