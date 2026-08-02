import { Suspense, useCallback, useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";

import { FormSkeleton } from "@/components/Common/SkeletonLoading";

import {
  useClearQuestionErrors,
  useQuestionErrors,
  useQuestionResponse,
} from "@/components/QuestionnaireV2/renderer/store";
import {
  getStructuredTypesVersion,
  subscribeToStructuredTypes,
} from "@/components/QuestionnaireV2/structured/pluginRegistry";
import {
  resolveStructuredType,
  structuredTypeLabel,
} from "@/components/QuestionnaireV2/structured/registry";

import type { ResponseValue } from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";

import { useFormRenderer } from "./FormContext";

/**
 * Structured questions render through `resolveStructuredType` — core types
 * from STRUCTURED_TYPE_REGISTRY, plugin types from the runtime registry,
 * one definition either way carrying the component and its context
 * requirements. Fill-path specifics:
 * - `onChange` is memoized — adapters keep their derived callbacks stable
 *   on top of it (ChargeItemQuestion lists the callback in an effect
 *   dependency array, so a fresh arrow per render is a real loop hazard).
 * - fill mode passes `questionnaireId`/`questionnaireSlug` so
 *   MedicationRequest/ServiceRequest response-template sheets work;
 *   preview deliberately withholds them, keeping template CRUD (real
 *   POSTs) off the builder surface.
 */
export function StructuredSlot({
  question,
  disabled,
}: {
  question: Question;
  disabled: boolean;
}) {
  const { t } = useTranslation();
  const { mode, subject, questionnaire } = useFormRenderer();
  // Plugins register their types as their remote module loads, which can
  // land after this slot first renders — subscribing re-resolves instead of
  // leaving a permanent "requires a plugin" notice on screen.
  useSyncExternalStore(
    subscribeToStructuredTypes,
    getStructuredTypesVersion,
    getStructuredTypesVersion,
  );
  const [response, updateResponse] = useQuestionResponse(question.id);
  const errors = useQuestionErrors(question.id);
  const clearErrors = useClearQuestionErrors(question.id);

  const handleChange = useCallback(
    (values: ResponseValue[], note?: string) =>
      updateResponse({ values, note }),
    [updateResponse],
  );

  const definition = question.structured_type
    ? resolveStructuredType(question.structured_type)
    : undefined;

  // A type this deployment doesn't have (plugin disabled or removed after
  // the questionnaire was authored) — say so instead of rendering nothing,
  // which would read as an empty question.
  if (question.structured_type && !definition) {
    return (
      <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
        {t("structured_type_plugin_missing", {
          type: question.structured_type,
        })}
      </div>
    );
  }
  if (!definition || !response) return null;

  const label = structuredTypeLabel(definition.type, t);

  if (!definition.subjects.includes(questionnaire.subject_type)) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
        {t("structured_type_subject_mismatch", {
          type: label,
          subject: questionnaire.subject_type,
        })}
      </div>
    );
  }

  const missing = definition.requires.filter((key) => !subject[key]);
  if (missing.length > 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
        <p className="font-medium text-gray-700">{label}</p>
        <p>
          {t("structured_question_requires_context", {
            contexts: missing.map((key) => t(`context__${key}`)).join(", "),
          })}
        </p>
      </div>
    );
  }

  const Component = definition.component;
  return (
    // Plugin components arrive through React.lazy — the boundary keeps a
    // still-loading remote from suspending the whole form.
    <Suspense fallback={<FormSkeleton rows={2} />}>
      <Component
        question={question}
        response={response}
        onChange={handleChange}
        disabled={disabled}
        errors={errors}
        clearError={clearErrors}
        patientId={subject.patientId}
        encounterId={subject.encounterId}
        facilityId={subject.facilityId}
        {...(mode === "fill"
          ? {
              questionnaireId: questionnaire.id,
              questionnaireSlug: questionnaire.slug,
            }
          : {})}
      />
    </Suspense>
  );
}
