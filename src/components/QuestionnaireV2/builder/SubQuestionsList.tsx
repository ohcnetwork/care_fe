import {
  ChevronDown,
  ChevronUp,
  CornerUpRight,
  MoreVertical,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Dispatch, useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { BuilderAction } from "@/components/QuestionnaireV2/builder/builderReducer";
import { MoveQuestionsDialog } from "@/components/QuestionnaireV2/builder/MoveQuestionsDialog";
import { QuestionTypeBadge } from "@/components/QuestionnaireV2/shared/QuestionTypeBadge";

import { Question } from "@/types/questionnaire/question";

interface SubQuestionsListProps {
  question: Question;
  dispatch: Dispatch<BuilderAction>;
  /** The full question tree — the move dialog offers targets across it. */
  allQuestions: Question[];
}

const LAYOUT_OPTIONS = [
  { value: "grid grid-cols-1", label: "layout_single_column" },
  { value: "grid grid-cols-2", label: "layout_two_columns" },
  { value: "grid grid-cols-[2fr_1fr]", label: "layout_wide_start" },
  { value: "grid grid-cols-[1fr_2fr]", label: "layout_wide_end" },
] as const;

export function SubQuestionsList({
  question,
  dispatch,
  allQuestions,
}: SubQuestionsListProps) {
  const { t } = useTranslation();
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [moveOpen, setMoveOpen] = useState(false);

  if (question.type !== "group") return null;

  const children = question.questions ?? [];
  // Layout presets live in styling_metadata.containerClasses — the deployed
  // contract shared with the legacy editor (LAYOUT_OPTIONS →
  // containerClasses) and both renderers, which apply containerClasses to
  // the sub-question container and keep `classes` for outer decoration.
  const layoutValue =
    question.styling_metadata?.containerClasses ?? LAYOUT_OPTIONS[0].value;

  // `checked` can outlive a row once it's deleted via its own kebab menu
  // (that dispatch never touches this state). Deriving the effective
  // selection as the intersection with the current children keeps the
  // bulk-selection bar/count honest without needing to special-case every
  // place a question can be removed.
  const childIds = new Set(children.map((child) => child.id));
  const effectiveChecked = new Set(
    Array.from(checked).filter((id) => childIds.has(id)),
  );

  const toggleChecked = (id: string, next: boolean) => {
    setChecked((prev) => {
      const nextSet = new Set(prev);
      if (next) nextSet.add(id);
      else nextSet.delete(id);
      return nextSet;
    });
  };

  const handleLayoutChange = (value: string) => {
    dispatch({
      type: "updateQuestion",
      id: question.id,
      patch: {
        styling_metadata: {
          ...question.styling_metadata,
          containerClasses: value,
        },
      },
    });
  };

  const handleBulkDelete = () => {
    dispatch({ type: "removeQuestions", ids: Array.from(effectiveChecked) });
    setChecked(new Set());
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-gray-900">
          {t("sub_questions")}
        </h4>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{t("layout")}</span>
          <Select value={layoutValue} onValueChange={handleLayoutChange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LAYOUT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {t(option.label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        {children.map((child, index) => (
          <div
            key={child.id}
            className="flex flex-wrap items-center gap-2 rounded-md border border-gray-200 bg-white p-2"
          >
            <Checkbox
              checked={effectiveChecked.has(child.id)}
              onCheckedChange={(value) => toggleChecked(child.id, !!value)}
              aria-label={child.text || t("untitled_question")}
            />
            <span className="w-6 shrink-0 text-sm text-gray-500">
              {index + 1}.
            </span>
            {/* On phones the title takes its own full-width line (badges
                beneath it) so it never gets squeezed to zero width by the
                inline badges and buttons. */}
            <div className="flex min-w-0 flex-1 basis-full flex-col items-start gap-1 sm:basis-auto sm:flex-row sm:items-center sm:gap-2">
              <button
                type="button"
                className="w-full min-w-0 truncate text-left text-sm text-gray-900 sm:flex-1"
                onClick={() => dispatch({ type: "select", id: child.id })}
              >
                {child.text || (
                  <span className="italic text-gray-400">
                    {t("untitled_question")}
                  </span>
                )}
              </button>
              <div className="flex shrink-0 gap-1">
                <QuestionTypeBadge type={child.type} />
                {child.required && (
                  <Badge variant="secondary">{t("required")}</Badge>
                )}
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-6 shrink-0"
              disabled={index === 0}
              onClick={() =>
                dispatch({
                  type: "moveQuestion",
                  id: child.id,
                  direction: "up",
                })
              }
              aria-label={t("move_up")}
            >
              <ChevronUp className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-6 shrink-0"
              disabled={index === children.length - 1}
              onClick={() =>
                dispatch({
                  type: "moveQuestion",
                  id: child.id,
                  direction: "down",
                })
              }
              aria-label={t("move_down")}
            >
              <ChevronDown className="size-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6 shrink-0"
                  aria-label={t("more_options")}
                >
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() =>
                    dispatch({ type: "removeQuestions", ids: [child.id] })
                  }
                >
                  <Trash2 className="size-4" />
                  {t("delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>

      {/* Bulk bar sits below the rows, next to the checkboxes that drive it,
          with the actions flush right. */}
      {effectiveChecked.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-md bg-gray-50 p-2">
          <span className="mr-auto text-sm text-gray-700">
            {t("sub_questions_selected", { count: effectiveChecked.size })}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setChecked(new Set())}
          >
            <X className="size-4" />
            {t("clear_selection")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={handleBulkDelete}
          >
            <Trash2 className="size-4" />
            {t("delete")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setMoveOpen(true)}
          >
            <CornerUpRight className="size-4" />
            {t("move_n_questions", { count: effectiveChecked.size })}
          </Button>
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => dispatch({ type: "addQuestion", parentId: question.id })}
      >
        <Plus className="size-4" />
        {t("add_sub_question")}
      </Button>

      {/* Mounted only while open so its target/position state re-seeds on
          every open. */}
      {moveOpen && (
        <MoveQuestionsDialog
          allQuestions={allQuestions}
          selectedIds={Array.from(effectiveChecked)}
          defaultTargetId={question.id}
          onOpenChange={setMoveOpen}
          onMove={(targetParentId, index) => {
            dispatch({
              type: "moveQuestions",
              ids: Array.from(effectiveChecked),
              targetParentId,
              index,
            });
            setChecked(new Set());
            setMoveOpen(false);
          }}
        />
      )}
    </div>
  );
}
