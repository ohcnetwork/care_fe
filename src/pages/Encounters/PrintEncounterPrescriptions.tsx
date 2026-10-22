import { useQuery } from "@tanstack/react-query";

import Loading from "@/components/Common/Loading";

import query from "@/Utils/request/query";
import { PrintPrescriptions } from "@/components/Prescription/PrintPrescriptions";
import prescriptionApi from "@/types/emr/prescription/prescriptionApi";
import { useTranslation } from "react-i18next";

interface Props {
  facilityId: string;
  patientId: string;
  encounterId: string;
}

export const PrintEncounterPrescriptions = ({
  facilityId,
  patientId,
  encounterId,
}: Props) => {
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ["prescriptions-list", patientId, encounterId, facilityId],
    queryFn: query.paginated(prescriptionApi.list, {
      pathParams: { patientId: patientId! },
      queryParams: { encounter: encounterId, facility: facilityId },
    }),
    enabled: !!encounterId && !!patientId && !!facilityId,
  });

  if (isLoading) {
    return <Loading />;
  }

  const prescriptionIds = data?.results?.map((p) => p.id) ?? [];

  if (prescriptionIds.length === 0) {
    return <div>{t("no_prescriptions_found")}</div>;
  }

  return (
    <PrintPrescriptions
      prescriptionIds={prescriptionIds}
      patientId={patientId}
      facilityId={facilityId}
    />
  );
};
