import CareIcon from "../../CAREUI/icons/CareIcon";
import useAppHistory from "../../Common/hooks/useAppHistory";
import { PrescriptionActions } from "../../Redux/actions";
import ButtonV2 from "../Common/components/ButtonV2";
import Page from "../Common/components/Page";
import PrescriptionBuilder from "./PrescriptionBuilder";

interface Props {
  consultationId: string;
}

export default function ManagePrescriptions({ consultationId }: Props) {
  const actions = PrescriptionActions(consultationId);
  const { goBack } = useAppHistory();

  return (
    <Page title="Manage Prescriptions">
      <div className="flex flex-col gap-10 rounded sm:rounded-xl bg-white p-6 sm:p-12 transition-all w-full max-w-4xl mx-auto">
        <div className="flex flex-col gap-10 divide-y-2 divide-dashed divide-gray-600">
          <div>
            <h3 className="font-semibold text-lg mb-4">
              Prescription Medications
            </h3>
            <PrescriptionBuilder actions={actions} />
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-4 mt-8">
              PRN Prescriptions
            </h3>
            <PrescriptionBuilder actions={actions} is_prn />
          </div>
        </div>
        <div className="flex gap-3 w-full items-center">
          <ButtonV2 variant="secondary" border onClick={() => goBack()}>
            <CareIcon className="care-l-angle-left-b text-lg" />
            Return to Patient Dashboard
          </ButtonV2>
          <span className="text-primary-500 text-sm">
            <CareIcon className="care-l-check text-base" />
            <span className="pl-1">All changes have been saved</span>
          </span>
        </div>
      </div>
    </Page>
  );
}
