import { useTranslation } from "react-i18next";

import { EncounterResponsesTab } from "@/pages/Encounters/tabs/responses";

export const ResponsesHistory = ({ patientId }: { patientId: string }) => {
  const { t } = useTranslation();
  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col pb-10">
      <div className="flex items-center gap-2 mb-5">
        <img
          src="/images/icons/diagnosis.svg"
          alt="diagnosis"
          className="size-9 bg-cyan-200 border border-cyan-400 rounded-md p-1.5"
        />
        <h4 className="text-xl">{t("questionnaire_responses")}</h4>
      </div>
      <EncounterResponsesTab patientId={patientId} />
    </div>
  );
};
