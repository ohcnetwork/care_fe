import { billMedicationsFormSchema } from "@/pages/Facility/services/pharmacy/billMedications/formSchema";
import { EncounterRead } from "@/types/emr/encounter/encounter";
import { z } from "zod";

export type BillMedicationsFormValues = z.infer<
  typeof billMedicationsFormSchema
>;

export interface BillMedicationsMode {
  /** Encounter that drives the patient header. `undefined` while loading. */
  encounter: EncounterRead | undefined;

  /** Whether mode-specific data (e.g. prescriptions) is still loading. */
  isLoading: boolean;

  /** Initial form values. Recomputed when underlying data changes. */
  defaultValues: BillMedicationsFormValues;

  /** Submit the form. Receives the validated form values. */
  submit: (values: BillMedicationsFormValues) => void;

  /** Whether a submission is in progress. */
  isSubmitting: boolean;

  /** Page-level toggles for shell rendering. */
  pageOptions: {
    /** Patient id for the `UnbilledPrescriptionsCard`. Omit to hide it. */
    unbilledPrescriptionsFor?: {
      patientId: string;
      facilityId: string;
      encounterId: string;
      excludePrescriptionIds: string[];
    };
  };

  /**
   * Called by a prescription card when the user removes the prescription
   * group from the bill. Modes that don't support prescription groups can
   * leave this undefined.
   */
  onRemovePrescription?: (prescriptionId: string) => void;
}
