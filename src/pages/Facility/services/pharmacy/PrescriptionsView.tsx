import { ArrowLeft } from "lucide-react";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import Page from "@/components/Common/Page";

import useCurrentLocation from "@/pages/Facility/locations/utils/useCurrentLocation";

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
      <div>
        <MedicationDispenseList
          facilityId={facilityId}
          patientId={patientId}
          prescriptionId={prescriptionId}
        />
      </div>
    </Page>
  );
}
