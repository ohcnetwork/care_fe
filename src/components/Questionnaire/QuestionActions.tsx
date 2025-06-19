import { Move, Trash2 } from "lucide-react";
import { Dispatch, SetStateAction, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Question } from "@/types/questionnaire/question";
import { QuestionnaireDetail } from "@/types/questionnaire/questionnaire";

import MoveQuestionDialog from "./MoveQuestionDialog";
import { removeQuestionsFromSource } from "./utils";

interface QuestionActionsProps {
  selectedQuestions: Set<string>;
  questions: Question[];
  updateQuestionnaireField: (
    field: keyof QuestionnaireDetail,
    value: unknown,
  ) => void;
  onQuestionsChange: (questions: Question[]) => void;
  setSelectedQuestions: (questions: Set<string>) => void;
  setExpandedQuestions: Dispatch<SetStateAction<Set<string>>>;
}

export function QuestionActions({
  selectedQuestions,
  questions,
  updateQuestionnaireField,
  onQuestionsChange,
  setSelectedQuestions,
  setExpandedQuestions,
}: QuestionActionsProps) {
  const { t } = useTranslation();
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);

  const handleRemoveQuestions = () => {
    const updatedQuestions = removeQuestionsFromSource(
      questions,
      selectedQuestions,
    );
    updateQuestionnaireField("questions", updatedQuestions);
    setShowRemoveDialog(false);
    setSelectedQuestions(new Set());
    toast.success(t("questions_removed"));
  };

  return (
    <>
      <Card className="border-none bg-transparent shadow-none">
        <CardHeader className="px-2 py-0">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {t("question_actions")}
            {selectedQuestions.size > 0 && (
              <Badge variant="secondary" className="font-normal">
                {selectedQuestions.size}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 p-2">
          <Button
            variant="outline"
            className="font-semibold w-full"
            onClick={() => setShowMoveDialog(true)}
            disabled={selectedQuestions.size === 0}
          >
            <Move className="mr-2 h-4 w-4" />
            {t("move_questions")}
          </Button>
          <Button
            variant="outline"
            className="font-semibold w-full"
            onClick={() => setShowRemoveDialog(true)}
            disabled={selectedQuestions.size === 0}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t("remove_questions")}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("confirm_remove_questions")}</DialogTitle>
            <DialogDescription>
              <Trans
                i18nKey="remove_questions_confirmation"
                values={{ count: selectedQuestions.size }}
                components={{
                  strong: <strong className="font-semibold" />,
                }}
              />
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRemoveDialog(false)}
            >
              {t("cancel")}
            </Button>
            <Button variant="destructive" onClick={handleRemoveQuestions}>
              {t("remove")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <MoveQuestionDialog
        questions={questions}
        open={showMoveDialog}
        onOpenChange={setShowMoveDialog}
        selectedQuestionIds={selectedQuestions}
        onSuccess={(questions) => {
          onQuestionsChange(questions);
          setSelectedQuestions(new Set());
        }}
        updateSelectedQuestionIds={setSelectedQuestions}
        setParentExpandedQuestions={setExpandedQuestions}
      />
    </>
  );
}
