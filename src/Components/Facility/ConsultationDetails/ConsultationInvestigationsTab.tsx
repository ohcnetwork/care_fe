import { lazy } from "react";
import ButtonV2 from "../../Common/components/ButtonV2";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import { NonReadOnlyUsers } from "../../../Utils/AuthorizeFor";
import InvestigationTab from "../Investigations/investigationsTab";
import { t } from "i18next";
import { navigate } from "raviger";
import { ConsultationTabProps } from "./index";

const PageTitle = lazy(() => import("../../Common/PageTitle"));

export default function ConsultationInvestigationsTab(
  props: ConsultationTabProps
) {
  return (
    <div>
      <div className="justify-between sm:flex">
        <PageTitle title="Investigations" hideBack={true} breadcrumbs={false} />
        <div className="pt-6">
          <ButtonV2
            authorizeFor={NonReadOnlyUsers}
            disabled={!props.patientData.is_active}
            onClick={() =>
              navigate(
                `/facility/${props.facilityId}/patient/${props.patientId}/consultation/${props.consultationId}/investigation/`
              )
            }
          >
            <CareIcon className="care-l-plus" />
            <span>{t("log_lab_results")}</span>
          </ButtonV2>
        </div>
      </div>
      <InvestigationTab
        consultationId={props.consultationId}
        facilityId={props.facilityId}
        patientId={props.patientId}
        patientData={props.patientData}
      />
    </div>
  );
}
