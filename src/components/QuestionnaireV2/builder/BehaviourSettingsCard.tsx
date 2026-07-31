import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";

import { ChoiceChip } from "@/components/QuestionnaireV2/shared/ChoiceChip";
import { CollapsibleSettingsCard } from "@/components/QuestionnaireV2/shared/CollapsibleSettingsCard";

import { Question } from "@/types/questionnaire/question";

interface BehaviourSettingsCardProps {
  question: Question;
  onChange: (patch: Partial<Question>) => void;
}

const BEHAVIOUR_FLAGS = [
  { key: "required", label: "required" },
  { key: "read_only", label: "read_only" },
] as const;

const DATA_CAPTURE_FLAGS = [
  { key: "is_component", label: "component" },
  { key: "collect_time", label: "collect_time" },
  { key: "collect_performer", label: "collect_performer" },
  { key: "collect_method", label: "collect_method" },
  { key: "collect_body_site", label: "collect_body_site" },
] as const;

export function BehaviourSettingsCard({
  question,
  onChange,
}: BehaviourSettingsCardProps) {
  const { t } = useTranslation();

  // Derived from the same flag lists that render the chips, so adding a
  // flag can never silently miss the "configured" badge count.
  const count = [...BEHAVIOUR_FLAGS, ...DATA_CAPTURE_FLAGS].filter(
    (flag) => question[flag.key],
  ).length;

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
      <div className="space-y-4">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-gray-500">{t("behaviour")}</p>
          <div className="flex flex-wrap gap-2">
            {BEHAVIOUR_FLAGS.map((flag) => (
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

        <div className="space-y-1.5">
          <p className="text-xs font-medium text-gray-500">
            {t("data_capture")}
          </p>
          <div className="flex flex-wrap gap-2">
            {DATA_CAPTURE_FLAGS.map((flag) => (
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
      </div>
    </CollapsibleSettingsCard>
  );
}
