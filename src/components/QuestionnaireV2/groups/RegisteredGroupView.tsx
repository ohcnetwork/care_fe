import { Suspense, useSyncExternalStore, type ReactNode } from "react";

import { PluginErrorBoundary } from "@/components/Common/PluginErrorBoundary";

import {
  getQuestionGroup,
  getQuestionGroupsVersion,
  subscribeToQuestionGroups,
  type GroupInputProps,
} from "./registry";

export function RegisteredGroupView({
  fallback,
  ...props
}: GroupInputProps & { fallback: ReactNode }) {
  useSyncExternalStore(
    subscribeToQuestionGroups,
    getQuestionGroupsVersion,
    getQuestionGroupsVersion,
  );
  const definition = props.question.structured_type
    ? getQuestionGroup(props.question.structured_type)
    : undefined;
  if (!definition) return <>{fallback}</>;
  const Component = definition.component;
  return (
    <PluginErrorBoundary
      pluginName={definition.type}
      resetKey={definition}
      fallback={fallback}
    >
      <Suspense fallback={fallback}>
        <Component {...props} />
      </Suspense>
    </PluginErrorBoundary>
  );
}
