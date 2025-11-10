import { useTranslation } from "react-i18next";

import { AllergyIcon } from "@/CAREUI/icons/CustomIcons";

import { AllergyList } from "@/components/Patient/allergy/list";

export const AllergyHistory = ({ patientId }: { patientId: string }) => {
  const { t } = useTranslation();
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-5">
        <AllergyIcon className="size-8 p-1 border text-yellow-800 border-yellow-300 bg-yellow-100/80 rounded-md" />
        <h4 className="text-xl">{t("allergies")}</h4>
      </div>
      <AllergyList patientId={patientId} showTimeline={true} />
    </div>
  );
};
