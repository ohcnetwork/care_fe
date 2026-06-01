import BillMedicationsShell from "@/pages/Facility/services/pharmacy/billMedications/BillMedicationsShell";
import useDispenseOrderEditMode from "@/pages/Facility/services/pharmacy/billMedications/modes/useDispenseOrderEditMode";

interface Props {
  facilityId: string;
  locationId: string;
  patientId: string;
  dispenseOrderId: string;
}

export default function BillMedicationsByDispenseOrder(props: Props) {
  const mode = useDispenseOrderEditMode(props);
  return <BillMedicationsShell facilityId={props.facilityId} mode={mode} />;
}
