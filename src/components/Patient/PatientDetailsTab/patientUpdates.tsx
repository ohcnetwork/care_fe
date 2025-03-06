import { useTranslation } from "react-i18next";

import QuestionnaireResponsesList from "@/components/Facility/ConsultationDetails/QuestionnaireResponsesList";

import { PatientProps } from ".";

export const Updates = (props: PatientProps) => {
  const { patientId } = props;
  const { t } = useTranslation();

  return (
    <div className="mt-4 px-3 md:px-0">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold leading-tight">{t("updates")}</h2>
      </div>
      <QuestionnaireResponsesList patientId={patientId} />
    </div>
  );
};
