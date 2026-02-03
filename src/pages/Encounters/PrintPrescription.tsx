import { useQueries, useQuery } from "@tanstack/react-query";

import PrintPreview from "@/CAREUI/misc/PrintPreview";
import Loading from "@/components/Common/Loading";
import PrintFooter from "@/components/Common/PrintFooter";
import {
  PrescriptionDetails,
  PrescriptionPreview,
  PrescriptionPrintHeader,
} from "@/components/Prescription/PrescriptionPreview";

import query from "@/Utils/request/query";
import encounterApi from "@/types/emr/encounter/encounterApi";
import { PrescriptionRead } from "@/types/emr/prescription/prescription";
import prescriptionApi from "@/types/emr/prescription/prescriptionApi";
import { t } from "i18next";

export const PrintPrescription = ({
  facilityId,
  patientId,
  prescriptionId,
  encounterId,
}: {
  facilityId: string;
  patientId: string;
  prescriptionId?: string;
  encounterId?: string;
}) => {
  const { data: prescription, isLoading: prescriptionLoading } = useQuery({
    queryKey: ["prescription", patientId, prescriptionId],
    queryFn: query(prescriptionApi.get, {
      pathParams: { patientId, id: prescriptionId! },
      queryParams: { facility: facilityId },
    }),
    enabled: !!prescriptionId,
  });

  const { data: encounter, isLoading: encounterLoading } = useQuery({
    queryKey: ["encounter", encounterId],
    queryFn: query(encounterApi.get, {
      pathParams: { id: encounterId! },
    }),
    enabled: !!encounterId,
  });

  const { data: prescriptionList, isLoading: listLoading } = useQuery({
    queryKey: ["prescription_list", patientId, encounterId],
    queryFn: query(prescriptionApi.list, {
      pathParams: { patientId },
      queryParams: { encounter: encounterId, facility: facilityId },
    }),
    enabled: !!encounterId && !prescriptionId,
  });

  const prescriptionQueries = useQueries({
    queries: (prescriptionList?.results || []).map((pres) => ({
      queryKey: ["prescription", patientId, pres.id],
      queryFn: query(prescriptionApi.get, {
        pathParams: { patientId, id: pres.id! },
        queryParams: { facility: facilityId },
      }),
    })),
  });

  const allPrescriptionsLoading = prescriptionQueries.some((q) => q.isLoading);
  const prescriptions = prescriptionQueries
    .map((q) => q.data)
    .filter((p): p is PrescriptionRead => !!p);

  if (
    prescriptionLoading ||
    (encounterId &&
      (encounterLoading || listLoading || allPrescriptionsLoading))
  ) {
    return <Loading />;
  }

  if (prescriptionId) {
    if (!prescription) {
      return <div>{t("prescription_not_found")}</div>;
    }

    return <PrescriptionPreview prescription={prescription} />;
  }

  if (encounterId && encounter) {
    if (prescriptions.length === 0) {
      return (
        <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed border-gray-200 p-4 text-gray-500">
          {t("no_medications_found_for_this_encounter")}
        </div>
      );
    }

    return (
      <PrintPreview
        title={`${t("prescriptions")} - ${encounter.patient.name}`}
        disabled={prescriptions.length === 0}
      >
        <div className="mx-auto max-w-4xl">
          <PrescriptionPrintHeader
            patient={encounter.patient}
            facility={encounter.facility}
          />
          <div className="flex flex-col mt-8">
            {prescriptions.map((prescriptionData) => (
              <PrescriptionDetails
                key={prescriptionData.id}
                prescription={prescriptionData}
              />
            ))}
          </div>
          <PrintFooter leftContent={t("computer_generated_prescription")} />
        </div>
      </PrintPreview>
    );
  }

  return <div>{t("prescription_not_found")}</div>;
};
