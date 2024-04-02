import { useTranslation } from "react-i18next";
import CareIcon from "../../CAREUI/icons/CareIcon";
import useAppHistory from "../../Common/hooks/useAppHistory";
import ButtonV2 from "../Common/components/ButtonV2";
import Page from "../Common/components/Page";
import PrescriptionBuilder from "./PrescriptionBuilder";

export default function ManagePrescriptions() {
  const { t } = useTranslation();
  const { goBack } = useAppHistory();

  return (
    <Page title={t("manage_prescriptions")}>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 rounded bg-white p-6 transition-all sm:rounded-xl sm:p-12">
        <div className="flex flex-col gap-10 divide-y-2 divide-dashed divide-gray-600">
          <div>
            <h3 className="mb-4 text-lg font-semibold">
              {t("prescription_medications")}
            </h3>
            <PrescriptionBuilder />
          </div>
          <div>
            <h3 className="mb-4 mt-8 text-lg font-semibold">
              {t("prn_prescriptions")}
            </h3>
            <PrescriptionBuilder is_prn />
          </div>
        </div>
        <div className="flex w-full flex-col-reverse gap-3 md:flex-row md:items-center">
          <ButtonV2
            variant="secondary"
            border
            onClick={() => goBack()}
            data-testid="return-to-patient-dashboard"
          >
            <CareIcon icon="l-angle-left-b" className="text-lg" />
            {t("return_to_patient_dashboard")}
          </ButtonV2>
          <span className="text-sm text-primary-500">
            <CareIcon icon="l-check" className="text-base" />
            <span className="pl-1">{t("all_changes_have_been_saved")}</span>
          </span>
        </div>
      </div>
    </Page>
  );
}
