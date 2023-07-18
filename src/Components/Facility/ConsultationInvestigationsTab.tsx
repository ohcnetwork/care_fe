import ButtonV2 from "../Common/components/ButtonV2";
import { ConsultationTabProps } from "../../Common/constants";
import PageTitle from "../Common/PageTitle";
import CareIcon from "../../CAREUI/icons/CareIcon";
import InvestigationTab from "./Investigations/investigationsTab";
import { NonReadOnlyUsers } from "../../Utils/AuthorizeFor";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

export default function ConsultationInvestigationsTab({
  patientData,
  facilityId,
  patientId,
  consultationId,
}: ConsultationTabProps) {
  const { t } = useTranslation();
  return (
    <div>
      <div className="sm:flex justify-between">
        <PageTitle title="Investigations" hideBack={true} breadcrumbs={false} />
        <div className="pt-6">
          <ButtonV2
            authorizeFor={NonReadOnlyUsers}
            disabled={!patientData.is_active}
            onClick={() =>
              navigate(
                `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/investigation/`
              )
            }
          >
            <CareIcon className="care-l-plus" />
            <span>{t("log_lab_results")}</span>
          </ButtonV2>
        </div>
      </div>
      <InvestigationTab
        consultationId={consultationId}
        facilityId={facilityId}
        patientId={patientId}
        patientData={patientData}
      />
    </div>
  );
}
