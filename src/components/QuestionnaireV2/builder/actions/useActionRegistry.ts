import { useQuery } from "@tanstack/react-query";

import { actionRegistryKeys } from "@/components/QuestionnaireV2/queryKeys";

import actionApi from "@/types/questionnaire/actionApi";
import {
  ActionContextField,
  ActionInstructionDefinition,
} from "@/types/questionnaire/actions";
import query from "@/Utils/request/query";

import { dedupeContextFields } from "@/components/QuestionnaireV2/builder/actionVariables";

/** Registries are module-level on the backend — they change on deploy,
 *  not per request. */
const REGISTRY_STALE_TIME = 10 * 60 * 1000;

export interface ActionRegistry {
  /** Undefined while loading or after a failure — validation rules that
   *  need the registry stand down on undefined (see `actionValidation`). */
  instructions: ActionInstructionDefinition[] | undefined;
  fields: ActionContextField[];
  isLoading: boolean;
  isError: boolean;
}

/** What the backend can run (`instructions`) and what a condition may read
 *  (`fields`), fetched once per session. */
export function useActionRegistry(): ActionRegistry {
  const instructions = useQuery({
    queryKey: actionRegistryKeys.instructions(),
    queryFn: query(actionApi.instructions),
    staleTime: REGISTRY_STALE_TIME,
    select: (data: { instructions: ActionInstructionDefinition[] }) =>
      data.instructions,
  });
  const fields = useQuery({
    queryKey: actionRegistryKeys.fields(),
    queryFn: query(actionApi.fields),
    staleTime: REGISTRY_STALE_TIME,
    select: (data: { fields: ActionContextField[] }) =>
      dedupeContextFields(data.fields),
  });
  return {
    instructions: instructions.data,
    fields: fields.data ?? [],
    isLoading: instructions.isLoading || fields.isLoading,
    isError: instructions.isError || fields.isError,
  };
}
