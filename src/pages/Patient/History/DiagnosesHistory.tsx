import { useTranslation } from "react-i18next";

import { StethoscopeIcon } from "@/CAREUI/icons/CustomIcons";

import { DiagnosisList } from "@/components/Patient/diagnosis/list";

export const DiagnosesHistory = ({ patientId }: { patientId: string }) => {
  const { t } = useTranslation();
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-5">
        <StethoscopeIcon className="size-8 bg-blue-200 border border-blue-400 text-blue-800 rounded-md p-1" />
        <h4 className="text-xl">{t("past_diagnoses")}</h4>
      </div>
      <DiagnosisList patientId={patientId} showTimeline={true} />
    </div>
  );
};
