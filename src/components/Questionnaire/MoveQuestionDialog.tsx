import { t } from "i18next";
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Copy,
  Move,
  X,
} from "lucide-react";
import { Dispatch, SetStateAction, useState } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import { Question } from "@/types/questionnaire/question";

import {
  addQuestionsToDestination,
  copyQuestionWithNewIds,
  extractGroupQuestions,
  extractQuestionsByIds,
  removeQuestionsFromSource,
  scrollToQuestion,
} from "./utils";

interface QuestionTreeNodeProps {
  question: Question;
  selectedId: string;
  onSelect: (id: string) => void;
  expandedQuestions: Set<string>;
  onToggleExpand: (id: string) => void;
  level?: number;
}

function QuestionTreeNode({
  question,
  selectedId,
  onSelect,
  expandedQuestions,
  onToggleExpand,
  level = 0,
}: QuestionTreeNodeProps) {
  const isExpanded = expandedQuestions.has(question.id);
  const isSelected = question.id === selectedId;
  const hasChildren = question.questions && question.questions.length > 0;

  return (
    <div className="space-y-1">
      <div
        className={cn(
          "flex items-center py-1 px-2 rounded-md cursor-pointer hover:bg-gray-100",
          isSelected && "bg-blue-100 text-blue-800",
        )}
        style={{ paddingLeft: `${level}rem` }}
      >
        {hasChildren ? (
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(question.id);
            }}
          >
            {isExpanded ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </Button>
        ) : (
          <span className="w-6" />
        )}
        <div
          className="flex items-center flex-1 text-sm gap-2 w-0"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(question.id);
          }}
        >
          <span className="truncate">{question.text}</span>
        </div>
      </div>
      {isExpanded && hasChildren && question.questions && (
        <div className="pl-2">
          {question.questions.map((child) => (
            <QuestionTreeNode
              key={child.id}
              question={child}
              selectedId={selectedId}
              onSelect={onSelect}
              expandedQuestions={expandedQuestions}
              onToggleExpand={onToggleExpand}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface MoveQuestionDialogProps {
  questions: Question[];
  selectedQuestionIds: Set<string>;
  onSuccess: (questions: Question[]) => void;
  updateSelectedQuestionIds: (ids: Set<string>) => void;
  setParentExpandedQuestions: Dispatch<SetStateAction<Set<string>>>;
}

export default function MoveQuestionDialog({
  questions,
  selectedQuestionIds,
  onSuccess,
  updateSelectedQuestionIds,
  setParentExpandedQuestions,
  ...props
}: React.ComponentProps<typeof Dialog> & MoveQuestionDialogProps) {
  const [destinationId, setDestinationId] = useState("");
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(
    new Set(),
  );

  const groupQuestions = extractGroupQuestions(questions);

  const selectedQuestions = extractQuestionsByIds(
    selectedQuestionIds,
    questions,
  );

  const handleToggleExpand = (id: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedQuestions(newExpanded);
  };

  const handleMove = () => {
    if (!destinationId || selectedQuestions.length === 0) return;
    onSuccess(
      addQuestionsToDestination(
        removeQuestionsFromSource([...questions], selectedQuestionIds),
        destinationId,
        selectedQuestions,
      ),
    );
    setParentExpandedQuestions((prev) => {
      const newExpanded = new Set(prev);
      newExpanded.add(destinationId);
      return newExpanded;
    });
    props.onOpenChange?.(false);
    setDestinationId("");
    toast.success(t("questions_moved"));
    scrollToQuestion(destinationQuestion.link_id);
  };

  const destinationQuestion = extractQuestionsByIds(
    new Set([destinationId]),
    questions,
  )[0];

  const handleCopy = () => {
    if (!destinationId || selectedQuestions.length === 0) return;
    const questionsCopy = selectedQuestions.map(copyQuestionWithNewIds);

    onSuccess(
      addQuestionsToDestination([...questions], destinationId, questionsCopy),
    );
    props.onOpenChange?.(false);
    setDestinationId("");
    toast.success(t("questions_copied"));
    scrollToQuestion(destinationQuestion.link_id);
    setParentExpandedQuestions((prev) => {
      const newExpanded = new Set(prev);
      newExpanded.add(destinationId);
      return newExpanded;
    });
  };

  const removeQuestionFromSelection = (questionId: string) => {
    const newSelectedIds = new Set(selectedQuestionIds);
    newSelectedIds.delete(questionId);
    updateSelectedQuestionIds(newSelectedIds);
  };

  const handleCancel = () => {
    props.onOpenChange?.(false);
    setDestinationId("");
  };

  return (
    <Dialog {...props}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              <Move className="w-5 h-5" />
              {t("move_questions")}
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t("moving")}:</Label>
            <div className="p-3 bg-gray-50 rounded-lg space-y-1">
              {selectedQuestions.length !== 0 ? (
                selectedQuestions.map((question) => (
                  <div
                    key={question.id}
                    className="text-sm flex items-center gap-3 mt-1"
                  >
                    <div className="flex items-center gap-3">
                      <ArrowRight className="w-3 h-3 text-gray-400" />
                      <span>{question.text}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 rounded-full"
                      onClick={() => removeQuestionFromSelection(question.id)}
                      title={t("remove_from_selection")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500">
                  {t("no_questions_selected")}
                </div>
              )}
            </div>
          </div>

          <div>
            <Label className="mb-2">{t("destination_question")}</Label>
            <div className="border rounded-lg max-h-[300px] overflow-y-auto">
              {groupQuestions.map((question) => (
                <QuestionTreeNode
                  key={question.id}
                  question={question}
                  selectedId={destinationId}
                  onSelect={setDestinationId}
                  expandedQuestions={expandedQuestions}
                  onToggleExpand={handleToggleExpand}
                />
              ))}
            </div>
          </div>
        </div>

        <Separator />
        <DialogFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleCancel}>
            {t("cancel")}
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleCopy}>
            <Copy className="w-4 h-4" />
            {t("copy")}
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleMove}>
            <Move className="w-4 h-4" />
            {t("move")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
