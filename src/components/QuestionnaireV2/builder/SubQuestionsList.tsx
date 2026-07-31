import {
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Plus,
  Trash2,
} from "lucide-react";
import { Dispatch, useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { QuestionTypeBadge } from "@/components/QuestionnaireV2/shared/QuestionTypeBadge";

import {
  BuilderAction,
  collectIds,
  findQuestion,
} from "@/components/QuestionnaireV2/builder/builderReducer";

import { Question } from "@/types/questionnaire/question";

interface SubQuestionsListProps {
  question: Question;
  dispatch: Dispatch<BuilderAction>;
}

const LAYOUT_OPTIONS = [
  { value: "grid grid-cols-1", label: "layout_single_column" },
  { value: "grid grid-cols-2", label: "layout_two_columns" },
  { value: "grid grid-cols-[2fr_1fr]", label: "layout_wide_start" },
  { value: "grid grid-cols-[1fr_2fr]", label: "layout_wide_end" },
] as const;

interface GroupTarget {
  id: string;
  label: string;
}

function collectGroupTargets(
  question: Question,
  excludeIds: Set<string>,
  untitledLabel: string,
): GroupTarget[] {
  if (excludeIds.has(question.id)) return [];
  const targets: GroupTarget[] = [
    { id: question.id, label: question.text || untitledLabel },
  ];
  for (const child of question.questions ?? []) {
    if (child.type === "group") {
      targets.push(...collectGroupTargets(child, excludeIds, untitledLabel));
    }
  }
  return targets;
}

export function SubQuestionsList({
  question,
  dispatch,
}: SubQuestionsListProps) {
  const { t } = useTranslation();
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [moveOpen, setMoveOpen] = useState(false);
  const [moveTargetId, setMoveTargetId] = useState<string>("");
  const [movePosition, setMovePosition] = useState(0);

  if (question.type !== "group") return null;

  const children = question.questions ?? [];
  const layoutValue =
    question.styling_metadata?.classes ?? LAYOUT_OPTIONS[0].value;

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
        styling_metadata: { ...question.styling_metadata, classes: value },
      },
    });
  };

  const handleBulkDelete = () => {
    dispatch({ type: "removeQuestions", ids: Array.from(checked) });
    setChecked(new Set());
  };

  const openMoveDialog = () => {
    setMoveTargetId(question.id);
    setMovePosition(0);
    setMoveOpen(true);
  };

  const movedSubtreeIds = new Set(
    Array.from(checked).flatMap((id) => {
      const found = findQuestion(children, id);
      return found ? collectIds(found) : [id];
    }),
  );
  const groupTargets = collectGroupTargets(
    question,
    movedSubtreeIds,
    t("untitled_question"),
  );
  const targetQuestion = findQuestion([question], moveTargetId);
  const maxPosition = targetQuestion?.questions?.length ?? 0;

  const handleConfirmMove = () => {
    dispatch({
      type: "moveQuestions",
      ids: Array.from(checked),
      targetParentId: moveTargetId,
      index: Math.min(Math.max(movePosition, 0), maxPosition),
    });
    setChecked(new Set());
    setMoveOpen(false);
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

      {checked.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-md bg-gray-50 p-2">
          <span className="text-sm text-gray-700">
            {t("sub_questions_selected", { count: checked.size })}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setChecked(new Set())}
          >
            {t("clear_selection")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={handleBulkDelete}
          >
            {t("delete")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={openMoveDialog}
          >
            {t("move_n_questions", { count: checked.size })}
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {children.map((child, index) => (
          <div
            key={child.id}
            className="flex items-center gap-2 rounded-md border border-gray-200 bg-white p-2"
          >
            <Checkbox
              checked={checked.has(child.id)}
              onCheckedChange={(value) => toggleChecked(child.id, !!value)}
              aria-label={child.text || t("untitled_question")}
            />
            <span className="w-6 shrink-0 text-sm text-gray-500">
              {index + 1}.
            </span>
            <button
              type="button"
              className="min-w-0 flex-1 truncate text-left text-sm text-gray-900"
              onClick={() => dispatch({ type: "select", id: child.id })}
            >
              {child.text || (
                <span className="italic text-gray-400">
                  {t("untitled_question")}
                </span>
              )}
            </button>
            <QuestionTypeBadge type={child.type} />
            {child.required && (
              <Badge variant="secondary">{t("required")}</Badge>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-6"
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
              className="size-6"
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
                  className="size-6"
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

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => dispatch({ type: "addQuestion", parentId: question.id })}
      >
        <Plus className="size-4" />
        {t("add_sub_question")}
      </Button>

      <Dialog open={moveOpen} onOpenChange={setMoveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("move_n_questions", { count: checked.size })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-xs text-gray-500">{t("group")}</p>
              <Select value={moveTargetId} onValueChange={setMoveTargetId}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {groupTargets.map((target) => (
                    <SelectItem key={target.id} value={target.id}>
                      {target.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-500">{t("position")}</p>
              <Input
                type="number"
                min={0}
                max={maxPosition}
                value={movePosition}
                onChange={(e) => setMovePosition(Number(e.target.value) || 0)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setMoveOpen(false)}
            >
              {t("cancel")}
            </Button>
            <Button type="button" onClick={handleConfirmMove}>
              {t("move")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
