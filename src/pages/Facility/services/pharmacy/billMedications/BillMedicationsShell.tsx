import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import { PatientHeader } from "@/components/Patient/PatientHeader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import BillMedicationsForm from "@/pages/Facility/services/pharmacy/billMedications/BillMedicationsForm";
import { BillMedicationsLoadingCard } from "@/pages/Facility/services/pharmacy/billMedications/BillMedicationsLoadingCard";
import { BillMedicationsMode } from "@/pages/Facility/services/pharmacy/billMedications/modes/types";
import UnbilledPrescriptionsCard from "@/pages/Facility/services/pharmacy/billMedications/UnbilledPrescriptionsCard";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Props {
  facilityId: string;
  mode: BillMedicationsMode;
}

/**
 * Page-level shell for the bill-medications flow.
 *
 * Renders the static chrome (patient header, unbilled prescriptions) and acts
 * as a loading gate: the form (and its `useForm` instance) is only mounted once
 * the mode's data has finished loading, so the form is initialized a single
 * time with the fully-derived default values and never gets reset out from
 * under the user by a background refetch.
 */
export default function BillMedicationsShell({ facilityId, mode }: Props) {
  const { t } = useTranslation();
  // Saving dispenses refreshes prescriptions before the invoice is ready.
  // Keep the form and its selections mounted beneath the progress dialog.
  const isLoading = mode.isLoading && !mode.isSubmitting;

  if (!mode.encounter || isLoading) {
    return <Loading />;
  }

  const { unbilledPrescriptionsFor } = mode.pageOptions;

  return (
    <Page title={t("bill_medications")} hideTitleOnPage={true}>
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

        {isLoading ? (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-[auto_1fr_1fr_auto_6rem_auto_auto] divide-x divide-y divide-gray-200 rounded-md border border-gray-200 overflow-auto">
              <BillMedicationsLoadingCard />
            </div>
          </div>
        ) : (
          <BillMedicationsForm facilityId={facilityId} mode={mode} />
        )}
      </div>
      <Dialog open={mode.isSubmitting}>
        <DialogContent
          className="gap-3 p-8 text-center sm:max-w-sm [&>button]:hidden"
          onEscapeKeyDown={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary-50 text-primary-700">
            <Loader2
              className="size-6 animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
          </div>
          <DialogTitle>{t("preparing_your_bill")}</DialogTitle>
          <DialogDescription>
            {t("preparing_your_bill_description")}
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </Page>
  );
}
