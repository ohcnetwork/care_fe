import { Suspense, useCallback, useEffect, useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";

import { PluginErrorBoundary } from "@/components/Common/PluginErrorBoundary";
import { FormSkeleton } from "@/components/Common/SkeletonLoading";

import {
  useClearQuestionErrors,
  useClearStructuredRenderFailed,
  useMarkStructuredRenderFailed,
  useQuestionErrors,
  useQuestionResponse,
} from "@/components/QuestionnaireV2/form/engine/store";
import {
  getStructuredTypesVersion,
  subscribeToStructuredTypes,
} from "@/components/QuestionnaireV2/structured/pluginRegistry";
import {
  resolveStructuredSlotState,
  structuredTypeLabel,
} from "@/components/QuestionnaireV2/structured/registry";

import type { ResponseValue } from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";

import { useFormRenderer } from "./FormContext";

/**
 * Clears the question's render-failed mark when it mounts. Rendered INSIDE
 * the error boundary, beside the structured component: if the component
 * throws during the mounting render, the whole subtree — this probe
 * included — is discarded before effects run, so the clear only ever fires
 * for a commit whose input actually made it to the screen. That placement
 * is what makes the mark track reality across an unmount/remount cycle
 * (enable_when toggling the question): a recovered slot un-exempts itself,
 * a still-broken one re-marks via the boundary's onError.
 */
function ClearRenderFailedOnMount({ questionId }: { questionId: string }) {
  const clearRenderFailed = useClearStructuredRenderFailed(questionId);
  useEffect(() => {
    clearRenderFailed();
  }, [clearRenderFailed]);
  return null;
}

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
  const markRenderFailed = useMarkStructuredRenderFailed(question.id);

  const handleChange = useCallback(
    (values: ResponseValue[], note?: string) =>
      updateResponse({ values, note }),
    [updateResponse],
  );

  // The same resolution submit-time enforcement runs — see
  // `StructuredSlotState`'s parity note. Whatever this returns other than
  // "ready" renders a notice, not an input, so the question cannot be
  // answered and must not be required-blocked either.
  const state = question.structured_type
    ? resolveStructuredSlotState(
        question.structured_type,
        questionnaire.subject_type,
        subject,
      )
    : undefined;

  // A type this deployment doesn't have (plugin disabled or removed after
  // the questionnaire was authored) — say so instead of rendering nothing,
  // which would read as an empty question.
  if (state?.kind === "unknown_type") {
    return (
      <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
        {t("structured_type_plugin_missing", {
          type: question.structured_type,
        })}
      </div>
    );
  }
  if (!state || !response) return null;

  const { definition } = state;
  const label = structuredTypeLabel(definition.type, t);

  if (state.kind === "subject_mismatch") {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
        {t("structured_type_subject_mismatch", {
          type: label,
          // The raw enum reads as jargon in a clinician-facing notice; the
          // studio's own subject picker labels these the same way.
          subject: t(questionnaire.subject_type),
        })}
      </div>
    );
  }

  if (state.kind === "missing_context") {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
        <p className="font-medium text-gray-700">{label}</p>
        <p>
          {t("structured_question_requires_context", {
            contexts: state.missing
              .map((key) => t(`context__${key}`))
              .join(", "),
          })}
        </p>
      </div>
    );
  }

  const Component = definition.component;
  return (
    // Every other structured failure mode on this page degrades in place
    // (missing type → amber notice, subject mismatch → gray notice, thrown
    // validate/buildRequests → question-scoped error). A render throw was
    // the one that didn't: it unwound to the router's page boundary and
    // replaced the whole fill session — every other form, every answer
    // already typed — with the generic error screen. Contain it here, in
    // the same dashed notice the other degradations use.
    <PluginErrorBoundary
      pluginName={definition.type}
      // Once the notice is showing there is no input to answer, so
      // submit-time enforcement must stop requiring one — same reasoning
      // as the subject-mismatch and missing-context skips.
      onError={markRenderFailed}
      fallback={
        <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-medium">{label}</p>
          <p>{t("structured_question_render_failed")}</p>
        </div>
      }
    >
      <ClearRenderFailedOnMount questionId={question.id} />
      {/* Plugin components arrive through React.lazy — the boundary keeps
          a still-loading remote from suspending the whole form. */}
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
    </PluginErrorBoundary>
  );
}
