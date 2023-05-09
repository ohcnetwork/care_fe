import { PrescriptionActions } from "../../Redux/actions";
import Page from "../Common/components/Page";
import PrescriptionBuilder from "./PrescriptionBuilder";

interface Props {
  consultationId: string;
}

export default function ManagePrescriptions({ consultationId }: Props) {
  const actions = PrescriptionActions(consultationId);

  return (
    <Page title="Manage Prescriptions">
      <div className="flex flex-col gap-10 rounded sm:rounded-xl bg-white p-6 sm:p-12 transition-all w-full max-w-4xl mx-auto divide-y-2 divide-dashed divide-gray-600">
        <div>
          <h3 className="font-semibold text-lg mb-4">
            Prescription Medications
          </h3>
          <PrescriptionBuilder actions={actions} type="REGULAR" />
        </div>
        <div>
          <h3 className="font-semibold text-lg mb-4 mt-8">PRN Prescriptions</h3>
          <PrescriptionBuilder actions={actions} type="REGULAR" is_prn />
        </div>
      </div>
    </Page>
  );
}
