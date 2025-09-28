import { useQuery } from "@tanstack/react-query";
import { ArrowLeftIcon } from "lucide-react";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FilterTabs } from "@/components/ui/filter-tabs";

import Page from "@/components/Common/Page";

import query from "@/Utils/request/query";
import useCurrentLocation from "@/pages/Facility/locations/utils/useCurrentLocation";
import { MedicationDispenseStatus } from "@/types/emr/medicationDispense/medicationDispense";
import patientApi from "@/types/emr/patient/patientApi";

import { PatientHeader } from "@/components/Patient/PatientHeader";
import DispensedMedicationList from "./DispensedMedicationList";

interface Props {
  facilityId: string;
  patientId: string;
  status?: MedicationDispenseStatus;
}

export default function DispensesView({
  facilityId,
  patientId,
  status = MedicationDispenseStatus.completed,
}: Props) {
  const { t } = useTranslation();
  const { locationId } = useCurrentLocation();

  const defaultVisibleStatuses = [
    MedicationDispenseStatus.preparation,
    MedicationDispenseStatus.in_progress,
    MedicationDispenseStatus.completed,
    MedicationDispenseStatus.cancelled,
  ];

  const allStatuses = Object.values(MedicationDispenseStatus);

  const { data: patientData } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: query(patientApi.getPatient, {
      pathParams: { id: patientId ?? "" },
    }),
    enabled: !!patientId,
  });

  const tabOptions = allStatuses.map((statusValue) => ({
    value: statusValue,
    label: statusValue,
  }));

  return (
    <Page title={t("pharmacy_medications")} hideTitleOnPage>
      <div>
        <Button
          variant="outline"
          className="text-gray-950 font-semibold border-gray-300 mb-4"
          onClick={() =>
            navigate(
              `/facility/${facilityId}/locations/${locationId}/medication_dispense/`,
            )
          }
          data-shortcut-id="go-back"
          size="sm"
        >
          <ArrowLeftIcon className="size-4" />
          {t("back_to_dispense_queue")}
        </Button>
      </div>
      {patientData && (
        <Card className="mb-4 p-4 rounded-none shadow-none bg-gray-100">
          <PatientHeader patient={patientData} facilityId={facilityId} />
        </Card>
      )}
      <FilterTabs
        value={status}
        onValueChange={(value) =>
          navigate(
            `/facility/${facilityId}/locations/${locationId}/medication_dispense/patient/${patientId}/${value}`,
          )
        }
        options={tabOptions}
        variant="underline"
        showAllOption={false}
        showMoreDropdown={true}
        maxVisibleTabs={4}
        defaultVisibleOptions={defaultVisibleStatuses}
      />

      <div>
        {Object.values(MedicationDispenseStatus).map((statusValue) =>
          status === statusValue ? (
            <div key={statusValue} className="p-2">
              <DispensedMedicationList
                facilityId={facilityId}
                patientId={patientId}
                locationId={locationId}
                status={statusValue}
              />
            </div>
          ) : null,
        )}
      </div>
    </Page>
  );
}
