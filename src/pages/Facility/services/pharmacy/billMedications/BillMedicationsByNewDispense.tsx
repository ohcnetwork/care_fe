import BillMedicationsShell from "@/pages/Facility/services/pharmacy/billMedications/BillMedicationsShell";
import useNewDispenseMode from "@/pages/Facility/services/pharmacy/billMedications/modes/useNewDispenseMode";

interface Props {
  facilityId: string;
  locationId: string;
  patientId: string;
  encounterId: string;
}

export default function BillMedicationsByNewDispense(props: Props) {
  const mode = useNewDispenseMode(props);
  return <BillMedicationsShell facilityId={props.facilityId} mode={mode} />;
}
