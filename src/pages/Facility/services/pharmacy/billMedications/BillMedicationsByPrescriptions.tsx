import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import { PatientHeader } from "@/components/Patient/PatientHeader";
import { EmptyState } from "@/components/ui/empty-state";
import { Form } from "@/components/ui/form";
import { AddMedicationTrigger } from "@/pages/Facility/services/pharmacy/AddMedicationTrigger";
import { BillMedicationsFooter } from "@/pages/Facility/services/pharmacy/billMedications/BillMedicationsFooter";
import { BillMedicationsLoadingCard } from "@/pages/Facility/services/pharmacy/billMedications/BillMedicationsLoadingCard";
import {
  BillMedicationsOtherItemsCard,
  BillMedicationsPrescriptionCard,
} from "@/pages/Facility/services/pharmacy/billMedications/BillMedicationsPrescriptionCard";
import { billMedicationsByPrescriptionsFormSchema } from "@/pages/Facility/services/pharmacy/billMedications/formSchema";
import UnbilledPrescriptionsCard from "@/pages/Facility/services/pharmacy/billMedications/UnbilledPrescriptionsCard";
import useBillMedications from "@/pages/Facility/services/pharmacy/billMedications/utils/useBillMedications";
import { isMedicationDispenseable } from "@/pages/Facility/services/pharmacy/billMedications/utils/utils";
import { ACTIVE_MEDICATION_STATUSES } from "@/types/emr/medicationRequest/medicationRequest";
import { PrescriptionRead } from "@/types/emr/prescription/prescription";
import prescriptionApi from "@/types/emr/prescription/prescriptionApi";
import query from "@/Utils/request/query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueries } from "@tanstack/react-query";
import { Pill } from "lucide-react";
import { navigate } from "raviger";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Fragment } from "react/jsx-runtime";
import { toast } from "sonner";

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
    mode: "onChange",
    reValidateMode: "onChange",
  });

  useEffect(() => {
    if (isLoading) {
      return;
    }

    form.reset({
      prescriptions: getPrescriptionFormValues(prescriptions),
      otherItems: [],
    });
  }, [form, prescriptions, isLoading, patientId]);

  const { mutate: billMedications, isPending: isBillingMedications } =
    useBillMedications({
      facilityId,
      locationId,
      patientId,
      fallbackEncounterId: anyEncounter?.id ?? "",
      onSuccess: (dispenseOrder) => {
        toast.success(t("medications_billed_successfully"));
        navigate(
          `/facility/${facilityId}/locations/${locationId}/medication_dispense/order/${dispenseOrder.id}`,
        );
      },
    });

  const handleBillSelected = () => {
    const { prescriptions, otherItems } = form.getValues();

    billMedications({
      items: [
        ...prescriptions.flatMap((prescription) => prescription.items),
        ...otherItems,
      ],
      prescriptionsToComplete: prescriptions
        .filter((p) => p.markComplete)
        .map(({ prescription }) => prescription.id),
    });
  };

  if (!anyEncounter) {
    return <Loading />;
  }

  const prescriptionsFields = form.watch("prescriptions");
  const otherItemsFields = form.watch("otherItems");
  const hasMedications =
    prescriptionsFields.length > 0 || otherItemsFields.length > 0;

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
              patientId={patientId}
              facilityId={facilityId}
              encounterId={anyEncounter.id}
            />

            <div className="flex flex-col gap-2">
              <div>{/* TODO: select all / print all / etc... */}</div>
              {/* TODO: remove divide-x/y in favour of controlled borders */}
              <div className="grid grid-cols-[auto_1fr_1fr_auto_6rem_auto_auto] divide-x divide-y divide-gray-200 rounded-md border border-gray-200 overflow-auto">
                {isLoading ? (
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
                            onRemove={() => {
                              const newIds = prescriptionIds.filter(
                                (id) => id !== prescription.prescription.id,
                              );

                              if (newIds.length === 0) {
                                navigate(
                                  `/facility/${facilityId}/locations/${locationId}/medication_requests`,
                                );
                              } else {
                                navigate(newIds.join(","), { replace: true });
                              }
                            }}
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
            isBillingMedications={isBillingMedications}
            items={form
              .watch("prescriptions")
              .flatMap((prescription) => prescription.items)}
          />
        </form>
      </Form>
    </Page>
  );
}

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
        reference_id: crypto.randomUUID(),
        isSelected: isMedicationDispenseable(medication),
        medication,
        productKnowledge: medication.requested_product,
        substitution: null,
        dosageInstructions: null,
        lots: [],
        allGiven: true,
      })),
    });
  }

  return result;
};
