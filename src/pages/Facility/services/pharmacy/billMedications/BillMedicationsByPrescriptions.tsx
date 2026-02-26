import BackButton from "@/components/Common/BackButton";
import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import { PatientHeader } from "@/components/Patient/PatientHeader";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { MonetaryDisplay } from "@/components/ui/monetary-display";
import { BillMedicationsPrescriptionCard } from "@/pages/Facility/services/pharmacy/billMedications/BillMedicationsPrescriptionCard";
import { billMedicationsByPrescriptionsFormSchema } from "@/pages/Facility/services/pharmacy/billMedications/formSchema";
import UnbilledPrescriptionsCard from "@/pages/Facility/services/pharmacy/billMedications/UnbilledPrescriptionsCard";
import prescriptionApi from "@/types/emr/prescription/prescriptionApi";
import query from "@/Utils/request/query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueries } from "@tanstack/react-query";
import { ArrowRightIcon } from "lucide-react";
import { navigate } from "raviger";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Fragment } from "react/jsx-runtime";

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
    },
  });

  useEffect(() => {
    if (isLoading) {
      return;
    }

    form.reset({
      prescriptions: prescriptions.map((prescription) => ({
        prescription,
        markComplete: true,
        items: prescription?.medications.map((medication) => ({
          isSelected: true,
          medication,
          productKnowledge: medication.requested_product,
          lots: [],
          allGiven: true,
        })),
      })),
    });
  }, [form, prescriptions, isLoading]);

  const handleBillSelected = () => {
    // TODO: Implement bill selected logic
  };

  if (!anyEncounter) {
    return <Loading />;
  }

  console.log(form.getValues());

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
              <div className="grid grid-cols-[auto_1fr_1fr_auto_6rem_auto_auto] divide-y divide-x divide-gray-200 rounded-md border border-gray-200 overflow-hidden">
                {form.watch("prescriptions").map((prescription, index) => (
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
              </div>
            </div>
          </div>
          <div className="h-20" />
          {/* Fixed estimated total and actions bar */}
          <div className="flex justify-between items-center bg-white px-6 py-4 fixed bottom-0 left-0 right-0 z-10 border-t border-gray-200 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
            <div className="w-full max-w-2xl">
              <div className="flex flex-col gap-0.5">
                <div className="text-gray-700">
                  <span>{t("estimated_total")}</span>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-xl font-semibold text-black tabular-nums">
                    <MonetaryDisplay amount={450} />
                  </span>
                  <span className="text-base font-medium text-red-600 italic">
                    ({t("final_amount_is_calculated_after_invoice_generation")})
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-6">
              <BackButton variant="outline" size="lg">
                {t("cancel")}
              </BackButton>
              <Button variant="primary" size="lg" onClick={handleBillSelected}>
                {t("bill_selected")}
                <ArrowRightIcon className="size-4" />
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </Page>
  );
}
