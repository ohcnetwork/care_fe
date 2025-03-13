import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";

import QuestionnaireResponsesList from "@/components/Facility/ConsultationDetails/QuestionnaireResponsesList";

import { PatientProps } from ".";

export const Updates = (props: PatientProps) => {
  const { patientId, facilityId } = props;
  const { t } = useTranslation();

  return (
    <div className="mt-4 px-3 md:px-0">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold leading-tight">{t("updates")}</h2>
        <Button asChild variant="outline_primary">
          <Link
            href={
              facilityId
                ? `/facility/${facilityId}/patient/${patientId}/questionnaire`
                : `/patient/${patientId}/questionnaire`
            }
          >
            <CareIcon icon="l-plus" className="mr-2" />
            {t("add_patient_updates")}
          </Link>
        </Button>
      </div>
      <QuestionnaireResponsesList patientId={patientId} />
    </div>
  );
};
