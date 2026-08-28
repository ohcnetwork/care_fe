import {
  BillMedicationsFormValues,
  BillMedicationsMode,
} from "@/pages/Facility/services/pharmacy/billMedications/modes/types";
import useBillMedications from "@/pages/Facility/services/pharmacy/billMedications/utils/useBillMedications";
import encounterApi from "@/types/emr/encounter/encounterApi";
import query from "@/Utils/request/query";
import { useQuery } from "@tanstack/react-query";

interface Options {
  facilityId: string;
  locationId: string;
  patientId: string;
  encounterId: string;
}

const EMPTY_DEFAULT_VALUES: BillMedicationsFormValues = {
  prescriptions: [],
  otherItems: [],
};

export default function useNewDispenseMode({
  facilityId,
  locationId,
  patientId,
  encounterId,
}: Options): BillMedicationsMode {
  const { data: encounter, isLoading } = useQuery({
    queryKey: ["encounter", encounterId],
    queryFn: query(encounterApi.get, {
      pathParams: { id: encounterId },
    }),
  });

  const { mutate: billMedications, isPending: isSubmitting } =
    useBillMedications({
      facilityId,
      locationId,
      patientId,
      fallbackEncounterId: encounterId,
    });

  const submit = (values: BillMedicationsFormValues) => {
    billMedications({ items: values.otherItems });
  };

  return {
    encounter,
    isLoading,
    defaultValues: EMPTY_DEFAULT_VALUES,
    submit,
    isSubmitting,
    pageOptions: {
      unbilledPrescriptionsFor: {
        patientId,
        facilityId,
        encounterId,
        excludePrescriptionIds: [],
      },
    },
  };
}
