import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import { PatientHeader } from "@/components/Patient/PatientHeader";
import { Form } from "@/components/ui/form";
import { AddMedicationTrigger } from "@/pages/Facility/services/pharmacy/AddMedicationTrigger";
import { BillMedicationsFooter } from "@/pages/Facility/services/pharmacy/billMedications/BillMedicationsFooter";
import { BillMedicationsOtherItemsCard } from "@/pages/Facility/services/pharmacy/billMedications/BillMedicationsPrescriptionCard";
import { billMedicationsByPrescriptionsFormSchema } from "@/pages/Facility/services/pharmacy/billMedications/formSchema";
import UnbilledPrescriptionsCard from "@/pages/Facility/services/pharmacy/billMedications/UnbilledPrescriptionsCard";
import useBillMedications from "@/pages/Facility/services/pharmacy/billMedications/utils/useBillMedications";
import encounterApi from "@/types/emr/encounter/encounterApi";
import query from "@/Utils/request/query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { GlobalError, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface Props {
  facilityId: string;
  locationId: string;
  patientId: string;
  encounterId: string;
}

export default function BillMedicationsByNewDispense({
  facilityId,
  locationId,
  patientId,
  encounterId,
}: Props) {
  const { t } = useTranslation();

  const { data: encounter } = useQuery({
    queryKey: ["encounter", encounterId],
    queryFn: query(encounterApi.get, {
      pathParams: { id: encounterId },
    }),
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

  const { mutate: billMedications, isPending: isBillingMedications } =
    useBillMedications({
      facilityId,
      locationId,
      patientId,
      fallbackEncounterId: encounterId,
      onSuccess: (dispenseOrder) => {
        toast.success(t("medications_billed_successfully"));
        navigate(
          `/facility/${facilityId}/locations/${locationId}/medication_dispense/order/${dispenseOrder.id}`,
          { replace: true },
        );
      },
    });

  const handleBillSelected = () => {
    billMedications({ items: form.getValues().otherItems });
  };

  if (!encounter) {
    return <Loading />;
  }

  return (
    <Page title={t("bill_medications")} hideTitleOnPage={true}>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleBillSelected, (errors) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const errorMessage = ((errors as any)[""] as GlobalError)?.message;
            if (errorMessage) {
              toast.error(errorMessage);
            }
          })}
        >
          <div className="flex flex-col gap-3">
            <div>
              <h4 className="font-semibold text-xl">{t("bill_medications")}</h4>
            </div>

            <div className="bg-white rounded-md border border-gray-200 p-4">
              <PatientHeader
                patient={encounter.patient}
                facilityId={facilityId}
              />
            </div>

            <UnbilledPrescriptionsCard
              included={[]}
              patientId={patientId}
              facilityId={facilityId}
              encounterId={encounterId}
            />

            <div className="flex flex-col gap-2">
              <div>{/* TODO: select all / print all / etc... */}</div>
              {/* TODO: remove divide-x/y in favour of controlled borders */}
              <div className="grid grid-cols-[auto_1fr_1fr_auto_6rem_auto_auto] divide-x divide-y divide-gray-200 rounded-md border border-gray-200 overflow-auto">
                <BillMedicationsOtherItemsCard form={form} />
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
