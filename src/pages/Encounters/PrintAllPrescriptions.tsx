import { useQueries } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import PrintPreview from "@/CAREUI/misc/PrintPreview";

import Loading from "@/components/Common/Loading";
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

  const prescriptionListQuery = useQueries({
    queries: [
      {
        queryKey: ["prescriptions", patientId, encounterId],
        queryFn: query(prescriptionApi.list, {
          pathParams: { patientId },
          queryParams: { encounter: encounterId, facility: facilityId },
        }),
        enabled: !!patientId && !!encounterId,
      },
    ],
  })[0];

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

  if (isLoading) return <Loading />;

  const prescriptions = prescriptionQueries
    .map((q) => q.data)
    .filter((p) => p && p.medications && p.medications.length > 0);

  if (prescriptions.length === 0) {
    return <div>{t("no_prescriptions_found")}</div>;
  }

  const patientName = prescriptions[0]?.encounter.patient.name || "";

  return (
    <PrintPreview
      title={`${t("all_prescriptions")} - ${patientName}`}
      disabled={prescriptions.length === 0}
    >
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
      <PrintFooter className="mt-4" />
    </PrintPreview>
  );
};
