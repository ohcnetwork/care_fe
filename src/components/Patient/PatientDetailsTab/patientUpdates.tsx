import { Link } from "raviger";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";

import QuestionnaireResponsesList from "@/components/Facility/ConsultationDetails/QuestionnaireResponsesList";

import useAppHistory from "@/hooks/useAppHistory";

import { getPermissions } from "@/common/Permissions";

import { usePermissions } from "@/context/PermissionContext";

import { PatientProps } from ".";

export const Updates = (props: PatientProps) => {
  const { facilityId, patientData } = props;
  const patientId = patientData.id;
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  const { goBack } = useAppHistory();
  const {
    canViewPatientQuestionnaireResponses,
    canSubmitPatientQuestionnaireResponses,
  } = getPermissions(hasPermission, patientData.permissions);

  useEffect(() => {
    if (!canViewPatientQuestionnaireResponses) {
      toast.error(t("no_permission_to_view_page"));
      goBack(
        facilityId
          ? `/facility/${facilityId}/patient/${patientId}`
          : `/patient/${patientId}`,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canViewPatientQuestionnaireResponses]);

  return (
    <div className="mt-4 px-3 md:px-0">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold leading-tight">{t("updates")}</h2>
        {canSubmitPatientQuestionnaireResponses && (
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
        )}
      </div>
      <QuestionnaireResponsesList
        patientId={patientId}
        canAccess={canViewPatientQuestionnaireResponses}
      />
    </div>
  );
};
