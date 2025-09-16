import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import Page from "@/components/Common/Page";

import query from "@/Utils/request/query";
import { PatientHeader } from "@/components/Patient/PatientHeader";
import useCurrentLocation from "@/pages/Facility/locations/utils/useCurrentLocation";
import patientApi from "@/types/emr/patient/patientApi";

import MedicationDispenseList from "./MedicationDispenseList";

export enum PharmacyMedicationTab {
  PENDING = "pending",
  PARTIAL = "partial",
}
interface Props {
  facilityId: string;
  patientId: string;
  tab?: PharmacyMedicationTab;
  prescriptionId: string;
}

export default function PrescriptionsView({
  facilityId,
  patientId,
  prescriptionId,
}: Props) {
  const { t } = useTranslation();
  const { locationId } = useCurrentLocation();

  const { data: patientData } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: query(patientApi.getPatient, {
      pathParams: { id: patientId ?? "" },
    }),
    enabled: !!patientId,
  });

  return (
    <Page title={t("pharmacy_medications")} hideTitleOnPage>
      <div>
        <Button
          data-shortcut-id="go-back"
          variant="outline"
          className="text-gray-950 font-semibold border-gray-300 mb-4"
          size="sm"
          onClick={() =>
            navigate(
              `/facility/${facilityId}/locations/${locationId}/medication_requests/`,
            )
          }
        >
          <ArrowLeft />
          {t("back_to_prescription_queue")}
        </Button>
      </div>
      {patientData && (
        <PatientHeader
          patient={patientData}
          facilityId={facilityId}
          className="p-2 rounded-none shadow-none bg-gray-100"
        />
      )}
      <div className="mt-4">
        <MedicationDispenseList
          facilityId={facilityId}
          patientId={patientId}
          prescriptionId={prescriptionId}
        />
      </div>
    </Page>
  );
}
