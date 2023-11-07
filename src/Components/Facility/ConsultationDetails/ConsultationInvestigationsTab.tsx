import { t } from "i18next";
import { navigate } from "raviger";
import { lazy } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";
import ButtonV2 from "@/Components/Common/components/ButtonV2";
import { ConsultationTabProps } from "@/Components/Facility/ConsultationDetails/index";
import InvestigationTab from "@/Components/Facility/Investigations/investigationsTab";
import { NonReadOnlyUsers } from "@/Utils/AuthorizeFor";

const PageTitle = lazy(() => import("../../Common/PageTitle"));
export const ConsultationInvestigationsTab = (props: ConsultationTabProps) => {
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
};
