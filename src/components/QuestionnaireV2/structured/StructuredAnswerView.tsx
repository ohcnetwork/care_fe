import { Suspense, useSyncExternalStore } from "react";

import { PluginErrorBoundary } from "@/components/Common/PluginErrorBoundary";
import { FormSkeleton } from "@/components/Common/SkeletonLoading";

import {
  getStructuredTypesVersion,
  subscribeToStructuredTypes,
} from "@/components/QuestionnaireV2/structured/pluginRegistry";
import { resolveStructuredType } from "@/components/QuestionnaireV2/structured/registry";

import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";

const noop = () => {};
const NO_ERRORS: never[] = [];

/**
 * Renders a stored structured answer read-only, through the type's own
 * `component` — the same one the fill page mounts, `disabled`. Callers
 * pass the response `storedStructuredAnswer` returned, so the type is
 * known to resolve; the registry subscription keeps a late-loading
 * plugin's answer from staying blank until a reload.
 */
export function StructuredAnswerView({
  question,
  response,
  patientId,
  encounterId,
}: {
  question: Question;
  response: QuestionnaireResponse;
  patientId?: string;
  encounterId?: string;
}) {
  useSyncExternalStore(
    subscribeToStructuredTypes,
    getStructuredTypesVersion,
    getStructuredTypesVersion,
  );
  const definition = question.structured_type
    ? resolveStructuredType(question.structured_type)
    : undefined;
  if (!definition) return null;
  const Component = definition.component;
  return (
    <PluginErrorBoundary pluginName={definition.type} fallback={null}>
      <Suspense fallback={<FormSkeleton rows={2} />}>
        <Component
          question={question}
          response={response}
          onChange={noop}
          disabled
          errors={NO_ERRORS}
          clearError={noop}
          patientId={patientId}
          encounterId={encounterId}
        />
      </Suspense>
    </PluginErrorBoundary>
  );
}
