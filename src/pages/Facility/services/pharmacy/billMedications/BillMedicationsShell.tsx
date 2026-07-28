import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import { PatientHeader } from "@/components/Patient/PatientHeader";
import { EmptyState } from "@/components/ui/empty-state";
import { Form } from "@/components/ui/form";
import useCurrentLocation from "@/pages/Facility/locations/utils/useCurrentLocation";
import { BillMedicationsFooter } from "@/pages/Facility/services/pharmacy/billMedications/BillMedicationsFooter";
import { BillMedicationsLoadingCard } from "@/pages/Facility/services/pharmacy/billMedications/BillMedicationsLoadingCard";
import {
  BillMedicationsOtherItemsCard,
  BillMedicationsPrescriptionCard,
} from "@/pages/Facility/services/pharmacy/billMedications/BillMedicationsPrescriptionCard";
import { billMedicationsFormSchema } from "@/pages/Facility/services/pharmacy/billMedications/formSchema";
import { BillMedicationsMode } from "@/pages/Facility/services/pharmacy/billMedications/modes/types";
import UnbilledPrescriptionsCard from "@/pages/Facility/services/pharmacy/billMedications/UnbilledPrescriptionsCard";
import { AddMedicationSheet } from "@/pages/Facility/services/pharmacy/components/AddMedicationSheet";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pill } from "lucide-react";
import { useEffect } from "react";
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

export default function BillMedicationsShell({ facilityId, mode }: Props) {
  const { t } = useTranslation();
  const { locationId } = useCurrentLocation();

  const form = useForm({
    resolver: zodResolver(billMedicationsFormSchema),
    defaultValues: mode.defaultValues,
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const { append: appendOtherItem } = useFieldArray({
    control: form.control,
    name: "otherItems",
  });

  useEffect(() => {
    if (mode.isLoading) return;
    form.reset(mode.defaultValues);
    // form is stable from react-hook-form; defaultValues identity changes when the underlying data does
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode.defaultValues, mode.isLoading]);

  if (!mode.encounter) {
    return <Loading />;
  }

  const prescriptionsFields = form.watch("prescriptions");
  const otherItemsFields = form.watch("otherItems");
  const hasMedications =
    prescriptionsFields.length > 0 || otherItemsFields.length > 0;

  const { unbilledPrescriptionsFor } = mode.pageOptions;

  return (
    <Page title={t("bill_medications")} hideTitleOnPage={true}>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(
            (values) => mode.submit(values),
            (errors) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const errorMessage = ((errors as any)[""] as GlobalError)
                ?.message;
              if (errorMessage) {
                toast.error(errorMessage);
              }
              scrollToFirstLineItemError(errors);
            },
          )}
        >
          <div className="flex flex-col gap-3">
            <div>
              <h4 className="font-semibold text-xl">{t("bill_medications")}</h4>
            </div>

            <div className="bg-white rounded-md border border-gray-200 p-4">
              <PatientHeader
                patient={mode.encounter.patient}
                facilityId={facilityId}
              />
            </div>

            {unbilledPrescriptionsFor && (
              <UnbilledPrescriptionsCard
                included={unbilledPrescriptionsFor.excludePrescriptionIds}
                patientId={unbilledPrescriptionsFor.patientId}
                facilityId={unbilledPrescriptionsFor.facilityId}
                encounterId={unbilledPrescriptionsFor.encounterId}
              />
            )}

            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-[auto_1fr_1fr_auto_6rem_auto_auto] divide-x divide-y divide-gray-200 rounded-md border border-gray-200 overflow-auto">
                {mode.isLoading ? (
                  <BillMedicationsLoadingCard />
                ) : (
                  <>
                    {prescriptionsFields.map((prescription, index) => (
                      <Fragment key={index}>
                        {index !== 0 && (
                          <div className="col-span-7 h-8 bg-gray-50" />
                        )}
                        {prescription && (
                          <BillMedicationsPrescriptionCard
                            form={form}
                            name={`prescriptions.${index}`}
                            onRemove={() =>
                              mode.onRemovePrescription?.(
                                prescription.prescription.id,
                              )
                            }
                          />
                        )}
                      </Fragment>
                    ))}

                    {otherItemsFields.length > 0 && (
                      <>
                        {prescriptionsFields.length > 0 && (
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
                  </>
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
          </div>
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
    </Page>
  );
}
