import { NotebookPen, Plus } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import { QuestionnaireSearch } from "@/components/Questionnaire/QuestionnaireSearch";

import useQuestionnaireOptions from "@/hooks/useQuestionnaireOptions";

import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";

import { EmptyState } from "./empty-state";

export const Questionnaires = () => {
  const { t } = useTranslation();
  const {
    selectedEncounterId: encounterId,
    patientId,
    facilityId,
  } = useEncounter();

  const questionnaireOptions = useQuestionnaireOptions("encounter_actions");

  return (
    <div className="bg-gray-100 rounded-md p-2 border border-gray-200">
      <div className="flex items-center justify-between w-full pl-1 pt-1">
        <span className="font-semibold text-gray-950">{t("forms")}</span>
        <QuestionnaireSearch
          trigger={
            <Button variant="ghost" size="xs" className="-mr-2">
              <Plus className="size-3 text-gray-950" />
            </Button>
          }
          subjectType="encounter"
        />
      </div>
      <div className="flex flex-col gap-3 mt-2">
        {questionnaireOptions.length === 0 ? (
          <EmptyState message={t("no_forms")} />
        ) : (
          <>
            {questionnaireOptions.map((option) => (
              <Button
                key={option.slug}
                variant="outline"
                className="justify-start text-left"
                title={option.title}
                asChild
              >
                <Link
                  href={`/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/${option.slug}`}
                >
                  <NotebookPen />
                  <span className="truncate">{option.title}</span>
                </Link>
              </Button>
            ))}
          </>
        )}

        <div className="@sm:flex-1 flex flex-col gap-2 border-t border-gray-300 border-dashed @sm:border-none pt-3 @sm:pt-0">
          <QuestionnaireSearch
            placeholder={t("choose_form")}
            subjectType="encounter"
          />
        </div>
      </div>
    </div>
  );
};
