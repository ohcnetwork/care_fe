import BillMedicationsShell from "@/pages/Facility/services/pharmacy/billMedications/BillMedicationsShell";
import usePrescriptionsMode from "@/pages/Facility/services/pharmacy/billMedications/modes/usePrescriptionsMode";

interface Props {
  facilityId: string;
  locationId: string;
  patientId: string;
  prescriptionIds: string[];
}

export default function BillMedicationsByPrescriptions(props: Props) {
  const mode = usePrescriptionsMode(props);
  return <BillMedicationsShell facilityId={props.facilityId} mode={mode} />;
}
