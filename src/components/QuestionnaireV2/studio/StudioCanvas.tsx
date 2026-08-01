import { ArrowDown, ArrowUp, Copy, EyeOff, Plus, Trash2 } from "lucide-react";
import { Dispatch, createContext, useContext, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { BuilderAction } from "@/components/QuestionnaireV2/builder/builderReducer";
import {
  FormChrome,
  QuestionShellProps,
} from "@/components/QuestionnaireV2/form/chrome";
import { QuestionnaireFormCanvas } from "@/components/QuestionnaireV2/form/FormCanvas";

interface StudioCanvasContextValue {
  editing: boolean;
  selectedId: string | null;
  onSelectQuestion: (id: string) => void;
  dispatch: Dispatch<BuilderAction>;
}

const StudioCanvasContext = createContext<StudioCanvasContextValue | null>(
  null,
);

function useStudioCanvas(): StudioCanvasContextValue {
  const context = useContext(StudioCanvasContext);
  if (!context) {
    throw new Error("Studio chrome rendered outside StudioCanvas");
  }
  return context;
}

/**
 * The selection chrome injected into the form renderer's decoration seam.
 * Module-level components (never recreated per render) — a per-render
 * component identity would remount the whole canvas subtree on every
 * selection change.
 */
function StudioQuestionShell({
  question,
  index,
  siblingCount,
  depth,
  hiddenByLogic,
  children,
}: QuestionShellProps) {
  const { t } = useTranslation();
  const studio = useStudioCanvas();

  // Preview mode renders the plain form; deep nesting (inside nested
  // groups) is edited from the outline/inspector, not decorated in place.
  if (!studio.editing || depth >= 2) return <>{children}</>;

  const selected = studio.selectedId === question.id;

  const toolbarButton = (
    label: string,
    Icon: typeof ArrowUp,
    onClick: () => void,
    options?: { disabled?: boolean; destructive?: boolean },
  ) => (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={options?.disabled}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className={cn(
        "flex size-7 items-center justify-center rounded-md text-gray-500 transition-colors disabled:opacity-40",
        options?.destructive
          ? "hover:bg-red-50 hover:text-red-600"
          : "hover:bg-gray-100 hover:text-gray-900",
      )}
    >
      <Icon className="size-3.5" />
    </button>
  );

  return (
    // The inner form content is `inert` on the edit canvas, so this wrapper
    // is the click target; keyboard selection goes through the outline tree,
    // which lists every question as a real button.
    <div
      data-qid={question.id}
      onClick={(event) => {
        event.stopPropagation();
        studio.onSelectQuestion(question.id);
      }}
      className={cn(
        "relative cursor-pointer rounded-xl transition-shadow",
        selected
          ? "ring-2 ring-primary-600 ring-offset-2"
          : "hover:ring-1 hover:ring-gray-300 hover:ring-offset-2",
      )}
    >
      {selected && (
        <>
          <span
            aria-hidden
            className="pointer-events-none absolute -top-2.5 left-3 z-10 rounded bg-primary-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
          >
            {t("editing")}
          </span>
          <div className="absolute -top-4 right-3 z-10 flex items-center gap-0.5 rounded-lg border border-gray-200 bg-white p-0.5 shadow-md">
            {toolbarButton(
              t("move_question_up"),
              ArrowUp,
              () =>
                studio.dispatch({
                  type: "moveQuestion",
                  id: question.id,
                  direction: "up",
                }),
              { disabled: index === 0 },
            )}
            {toolbarButton(
              t("move_question_down"),
              ArrowDown,
              () =>
                studio.dispatch({
                  type: "moveQuestion",
                  id: question.id,
                  direction: "down",
                }),
              { disabled: index === siblingCount - 1 },
            )}
            <span aria-hidden className="mx-0.5 h-4 w-px bg-gray-200" />
            {toolbarButton(t("duplicate_question"), Copy, () =>
              studio.dispatch({ type: "duplicateQuestion", id: question.id }),
            )}
            {toolbarButton(
              t("delete_question"),
              Trash2,
              () =>
                studio.dispatch({
                  type: "removeQuestions",
                  ids: [question.id],
                }),
              { destructive: true },
            )}
          </div>
        </>
      )}
      {hiddenByLogic && (
        <span className="pointer-events-none absolute -top-2.5 right-3 z-10 flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
          <EyeOff className="size-3" />
          {t("hidden_by_conditions")}
        </span>
      )}
      {children}
    </div>
  );
}

function StudioAppendZone({ parentId }: { parentId: string | null }) {
  const { t } = useTranslation();
  const studio = useStudioCanvas();
  if (!studio.editing) return null;

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        studio.dispatch({ type: "addQuestion", parentId });
      }}
      className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 bg-transparent py-2 text-xs font-semibold text-gray-500 hover:border-primary-500 hover:text-primary-700"
    >
      <Plus className="size-3.5" />
      {parentId ? t("add_question_here") : t("add_new_question")}
    </button>
  );
}

const STUDIO_CHROME: FormChrome = {
  QuestionShell: StudioQuestionShell,
  AppendZone: StudioAppendZone,
};

export interface StudioCanvasProps {
  editing: boolean;
  selectedId: string | null;
  onSelectQuestion: (id: string) => void;
  dispatch: Dispatch<BuilderAction>;
  /** Bumped by outline/issue selection to scroll the question into view —
   *  canvas clicks don't scroll (the question is already on screen). */
  scrollRequest: { id: string; nonce: number } | null;
  emptyState?: React.ReactNode;
}

/** The center pane: the live form canvas with studio chrome. Must render
 *  inside the page's `QuestionnaireFormProvider`. */
export function StudioCanvas({
  editing,
  selectedId,
  onSelectQuestion,
  dispatch,
  scrollRequest,
  emptyState,
}: StudioCanvasProps) {
  useEffect(() => {
    if (!scrollRequest) return;
    document
      .querySelector(`[data-qid="${CSS.escape(scrollRequest.id)}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [scrollRequest]);

  return (
    <StudioCanvasContext.Provider
      value={{ editing, selectedId, onSelectQuestion, dispatch }}
    >
      <QuestionnaireFormCanvas
        chrome={STUDIO_CHROME}
        emptyState={emptyState}
        // The edit canvas needs breathing room for the floating toolbar and
        // ring offsets.
        className={cn(editing && "px-1 pt-2")}
      />
    </StudioCanvasContext.Provider>
  );
}
