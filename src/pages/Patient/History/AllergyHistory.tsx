import { useTranslation } from "react-i18next";

import { AllergyList } from "@/components/Patient/allergy/list";

export const AllergyHistory = ({ patientId }: { patientId: string }) => {
  const { t } = useTranslation();
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-5">
        <img
          src="/images/icons/diagnosis.svg"
          alt="diagnosis"
          className="size-9 bg-cyan-200 border border-cyan-400 rounded-md p-1.5"
        />
        <h4 className="text-xl">{t("allergies")}</h4>
      </div>
      <AllergyList patientId={patientId} showTimeline={true} />
    </div>
  );
};
