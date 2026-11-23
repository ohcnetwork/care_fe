import { useQueries } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import PrintLoading from "@/CAREUI/misc/PrintLoading";

import { TypstPrescriptionsPrint } from "@/components/Prescription/TypstPrescriptionsPrint";

import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { PrescriptionRead } from "@/types/emr/prescription/prescription";
import prescriptionApi from "@/types/emr/prescription/prescriptionApi";
import query from "@/Utils/request/query";

interface Props {
  prescriptionIds: string[];
  patientId: string;
  facilityId: string;
}

export const PrintPrescriptions = ({
  prescriptionIds,
  patientId,
  facilityId,
}: Props) => {
  const { t } = useTranslation();
  const { facility } = useCurrentFacility();

  const { prescriptions, isLoading } = useQueries({
    queries: prescriptionIds.map((prescriptionId) => ({
      queryKey: ["prescription", patientId, prescriptionId, facilityId],
      queryFn: query(prescriptionApi.get, {
        pathParams: {
          patientId,
          id: prescriptionId,
        },
        queryParams: { facility: facilityId },
      }),
    })),
    combine: (results) => ({
      prescriptions: results
        .map((r) => r.data)
        .filter((data): data is PrescriptionRead => !!data),
      isLoading: results.some((r) => r.isLoading || r.isFetching),
    }),
  });

  if (isLoading) {
    return <PrintLoading />;
  }

  if (!prescriptions.length) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed p-4 text-gray-500 border-gray-200">
        {t("no_prescriptions_found")}
      </div>
    );
  }

  if (!prescriptions.some((p) => p.medications?.length)) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed p-4 text-gray-500 border-gray-200">
        {t("no_medications_found_for_this_encounter")}
      </div>
    );
  }

  return (
    <TypstPrescriptionsPrint
      prescriptions={prescriptions}
      patient={prescriptions[0].encounter.patient}
      facility={facility}
    />
  );
};
