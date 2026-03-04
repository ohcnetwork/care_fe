import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import { PatientHeader } from "@/components/Patient/PatientHeader";
import { EmptyState } from "@/components/ui/empty-state";
import { Form } from "@/components/ui/form";
import { ProductKnowledgeSelect } from "@/pages/Facility/services/inventory/ProductKnowledgeSelect";
import { BillMedicationsFooter } from "@/pages/Facility/services/pharmacy/billMedications/BillMedicationsFooter";
import { BillMedicationsLoadingCard } from "@/pages/Facility/services/pharmacy/billMedications/BillMedicationsLoadingCard";
import {
  BillMedicationsOtherItemsCard,
  BillMedicationsPrescriptionCard,
} from "@/pages/Facility/services/pharmacy/billMedications/BillMedicationsPrescriptionCard";
import { billMedicationsByPrescriptionsFormSchema } from "@/pages/Facility/services/pharmacy/billMedications/formSchema";
import UnbilledPrescriptionsCard from "@/pages/Facility/services/pharmacy/billMedications/UnbilledPrescriptionsCard";
import { ACTIVE_MEDICATION_STATUSES } from "@/types/emr/medicationRequest/medicationRequest";
import { PrescriptionRead } from "@/types/emr/prescription/prescription";
import prescriptionApi from "@/types/emr/prescription/prescriptionApi";
import query from "@/Utils/request/query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueries } from "@tanstack/react-query";
import { Pill } from "lucide-react";
import { navigate } from "raviger";
import { useEffect } from "react";
import { useFieldArray, useForm, UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Fragment } from "react/jsx-runtime";
import { z } from "zod";

interface Props {
  facilityId: string;
  locationId: string;
  patientId: string;
  prescriptionIds: string[];
}

export default function BillMedicationsByPrescriptions({
  facilityId,
  locationId,
  patientId,
  prescriptionIds,
}: Props) {
  const { t } = useTranslation();

  const { prescriptions, anyEncounter, isLoading } = useQueries({
    queries: prescriptionIds.map((prescriptionId) => ({
      queryKey: ["prescription", patientId, prescriptionId],
      queryFn: query(prescriptionApi.get, {
        pathParams: { patientId, id: prescriptionId },
      }),
    })),
    combine: (results) => {
      return {
        isLoading: results.some((result) => result.isLoading),
        prescriptions: results.map((result) => result.data),
        anyEncounter: results.find((result) => !!result.data)?.data.encounter,
      };
    },
  });

  const form = useForm({
    resolver: zodResolver(billMedicationsByPrescriptionsFormSchema),
    defaultValues: {
      prescriptions: [],
      otherItems: [],
    },
  });

  useEffect(() => {
    if (isLoading) {
      return;
    }

    form.reset({
      prescriptions: getPrescriptionFormValues(prescriptions),
      otherItems: [],
    });
  }, [form, prescriptions, isLoading]);

  const handleBillSelected = () => {
    // TODO: Implement bill selected logic
  };

  if (!anyEncounter) {
    return <Loading />;
  }

  const prescriptionFields = form.watch("prescriptions");
  const otherItemsFields = form.watch("otherItems");
  const hasMedications =
    prescriptionFields.length > 0 || otherItemsFields.length > 0;

  return (
    <Page title={t("bill_medications")} hideTitleOnPage={true}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleBillSelected)}>
          <div className="flex flex-col gap-3">
            <div>
              <h4 className="font-semibold text-xl">{t("bill_medications")}</h4>
            </div>

            <div className="bg-white rounded-md border border-gray-200 p-4">
              <PatientHeader
                patient={anyEncounter.patient}
                facilityId={facilityId}
              />
            </div>

            <UnbilledPrescriptionsCard
              included={prescriptionIds}
              onChangeIncluded={(ids) =>
                navigate(ids.join(","), { replace: true })
              }
              patientId={patientId}
              facilityId={facilityId}
            />

            <div className="flex flex-col gap-2">
              <div>{/* TODO: select all / print all / etc... */}</div>
              {/* TODO: remove divide-x/y in favour of controlled borders */}
              <div className="grid grid-cols-[auto_1fr_1fr_auto_6rem_auto_auto] divide-x divide-y divide-gray-200 rounded-md border border-gray-200 overflow-auto">
                {isLoading ? (
                  <BillMedicationsLoadingCard />
                ) : (
                  <>
                    {prescriptionFields.map((prescription, index) => (
                      <Fragment key={index}>
                        {index !== 0 && (
                          <div className="col-span-7 h-8 bg-gray-50" />
                        )}
                        {prescription && (
                          <BillMedicationsPrescriptionCard
                            form={form}
                            name={`prescriptions.${index}`}
                          />
                        )}
                      </Fragment>
                    ))}

                    {otherItemsFields.length > 0 && (
                      <>
                        <div className="col-span-7 h-8 bg-gray-50 border-t border-gray-200" />
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

            <AddMedicationTrigger form={form} />
          </div>
          <div className="h-20" />
          <BillMedicationsFooter
            items={form
              .watch("prescriptions")
              .flatMap((prescription) => prescription.items)}
            handleBillSelected={handleBillSelected}
          />
        </form>
      </Form>
    </Page>
  );
}

interface AddMedicationTriggerProps {
  form: UseFormReturn<z.infer<typeof billMedicationsByPrescriptionsFormSchema>>;
}

const AddMedicationTrigger = ({ form }: AddMedicationTriggerProps) => {
  const { t } = useTranslation();

  const { append } = useFieldArray({
    control: form.control,
    name: "otherItems",
  });

  // TODO: switch to using AddMedicationSheet once it's cleaned up to use the new form schema approach

  return (
    <ProductKnowledgeSelect
      onChange={(productKnowledge) => {
        if (!productKnowledge) return;

        append({
          reference_id: crypto.randomUUID(),
          isSelected: true,
          medication: null,
          dosageInstructions: [
            {
              dose_and_rate: productKnowledge.base_unit
                ? {
                    type: "ordered",
                    dose_quantity: {
                      value: "1",
                      unit: productKnowledge.base_unit,
                    },
                  }
                : undefined,
              timing: undefined,
              as_needed_boolean: true,
              route: undefined,
              site: undefined,
              method: undefined,
              additional_instruction: undefined,
              as_needed_for: undefined,
            },
          ],
          productKnowledge,
          substitution: null,
          lots: [],
          allGiven: true,
        });
      }}
      placeholder={t("add_medication")}
      className="w-full"
    />
  );
};

const getPrescriptionFormValues = (
  prescriptions: (PrescriptionRead | undefined)[],
) => {
  const result = [];

  for (const prescription of prescriptions) {
    if (!prescription) {
      continue;
    }

    const medications = prescription.medications.filter((medication) =>
      ACTIVE_MEDICATION_STATUSES.includes(
        medication.status as (typeof ACTIVE_MEDICATION_STATUSES)[number],
      ),
    );

    if (medications.length === 0) {
      continue;
    }

    result.push({
      prescription,
      markComplete: true,
      items: medications.map((medication) => ({
        isSelected: true,
        medication,
        productKnowledge: medication.requested_product,
        lots: [],
        allGiven: true,
      })),
    });
  }

  return result;
};
