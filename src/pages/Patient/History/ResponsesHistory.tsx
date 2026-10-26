import { useTranslation } from "react-i18next";

import { HealthWorkerIcon } from "@/CAREUI/icons/CustomIcons";
import { EncounterResponsesTab } from "@/pages/Encounters/tabs/responses";

export const ResponsesHistory = ({
  patientId,
  embedded = false,
}: {
  patientId: string;
  embedded?: boolean;
}) => {
  const { t } = useTranslation();
  return (
    <div
      className={
        embedded ? "min-w-0" : "h-[calc(100vh-12rem)] flex flex-col pb-10"
      }
    >
      {!embedded && (
        <div className="flex items-center gap-2 mb-5">
          <HealthWorkerIcon className="size-8 bg-teal-200 border border-teal-500 text-teal-800 rounded-md p-1" />
          <h4 className="text-xl">{t("responses")}</h4>
        </div>
      )}
      <EncounterResponsesTab
        patientId={patientId}
        embedded={embedded}
        readOnly
      />
    </div>
  );
};
