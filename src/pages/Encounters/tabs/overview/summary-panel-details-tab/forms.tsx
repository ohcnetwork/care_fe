import { NotebookPen, Plus } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import { QuestionnaireSearch } from "@/components/Questionnaire/QuestionnaireSearch";

import useQuestionnaireOptions from "@/hooks/useQuestionnaireOptions";

import { EncounterRead } from "@/types/emr/encounter/encounter";

export const Questionnaires = ({ encounter }: { encounter: EncounterRead }) => {
  const { t } = useTranslation();

  const questionnaireOptions = useQuestionnaireOptions("encounter_actions");

  return (
    <>
      <div className="flex items-center justify-between w-full p-2">
        <span className="font-semibold text-gray-950 ">{t("forms")}</span>
        <QuestionnaireSearch
          trigger={
            <Button variant="ghost" size="xs">
              <Plus className="size-3 text-gray-950" />
            </Button>
          }
          subjectType="encounter"
        />
      </div>
      <div className="flex flex-col gap-3">
        {questionnaireOptions.map((option) => (
          <Button
            key={option.slug}
            variant="outline"
            className="justify-start text-left"
            title={option.title}
            asChild
          >
            <Link
              href={`/facility/${encounter.facility.id}/patient/${encounter.patient.id}/encounter/${encounter.id}/questionnaire/${option.slug}`}
            >
              <NotebookPen />
              <span className="truncate">{option.title}</span>
            </Link>
          </Button>
        ))}
        <div className="@sm:flex-1 flex flex-col gap-2 border-t border-gray-300 border-dashed @sm:border-none pt-3 @sm:pt-0">
          <QuestionnaireSearch
            placeholder={t("choose_questionnaire")}
            subjectType="encounter"
          />
        </div>
      </div>
    </>
  );
};
