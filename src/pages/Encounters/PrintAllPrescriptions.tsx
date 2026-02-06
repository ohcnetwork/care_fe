import { useQueries, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import PrintPreview from "@/CAREUI/misc/PrintPreview";

import { DisablingCover } from "@/components/Common/DisablingCover";
import {
  PrescriptionContent,
  PrescriptionHeader,
} from "@/components/Prescription/PrescriptionPreview";

import query from "@/Utils/request/query";
import PrintFooter from "@/components/Common/PrintFooter";
import prescriptionApi from "@/types/emr/prescription/prescriptionApi";

export const PrintAllPrescriptions = (props: {
  facilityId: string;
  patientId: string;
  encounterId: string;
}) => {
  const { facilityId, patientId, encounterId } = props;
  const { t } = useTranslation();

  const prescriptionListQuery = useQuery({
    queryKey: ["prescriptions", patientId, encounterId],
    queryFn: query.paginated(prescriptionApi.list, {
      pathParams: { patientId },
      queryParams: { encounter: encounterId, facility: facilityId },
    }),
    enabled: !!patientId && !!encounterId,
  });

  const prescriptionList = prescriptionListQuery.data?.results || [];

  const prescriptionQueries = useQueries({
    queries: prescriptionList.map((prescription) => ({
      queryKey: ["prescription", patientId, prescription.id],
      queryFn: query(prescriptionApi.get, {
        pathParams: { patientId, id: prescription.id },
        queryParams: { facility: facilityId },
      }),
      enabled: !!patientId && !!prescription.id,
    })),
  });

  const isLoading =
    prescriptionListQuery.isLoading ||
    prescriptionQueries.some((q) => q.isLoading);

  const prescriptions = prescriptionQueries
    .map((q) => q.data)
    .filter((p) => p && p.medications && p.medications.length > 0);

  const patientName = prescriptions[0]?.encounter.patient.name || "";

  return (
    <PrintPreview
      title={`${t("all_prescriptions")} - ${patientName}`}
      disabled={prescriptions.length === 0}
    >
      <DisablingCover disabled={isLoading} message={t("loading")}>
        {prescriptions.length === 0 ? (
          <div>{t("no_prescriptions_found")}</div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {prescriptions.map(
              (prescription, index) =>
                prescription && (
                  <div key={prescription.id}>
                    {index === 0 && (
                      <PrescriptionHeader prescription={prescription} />
                    )}
                    <div className="border-t border-gray-300 mt-3"></div>
                    <PrescriptionContent prescription={prescription} />
                  </div>
                ),
            )}
          </div>
        )}
        <PrintFooter className="mt-4" />
      </DisablingCover>
    </PrintPreview>
  );
};
