import { useQueries, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import PrintPreview from "@/CAREUI/misc/PrintPreview";
import Loading from "@/components/Common/Loading";
import PrintFooter from "@/components/Common/PrintFooter";
import {
  PrescriptionContent,
  PrescriptionPatientDetails,
  PrescriptionPreview,
  PrescriptionPrintHeader,
} from "@/components/Prescription/PrescriptionPreview";

import query from "@/Utils/request/query";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import { PrescriptionRead } from "@/types/emr/prescription/prescription";
import prescriptionApi from "@/types/emr/prescription/prescriptionApi";

interface PrintPrescriptionProps {
  facilityId: string;
  patientId: string;
  prescriptionId?: string;
}

export const PrintAllPrescriptions = ({
  facilityId,
  patientId,
}: {
  facilityId: string;
  patientId: string;
}) => {
  const { t } = useTranslation();
  const {
    selectedEncounter: encounter,
    isSelectedEncounterLoading: encounterLoading,
  } = useEncounter();
  const encounterId = encounter?.id;

  const {
    data: prescriptionList,
    isLoading: listLoading,
    isError: listError,
  } = useQuery({
    queryKey: ["prescription_list", patientId, encounterId],
    queryFn: query(prescriptionApi.list, {
      pathParams: { patientId },
      queryParams: { encounter: encounterId, facility: facilityId },
    }),
    enabled: !!encounterId,
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
  const allPrescriptionsError = prescriptionQueries.some((q) => q.isError);

  const prescriptions = prescriptionQueries
    .map((q) => q.data)
    .filter((p): p is PrescriptionRead => !!p);

  if (encounterLoading || listLoading || allPrescriptionsLoading) {
    return <Loading />;
  }

  if (listError || allPrescriptionsError) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed border-red-200 p-4 text-red-500">
        {t("prescription_load_failed")}
      </div>
    );
  }

  if (!encounter) {
    return <Loading />;
  }

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
          facility={
            encounter.facility as {
              name?: string;
              address?: string;
              phone_number?: string;
            } | null
          }
        />
        <PrescriptionPatientDetails patient={encounter.patient} />
        <div className="flex flex-col mt-8">
          {prescriptions.map((prescriptionData) => (
            <PrescriptionContent
              key={prescriptionData.id}
              prescription={prescriptionData}
            />
          ))}
        </div>
        <PrintFooter leftContent={t("computer_generated_prescription")} />
      </div>
    </PrintPreview>
  );
};

export const PrintPrescription = ({
  facilityId,
  patientId,
  prescriptionId,
}: PrintPrescriptionProps) => {
  const { t } = useTranslation();

  const { data: prescription, isLoading: prescriptionLoading } = useQuery({
    queryKey: ["prescription", patientId, prescriptionId],
    queryFn: query(prescriptionApi.get, {
      pathParams: { patientId, id: prescriptionId! },
      queryParams: { facility: facilityId },
    }),
    enabled: !!prescriptionId,
  });

  if (prescriptionLoading) {
    return <Loading />;
  }

  if (!prescription) {
    return <div>{t("prescription_not_found")}</div>;
  }

  return <PrescriptionPreview prescription={prescription} />;
};
