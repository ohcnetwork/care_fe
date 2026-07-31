import {
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  GripVertical,
  ListChecks,
  MoreVertical,
  Plus,
  SquarePen,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { QuestionTypeBadge } from "@/components/QuestionnaireV2/shared/QuestionTypeBadge";

import { cn } from "@/lib/utils";

import { Question } from "@/types/questionnaire/question";

interface QuestionOverviewListProps {
  questions: Question[];
  isSaving: boolean;
  /** When false, every mutation affordance (edit/import/reorder) is hidden. */
  canWrite: boolean;
  onReorder: (from: number, to: number) => void;
  onEditQuestions: () => void;
  onImportQuestions: () => void;
}

export function QuestionOverviewList({
  questions,
  isSaving,
  canWrite,
  onReorder,
  onEditQuestions,
  onImportQuestions,
}: QuestionOverviewListProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  // Native HTML5 drag-and-drop reorder for top-level rows: the source index
  // lives in a ref (dataTransfer as a fallback), the current hover target in
  // state so the drop indicator re-renders.
  const dragFromIndex = useRef<number | null>(null);
  const [dropTarget, setDropTarget] = useState<number | null>(null);

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const clearDrag = () => {
    dragFromIndex.current = null;
    setDropTarget(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xl font-semibold text-gray-900">
          {t("questions")}
        </h3>
        {canWrite && (
          <Button
            // Rendered inside the detail page's <form> — without an explicit
            // type this would double as a submit button and fire a PUT.
            type="button"
            variant="outline"
            size="sm"
            onClick={onEditQuestions}
          >
            <SquarePen className="mr-2 size-4" />
            {t("edit_questions")}
          </Button>
        )}
      </div>

      {questions.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
            <ListChecks className="size-6 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-900">
              {t("no_questions_added_yet")}
            </p>
            <p className="text-sm text-gray-500">
              {t("import_questions_hint")}
            </p>
          </div>
          {canWrite && (
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                type="button"
                variant="outline_primary"
                onClick={onEditQuestions}
              >
                <Plus className="size-4" />
                {t("add_first_question")}
              </Button>
              <span className="text-xs font-medium uppercase text-gray-400">
                {t("or")}
              </span>
              <Button
                type="button"
                variant="outline"
                onClick={onImportQuestions}
              >
                <Upload className="size-4" />
                {t("import_questions")}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {questions.map((question, index) => {
            const subQuestions = question.questions ?? [];
            const isExpanded = expanded.has(question.id);
            const isDropTarget =
              dropTarget === index &&
              dragFromIndex.current !== null &&
              dragFromIndex.current !== index;
            const dropBelow =
              isDropTarget && (dragFromIndex.current ?? 0) < index;

            return (
              <div
                key={question.id}
                draggable={canWrite && !isSaving}
                onDragStart={(e) => {
                  dragFromIndex.current = index;
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", String(index));
                }}
                onDragEnd={clearDrag}
                onDragOver={(e) => {
                  if (dragFromIndex.current === null) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  if (dropTarget !== index) setDropTarget(index);
                }}
                onDragLeave={() => {
                  if (dropTarget === index) setDropTarget(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const from =
                    dragFromIndex.current ??
                    Number(e.dataTransfer.getData("text/plain"));
                  clearDrag();
                  if (!Number.isInteger(from) || from === index) return;
                  onReorder(from, index);
                }}
                className={cn(
                  "relative flex items-stretch gap-2 rounded-md bg-gray-50 p-2",
                  // Drop indicator: a rule on the edge the row will land on.
                  isDropTarget &&
                    !dropBelow &&
                    "before:absolute before:inset-x-1 before:-top-1.5 before:h-0.5 before:rounded-full before:bg-primary-500",
                  isDropTarget &&
                    dropBelow &&
                    "before:absolute before:inset-x-1 before:-bottom-1.5 before:h-0.5 before:rounded-full before:bg-primary-500",
                )}
              >
                {canWrite && (
                  <div
                    className="flex cursor-grab items-center px-1 text-gray-400 active:cursor-grabbing"
                    aria-hidden
                  >
                    <GripVertical className="size-4" />
                  </div>
                )}
                <div className="min-w-0 flex-1 rounded-md border border-gray-200 bg-white p-3">
                  <div className="flex items-start gap-2">
                    <span className="text-sm text-gray-500">{index + 1}.</span>
                    <span className="min-w-0 text-sm font-medium text-gray-900">
                      {question.text}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 pl-6">
                    <QuestionTypeBadge type={question.type} />
                    {subQuestions.length > 0 && (
                      <>
                        <Badge variant="secondary">
                          {t("sub_questions_count", {
                            count: subQuestions.length,
                          })}
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-6"
                          onClick={() => toggleExpanded(question.id)}
                          aria-label={t("toggle_sub_questions")}
                        >
                          <ChevronsUpDown className="size-4" />
                        </Button>
                      </>
                    )}
                  </div>

                  {isExpanded && subQuestions.length > 0 && (
                    <div className="mt-2 space-y-1 border-t border-gray-100 pl-4 pt-2">
                      {subQuestions.map((child) => (
                        <p key={child.id} className="text-sm text-gray-600">
                          {child.text}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
                {canWrite && (
                  <div className="flex items-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-9"
                          aria-label={t("more_options")}
                        >
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          disabled={index === 0 || isSaving}
                          onClick={() => onReorder(index, index - 1)}
                        >
                          <ChevronUp className="size-4" />
                          {t("move_up")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={index === questions.length - 1 || isSaving}
                          onClick={() => onReorder(index, index + 1)}
                        >
                          <ChevronDown className="size-4" />
                          {t("move_down")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onEditQuestions}>
                          <SquarePen className="size-4" />
                          {t("edit")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            );
          })}
          {canWrite && (
            <Button
              type="button"
              variant="outline_primary"
              className="w-full border-dashed"
              onClick={onEditQuestions}
            >
              <Plus className="size-4" />
              {t("add_question")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
