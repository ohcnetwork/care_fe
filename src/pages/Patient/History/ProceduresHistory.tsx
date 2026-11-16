import { Scissors } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ProceduresList } from "@/components/Patient/procedures/list";

export const ProceduresHistory = ({ patientId }: { patientId: string }) => {
  const { t } = useTranslation();
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-5">
        <Scissors className="size-8 text-sky-700 bg-sky-100 border border-sky-400 rounded-md p-1" />
        <h4 className="text-xl">{t("past_procedures")}</h4>
      </div>
      <ProceduresList patientId={patientId} showTimeline={true} />
    </div>
  );
};
