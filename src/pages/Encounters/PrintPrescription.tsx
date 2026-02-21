import { useQuery } from "@tanstack/react-query";

import Loading from "@/components/Common/Loading";
import { PrescriptionPreview } from "@/components/Prescription/PrescriptionPreview";

import query from "@/Utils/request/query";
import prescriptionApi from "@/types/emr/prescription/prescriptionApi";
import { t } from "i18next";

export const PrintPrescription = (props: {
  facilityId: string;
  patientId: string;
  prescriptionId: string;
}) => {
  const { facilityId, patientId, prescriptionId } = props;

  const { data: prescription, isLoading } = useQuery({
    queryKey: ["prescription", patientId, prescriptionId],
    queryFn: query(prescriptionApi.get, {
      pathParams: { patientId, id: prescriptionId! },
      queryParams: { facility: facilityId },
    }),
    enabled: !!prescriptionId,
  });

  if (isLoading) return <Loading />;

  if (!prescription) {
    return <div>{t("prescription_not_found")}</div>;
  }

  return <PrescriptionPreview prescription={prescription} />;
};
