import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { MedicationStatementList } from "@/components/Patient/MedicationStatementList";
import { AllergyList } from "@/components/Patient/allergy/list";
import { DiagnosisList } from "@/components/Patient/diagnosis/list";
import { SymptomsList } from "@/components/Patient/symptoms/list";

import useAppHistory from "@/hooks/useAppHistory";

import { getPermissions } from "@/common/Permissions";

import { usePermissions } from "@/context/PermissionContext";

import { PatientProps } from ".";

export const HealthProfileSummary = ({
  facilityId,
  patientData,
}: PatientProps) => {
  const patientId = patientData.id;

  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  const { canViewClinicalData } = getPermissions(
    hasPermission,
    patientData.permissions,
  );
  const { goBack } = useAppHistory();

  useEffect(() => {
    if (!canViewClinicalData) {
      toast.error(t("no_permission_to_view_page"));
      goBack(
        facilityId
          ? `/facility/${facilityId}/patient/${patientId}`
          : `/patient/${patientId}`,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canViewClinicalData]);

  return (
    <div className="mt-4 px-4 md:px-0" data-test-id="patient-health-profile">
      <div className="group my-2 w-full">
        <div className="h-full space-y-2">
          <div className="flex flex-row items-center justify-between">
            <div className="mr-4 text-xl font-bold text-secondary-900">
              {t("health_profile")}
            </div>
          </div>

          <div className="mt-2 space-y-2 md:space-y-8">
            <MedicationStatementList
              patientId={patientId}
              canAccess={canViewClinicalData}
            />

            <AllergyList patientId={patientId} readOnly={true} />

            <SymptomsList patientId={patientId} readOnly={true} />

            <DiagnosisList patientId={patientId} readOnly={true} />
          </div>
        </div>
      </div>
    </div>
  );
};
