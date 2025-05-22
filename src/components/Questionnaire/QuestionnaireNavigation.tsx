import { t } from "i18next";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Question } from "@/types/questionnaire/question";
import { QuestionnaireDetail } from "@/types/questionnaire/questionnaire";

export default function QuestionnaireNavigation({
  questionnaire,
  scrollToQuestion,
  toggleQuestionExpanded,
  expandedQuestions,
}: {
  questionnaire: QuestionnaireDetail;
  toggleQuestionExpanded?: (questionId: string) => void;
  expandedQuestions?: Set<string>;
  scrollToQuestion?: (questionId: string) => void;
}) {
  return (
    <Card className="border-none bg-transparent shadow-none space-y-3 mt-2 md:block hidden">
      <CardHeader className="p-0">
        <CardTitle>{t("navigation")}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <nav className="space-y-1">
          {questionnaire.questions.map((question: Question, index: number) => {
            const hasSubQuestions =
              question.type === "group" &&
              question.questions &&
              question.questions.length > 0;
            return (
              <div key={question.id} className="space-y-1">
                <button
                  onClick={() => {
                    if (scrollToQuestion) {
                      scrollToQuestion(question.id);
                    } else {
                      const element = document.getElementById(
                        `question-${question.id}`,
                      );

                      if (element) {
                        element.scrollIntoView();
                        if (toggleQuestionExpanded) {
                          toggleQuestionExpanded(question.id);
                        }
                      }
                    }
                  }}
                  className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-200 flex items-center gap-2 ${
                    expandedQuestions?.has(question.id) ? "bg-accent" : ""
                  }`}
                >
                  <span className="font-medium text-gray-500">
                    {index + 1}.
                  </span>
                  <span className="flex-1 truncate">
                    {question.text || t("untitled_question")}
                  </span>
                </button>
                {hasSubQuestions && question.questions && (
                  <div className="ml-6 border-l-2 border-gray-200 pl-2 space-y-1">
                    {question.questions.map((subQuestion, subIndex) => (
                      <button
                        key={subQuestion.id}
                        onClick={() => {
                          if (scrollToQuestion) {
                            scrollToQuestion(subQuestion.id);
                          } else if (!expandedQuestions?.has(question.id)) {
                            if (toggleQuestionExpanded) {
                              toggleQuestionExpanded(question.id);
                            }
                            setTimeout(() => {
                              const element = document.getElementById(
                                `question-${subQuestion.id}`,
                              );
                              if (element) {
                                element.scrollIntoView();
                              }
                            }, 100);
                          } else {
                            const element = document.getElementById(
                              `question-${subQuestion.id}`,
                            );
                            if (element) {
                              element.scrollIntoView();
                            }
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
                      </button>
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
