import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const { goBack } = useAppHistory();

  return (
    <Page title={t("manage_prescriptions")}>
      <div className="flex flex-col gap-10 rounded sm:rounded-xl bg-white p-6 sm:p-12 transition-all w-full max-w-4xl mx-auto">
        <div className="flex flex-col gap-10 divide-y-2 divide-dashed divide-gray-600">
          <div>
            <h3 className="font-semibold text-lg mb-4">
              {t("prescription_medications")}
            </h3>
            <PrescriptionBuilder actions={actions} />
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-4 mt-8">
              {t("prn_prescriptions")}
            </h3>
            <PrescriptionBuilder actions={actions} is_prn />
          </div>
        </div>
        <div className="flex flex-col-reverse md:flex-row gap-3 w-full md:items-center">
          <ButtonV2 variant="secondary" border onClick={() => goBack()}>
            <CareIcon className="care-l-angle-left-b text-lg" />
            {t("return_to_patient_dashboard")}
          </ButtonV2>
          <span className="text-primary-500 text-sm">
            <CareIcon className="care-l-check text-base" />
            <span className="pl-1">{t("all_changes_have_been_saved")}</span>
          </span>
        </div>
      </div>
    </Page>
  );
}
