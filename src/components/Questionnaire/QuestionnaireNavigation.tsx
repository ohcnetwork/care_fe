import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Question } from "@/types/questionnaire/question";

export default function QuestionnaireNavigation({
  scrollToQuestion,
  toggleQuestionExpanded,
  expandedQuestions,
  rootQuestions,
  isPreview = false,
}: {
  rootQuestions: Question[];
  toggleQuestionExpanded?: (questionId: string) => void;
  expandedQuestions?: Set<string>;
  scrollToQuestion: (questionId: string) => void;
  isPreview?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Card className="border-none bg-transparent shadow-none space-y-3 mt-2 md:block hidden">
      <CardHeader className="p-0">
        <CardTitle>{t("navigation")}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <nav className="space-y-1">
          {rootQuestions.map((question, index) => {
            const hasSubQuestions =
              question.type === "group" &&
              question.questions &&
              question.questions.length > 0;
            return (
              <div key={question.link_id} className="space-y-1">
                <Button
                  variant={null}
                  onClick={() => {
                    scrollToQuestion(
                      isPreview ? question.id : question.link_id,
                    );
                    if (toggleQuestionExpanded)
                      toggleQuestionExpanded(question.link_id);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-200 flex items-center gap-2 ${
                    expandedQuestions?.has(question.link_id) ? "bg-accent" : ""
                  }`}
                >
                  <span className="font-medium text-gray-500">
                    {index + 1}.
                  </span>
                  <span className="flex-1 truncate">
                    {question.text || t("untitled_question")}
                  </span>
                </Button>
                {hasSubQuestions && question.questions && (
                  <div className="ml-6 border-l-2 border-gray-200 pl-2 space-y-1">
                    {question.questions.map((subQuestion, subIndex) => (
                      <Button
                        key={subQuestion.link_id}
                        variant={null}
                        onClick={() => {
                          if (
                            !expandedQuestions?.has(question.link_id) &&
                            toggleQuestionExpanded
                          ) {
                            toggleQuestionExpanded(question.link_id);
                            setTimeout(() => {
                              scrollToQuestion(subQuestion.link_id);
                            }, 100);
                          } else {
                            scrollToQuestion(
                              isPreview ? subQuestion.id : subQuestion.link_id,
                            );
                          }
                        }}
                        className="w-full text-left px-3 py-1.5 text-sm rounded-md hover:bg-accent flex items-center gap-2 hover:bg-gray-200 "
                      >
                        <span className="font-medium text-gray-500">
                          {index + 1}.{subIndex + 1}
                        </span>
                        <span className="flex-1 truncate">
                          {subQuestion.text || "Untitled Question"}
                        </span>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </CardContent>
    </Card>
  );
}
