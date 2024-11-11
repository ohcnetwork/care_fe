import { t } from "i18next";
import { navigate } from "raviger";

import CareIcon from "@/CAREUI/icons/CareIcon";

import ButtonV2 from "@/components/Common/ButtonV2";
import PageTitle from "@/components/Common/PageTitle";
import { ConsultationTabProps } from "@/components/Facility/ConsultationDetails/index";
import InvestigationTab from "@/components/Facility/Investigations/investigationsTab";

import { NonReadOnlyUsers } from "@/Utils/AuthorizeFor";

export const ConsultationInvestigationsTab = (props: ConsultationTabProps) => {
  return (
    <div>
      <div className="justify-between sm:flex">
        <PageTitle title="Investigations" hideBack={true} breadcrumbs={false} />
        <div className="pt-6">
          <ButtonV2
            id="log-lab-results"
            authorizeFor={NonReadOnlyUsers}
            disabled={!props.patientData.is_active}
            onClick={() =>
              navigate(
                `/facility/${props.facilityId}/patient/${props.patientId}/consultation/${props.consultationId}/investigation/`,
              )
            }
          >
            <CareIcon icon="l-plus" />
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
