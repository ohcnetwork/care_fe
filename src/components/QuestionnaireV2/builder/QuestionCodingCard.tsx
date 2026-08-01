import { Check, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import { CollapsibleSettingsCard } from "@/components/QuestionnaireV2/shared/CollapsibleSettingsCard";

import { Code, ValueSetSystem } from "@/types/base/code/code";
import { Question } from "@/types/questionnaire/question";
import { TERMINOLOGY_SYSTEMS } from "@/types/valueSet/valueSet";

/**
 * Mirrors the backend's CARE_OBSERVATION_VALUSET slug
 * (care/emr/resources/observation/valueset.py). `Question.code` is a
 * `ValueSetBoundCoding[CARE_OBSERVATION_VALUSET.slug]`
 * (care/emr/resources/questionnaire/spec.py), so a question code MUST be a
 * member of this valueset — arbitrary manually-typed codes are rejected at
 * save time, which is why this card only offers search-based selection.
 */
const OBSERVATION_VALUESET_SLUG: ValueSetSystem = "system-observation";

/** "http://loinc.org" -> "LOINC"; unknown systems fall back to the raw URI. */
function systemLabel(system: string): string {
  const entry = Object.entries(TERMINOLOGY_SYSTEMS).find(
    ([, url]) => url === system,
  );
  return entry ? entry[0] : system;
}

interface QuestionCodingCardProps {
  question: Question;
  onChange: (patch: Partial<Question>) => void;
}

export function QuestionCodingCard({
  question,
  onChange,
}: QuestionCodingCardProps) {
  const { t } = useTranslation();
  const code = question.code;

  const handleSelect = (selected: Code) => {
    // Straight from the valueset expansion — membership is guaranteed, so
    // the code is verified by construction (no manual verify step).
    onChange({
      code: {
        system: selected.system,
        code: selected.code,
        display: selected.display,
      },
    });
  };

  return (
    <CollapsibleSettingsCard
      title={
        code?.code
          ? `${systemLabel(code.system)}: ${code.code}`
          : t("coding_details")
      }
      subtitle={code?.display}
      badge={
        code?.code ? (
          <Badge variant="green">
            <Check className="size-3" />
            {t("code_verified")}
          </Badge>
        ) : undefined
      }
    >
      {code?.code ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md border border-gray-200 bg-gray-50 p-3">
          <Badge variant="outline">{systemLabel(code.system)}</Badge>
          <span className="font-mono text-sm text-gray-900">{code.code}</span>
          <span className="min-w-0 flex-1 truncate text-sm text-gray-600">
            {code.display}
          </span>
          <div className="flex shrink-0 items-center gap-1">
            <ValueSetSelect
              system={OBSERVATION_VALUESET_SLUG}
              value={null}
              placeholder={t("change")}
              aria-label={t("change")}
              onSelect={handleSelect}
              showCode
              variant="ghost"
              size="sm"
              className="font-medium text-gray-700"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => onChange({ code: undefined })}
            >
              <Trash2 className="size-4" />
              {t("remove")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            {t("question_coding_explainer")}
          </p>
          <ValueSetSelect
            system={OBSERVATION_VALUESET_SLUG}
            value={null}
            placeholder={t("search_for_observation_codes")}
            aria-label={t("search_for_observation_codes")}
            onSelect={handleSelect}
            showCode
            className="w-full"
          />
        </div>
      )}
    </CollapsibleSettingsCard>
  );
}
