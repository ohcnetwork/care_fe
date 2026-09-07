import { EmptyState } from "@/components/ui/empty-state";
import { Form } from "@/components/ui/form";
import useCurrentLocation from "@/pages/Facility/locations/utils/useCurrentLocation";
import { BillMedicationsFooter } from "@/pages/Facility/services/pharmacy/billMedications/BillMedicationsFooter";
import {
  BillMedicationsOtherItemsCard,
  BillMedicationsPrescriptionCard,
} from "@/pages/Facility/services/pharmacy/billMedications/BillMedicationsPrescriptionCard";
import { billMedicationsFormSchema } from "@/pages/Facility/services/pharmacy/billMedications/formSchema";
import { BillMedicationsMode } from "@/pages/Facility/services/pharmacy/billMedications/modes/types";
import { AddMedicationSheet } from "@/pages/Facility/services/pharmacy/components/AddMedicationSheet";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pill } from "lucide-react";
import {
  FieldErrors,
  GlobalError,
  useFieldArray,
  useForm,
} from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Fragment } from "react/jsx-runtime";
import { toast } from "sonner";
import { z } from "zod";

interface Props {
  facilityId: string;
  mode: BillMedicationsMode;
}

export default function BillMedicationsForm({ facilityId, mode }: Props) {
  const { t } = useTranslation();
  const { locationId } = useCurrentLocation();

  const form = useForm({
    resolver: zodResolver(billMedicationsFormSchema),
    defaultValues: mode.defaultValues,
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const { fields: prescriptionFields, remove: removePrescription } =
    useFieldArray({
      control: form.control,
      name: "prescriptions",
    });

  const { append: appendOtherItem } = useFieldArray({
    control: form.control,
    name: "otherItems",
  });

  const otherItemsFields = form.watch("otherItems");
  const hasMedications =
    prescriptionFields.length > 0 || otherItemsFields.length > 0;

  const handleRemovePrescription = (index: number, prescriptionId: string) => {
    // Drop the prescription group from the form directly so edits made to the
    // remaining prescriptions and other items are preserved. The mode then
    // keeps the URL in sync (and navigates away when nothing is left to bill).
    removePrescription(index);
    mode.onRemovePrescription?.(prescriptionId);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(
          (values) => mode.submit(values),
          (errors) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const errorMessage = ((errors as any)[""] as GlobalError)?.message;
            if (errorMessage) {
              toast.error(errorMessage);
            }
            scrollToFirstLineItemError(errors);
          },
        )}
      >
        <div className="flex flex-col gap-2 py-4">
          <div className="grid grid-cols-[auto_1fr_1fr_auto_6rem_auto_auto] divide-x divide-y divide-gray-200 rounded-md border border-gray-200 overflow-auto">
            {prescriptionFields.map((field, index) => (
              <Fragment key={field.id}>
                {index !== 0 && <div className="col-span-7 h-8 bg-gray-50" />}
                <BillMedicationsPrescriptionCard
                  form={form}
                  name={`prescriptions.${index}`}
                  onRemove={() =>
                    handleRemovePrescription(index, field.prescription.id)
                  }
                />
              </Fragment>
            ))}

            {otherItemsFields.length > 0 && (
              <>
                {prescriptionFields.length > 0 && (
                  <div className="col-span-7 h-8 bg-gray-50 border-t border-gray-200" />
                )}
                <BillMedicationsOtherItemsCard form={form} />
              </>
            )}

            {!hasMedications && (
              <EmptyState
                className="col-span-7 rounded-none border-none"
                icon={<Pill className="text-primary size-6" />}
                title={t("no_medications")}
                description={t("add_medications_to_bill_description")}
              />
            )}
          </div>
        </div>

        <AddMedicationSheet
          facilityId={facilityId}
          locationId={locationId}
          onSave={({ productKnowledge, dosageInstructions, lots }) =>
            appendOtherItem({
              reference_id: crypto.randomUUID(),
              isSelected: true,
              medication: null,
              dosageInstructions,
              productKnowledge,
              substitution: null,
              lots: lots.map((lot) => ({ ...lot, autoSelected: false })),
              allGiven: true,
            })
          }
        />

        <div className="h-20" />

        <BillMedicationsFooter
          isBillingMedications={mode.isSubmitting}
          items={[
            ...form
              .watch("prescriptions")
              .flatMap((prescription) => prescription.items),
            ...form.watch("otherItems"),
          ]}
        />
      </form>
    </Form>
  );
}

/**
 * Scrolls to the first prescription/other item row that failed validation, so
 * the user doesn't have to hunt for the error in a long list of medications.
 */
function scrollToFirstLineItemError(
  errors: FieldErrors<z.infer<typeof billMedicationsFormSchema>>,
) {
  // Errors for line items are nested arrays keyed by index; walk them in the
  // same order they are rendered in.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prescriptions = (errors.prescriptions ?? []) as any[];
  for (let i = 0; i < prescriptions.length; i++) {
    const items = prescriptions[i]?.items ?? [];
    for (let j = 0; j < items.length; j++) {
      if (items[j]) {
        scrollToField(`prescriptions.${i}.items.${j}`);
        return;
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const otherItems = (errors.otherItems ?? []) as any[];
  for (let k = 0; k < otherItems.length; k++) {
    if (otherItems[k]) {
      scrollToField(`otherItems.${k}`);
      return;
    }
  }
}

function scrollToField(name: string) {
  document
    .querySelector(`[data-field-name="${name}"]`)
    ?.scrollIntoView({ behavior: "smooth", block: "center" });
}
