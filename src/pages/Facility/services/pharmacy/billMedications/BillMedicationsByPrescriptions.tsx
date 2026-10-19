import NoActiveAccountWarningDialog from "@/pages/Facility/billing/account/components/NoActiveAccountWarningDialog";
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

  return (
    <>
      <NoActiveAccountWarningDialog
        facilityId={props.facilityId}
        patientId={props.patientId}
      />
      <BillMedicationsShell facilityId={props.facilityId} mode={mode} />
    </>
  );
}
