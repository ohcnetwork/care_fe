import { zodResolver } from "@hookform/resolvers/zod";
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

import {
  BuilderState,
  builderReducer,
} from "@/components/QuestionnaireV2/builder/builderReducer";
import type { OrganizationSelection } from "@/components/QuestionnaireV2/manage/OrganizationsField";
import {
  DetailFormValues,
  questionnaireBasicSchema,
} from "@/components/QuestionnaireV2/manage/questionnaireFormSchema";
import { useUpdateQuestionnaire } from "@/components/QuestionnaireV2/manage/useUpdateQuestionnaire";
import { buildUpdateBody } from "@/components/QuestionnaireV2/shared/buildUpdateBody";
import { normalizeQuestionnaireActions } from "@/types/questionnaire/actions";
import {
  QuestionnaireRead,
  QuestionnaireScope,
} from "@/types/questionnaire/questionnaire";

const INITIAL_STATE: BuilderState = {
  questions: [],
  actions: [],
  selectedId: null,
  dirty: false,
};

function metadataValues(questionnaire: QuestionnaireRead): DetailFormValues {
  return {
    title: questionnaire.title,
    slug: questionnaire.slug,
    description: questionnaire.description ?? "",
    status: questionnaire.status,
  };
}

function metadataMatches(a: DetailFormValues, b: DetailFormValues) {
  return (
    a.title === b.title &&
    a.slug === b.slug &&
    a.description === b.description &&
    a.status === b.status
  );
}

interface UseStudioDraftOptions {
  id: string;
  scope: QuestionnaireScope;
  questionnaire: QuestionnaireRead | undefined;
}

/** Owns the editable question tree, metadata and access changes together
 * with their save/discard lifecycle. Display selection and validation remain
 * outside this hook; only a validated submission calls saveDraft. */
export function useStudioDraft({
  id,
  scope,
  questionnaire,
}: UseStudioDraftOptions) {
  const { t } = useTranslation();
  const [state, reactDispatch] = useReducer(builderReducer, INITIAL_STATE);
  // Resets come from the server or Discard. Every other dispatch counts so
  // an in-flight save cannot overwrite a newer edit or selection.
  const dispatchSeqRef = useRef(0);
  const dispatch = useCallback<typeof reactDispatch>(
    (action) => {
      if (action.type !== "reset") dispatchSeqRef.current += 1;
      reactDispatch(action);
    },
    [reactDispatch],
  );

  const loadQuestionnaire = useEffectEvent((loaded: QuestionnaireRead) => {
    if (state.dirty) return;
    dispatch({
      type: "reset",
      questions: loaded.questions,
      actions: normalizeQuestionnaireActions(loaded.actions),
      keepSelectedId: state.selectedId,
    });
  });
  useEffect(() => {
    // Refetches refresh a clean draft, but never discard unsaved questions.
    // Read the current dirty/selection state without re-seeding on edits.
    if (questionnaire) loadQuestionnaire(questionnaire);
  }, [questionnaire]);

  const metaSchema = useMemo(() => questionnaireBasicSchema(t), [t]);
  const form = useForm<DetailFormValues>({
    resolver: zodResolver(metaSchema),
    values: questionnaire ? metadataValues(questionnaire) : undefined,
    resetOptions: { keepDirtyValues: true },
  });
  const [organizationDraft, setOrganizationDraft] =
    useState<OrganizationSelection | null>(null);
  const dirty =
    state.dirty || form.formState.isDirty || organizationDraft !== null;

  const [metaTitle, metaDescription] = useWatch({
    control: form.control,
    name: ["title", "description"],
  });
  // The preview provider merges responses when this identity changes, so
  // edits can refresh the canvas without clearing its entered responses.
  const draft = useMemo(
    () =>
      questionnaire
        ? {
            ...questionnaire,
            title: metaTitle || questionnaire.title,
            description: metaDescription ?? questionnaire.description,
            questions: state.questions,
          }
        : undefined,
    [questionnaire, state.questions, metaTitle, metaDescription],
  );

  const saveDispatchSeqRef = useRef(0);
  const saveMetaRef = useRef<DetailFormValues | null>(null);
  const savedOrganizationsRef = useRef<OrganizationSelection | null>(null);
  const { mutate: save, isPending } = useUpdateQuestionnaire(id, (updated) => {
    const questionsEditedDuringFlight =
      dispatchSeqRef.current !== saveDispatchSeqRef.current;
    // isDirty alone cannot detect a second edit to an already-dirty field.
    // Compare the submitted metadata to live values before resetting it.
    const metaEditedDuringFlight =
      !saveMetaRef.current ||
      !metadataMatches(saveMetaRef.current, form.getValues());

    // Each draft part resets independently. The mutation has already updated
    // the query cache, so revision badges advance even if newer edits remain.
    if (!questionsEditedDuringFlight) {
      dispatch({
        type: "reset",
        questions: updated.questions,
        actions: normalizeQuestionnaireActions(updated.actions),
        keepSelectedId: state.selectedId,
      });
    }
    setOrganizationDraft((current) =>
      current === savedOrganizationsRef.current ? null : current,
    );
    if (!metaEditedDuringFlight) form.reset(metadataValues(updated));
  });

  const saveDraft = (meta: DetailFormValues) => {
    if (!questionnaire) return;
    // Capture exactly what this PUT includes; the response may arrive after
    // the author has continued editing any of these three draft parts.
    saveDispatchSeqRef.current = dispatchSeqRef.current;
    saveMetaRef.current = meta;
    savedOrganizationsRef.current = organizationDraft;
    save(
      buildUpdateBody(questionnaire, {
        questions: state.questions,
        actions: state.actions,
        title: meta.title,
        slug: meta.slug,
        description: meta.description,
        status: meta.status,
      }),
      organizationDraft ? { scope, ...organizationDraft } : undefined,
    );
  };

  const discardDraft = () => {
    if (!questionnaire) return;
    setOrganizationDraft(null);
    dispatch({
      type: "reset",
      questions: questionnaire.questions,
      actions: normalizeQuestionnaireActions(questionnaire.actions),
      keepSelectedId: state.selectedId,
    });
    form.reset(metadataValues(questionnaire));
  };

  return {
    state,
    dispatch,
    form,
    draft,
    organizationDraft,
    setOrganizationDraft,
    dirty,
    isPending,
    saveDraft,
    discardDraft,
  };
}
