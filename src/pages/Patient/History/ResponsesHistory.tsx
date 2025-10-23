import { useTranslation } from "react-i18next";

import { HealthWorkerIcon } from "@/CAREUI/icons/CustomIcons";
import { EncounterResponsesTab } from "@/pages/Encounters/tabs/responses";

export const ResponsesHistory = ({ patientId }: { patientId: string }) => {
  const { t } = useTranslation();
  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col pb-10">
      <div className="flex items-center gap-2 mb-5">
        <HealthWorkerIcon className="size-8 bg-teal-200 border border-teal-500 text-teal-800 rounded-md p-1" />
        <h4 className="text-xl">{t("questionnaire_responses")}</h4>
      </div>
      <EncounterResponsesTab patientId={patientId} />
    </div>
  );
};
