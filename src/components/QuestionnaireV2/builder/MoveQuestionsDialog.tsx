import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  collectIds,
  findQuestion,
} from "@/components/QuestionnaireV2/builder/builderReducer";

import { Question } from "@/types/questionnaire/question";

interface GroupTarget {
  id: string;
  label: string;
}

/** Sentinel select value representing the questionnaire root (targetParentId: null). */
const ROOT_MOVE_TARGET_ID = "__top_level__";

/** Walks the entire questionnaire tree, collecting every group question as a move target. */
function collectAllGroupTargets(
  questions: Question[],
  excludeIds: Set<string>,
  untitledLabel: string,
): GroupTarget[] {
  const targets: GroupTarget[] = [];
  for (const question of questions) {
    if (excludeIds.has(question.id)) continue;
    if (question.type === "group") {
      targets.push({ id: question.id, label: question.text || untitledLabel });
    }
    targets.push(
      ...collectAllGroupTargets(
        question.questions ?? [],
        excludeIds,
        untitledLabel,
      ),
    );
  }
  return targets;
}

interface MoveQuestionsDialogProps {
  /** The full question tree — targets span every group in the questionnaire. */
  allQuestions: Question[];
  /** Ids of the questions being moved (their subtrees are excluded as targets). */
  selectedIds: string[];
  /** Target group preselected on mount. */
  defaultTargetId: string;
  onOpenChange: (open: boolean) => void;
  onMove: (targetParentId: string | null, index: number) => void;
}

/**
 * Target picker for bulk-moving questions: every group across the
 * questionnaire plus a root/"top level" option, matching the legacy
 * MoveQuestionDialog. Groups inside a moved subtree are excluded — moving a
 * subtree into itself would drop it (the reducer no-ops that case too).
 *
 * Mounted only while open (the caller conditionally renders it), so the
 * target/position state re-initializes on every open without effects.
 */
export function MoveQuestionsDialog({
  allQuestions,
  selectedIds,
  defaultTargetId,
  onOpenChange,
  onMove,
}: MoveQuestionsDialogProps) {
  const { t } = useTranslation();
  const [moveTargetId, setMoveTargetId] = useState(defaultTargetId);
  const [movePosition, setMovePosition] = useState(0);

  const movedSubtreeIds = new Set(
    selectedIds.flatMap((id) => {
      const found = findQuestion(allQuestions, id);
      return found ? collectIds(found) : [id];
    }),
  );
  const groupTargets = collectAllGroupTargets(
    allQuestions,
    movedSubtreeIds,
    t("untitled_question"),
  );
  const targetOptions: GroupTarget[] = [
    { id: ROOT_MOVE_TARGET_ID, label: t("top_level") },
    ...groupTargets,
  ];
  const isRootMoveTarget = moveTargetId === ROOT_MOVE_TARGET_ID;
  const targetQuestion = isRootMoveTarget
    ? undefined
    : findQuestion(allQuestions, moveTargetId);
  const maxPosition = isRootMoveTarget
    ? allQuestions.length
    : (targetQuestion?.questions?.length ?? 0);

  const handleConfirmMove = () => {
    onMove(
      isRootMoveTarget ? null : moveTargetId,
      Math.min(Math.max(movePosition, 0), maxPosition),
    );
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t("move_n_questions", { count: selectedIds.length })}
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
                {targetOptions.map((target) => (
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
            onClick={() => onOpenChange(false)}
          >
            {t("cancel")}
          </Button>
          <Button type="button" onClick={handleConfirmMove}>
            {t("move")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
