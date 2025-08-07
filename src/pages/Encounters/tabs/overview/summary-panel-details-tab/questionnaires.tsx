import { NotebookPen } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { QuestionnaireSearch } from "@/components/Questionnaire/QuestionnaireSearch";

import useQuestionnaireOptions from "@/hooks/useQuestionnaireOptions";

import { EncounterRead } from "@/types/emr/encounter/encounter";

export const Questionnaires = ({ encounter }: { encounter: EncounterRead }) => {
  const { t } = useTranslation();

  const questionnaireOptions = useQuestionnaireOptions("encounter_actions");

  return (
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
      <Separator className="border-dashed border-gray-200 border-b-2" />
      <QuestionnaireSearch
        placeholder={t("choose_questionnaire")}
        subjectType="encounter"
      />
    </div>
  );
};
