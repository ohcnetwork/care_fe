import { lazy } from "react";
import { ConsultationTabProps } from "./index";
import { NursingPlot } from "../Consultations/NursingPlot";
import { useTranslation } from "react-i18next";

const PageTitle = lazy(() => import("../../Common/PageTitle"));

export const ConsultationNursingTab = (props: ConsultationTabProps) => {
  const { t } = useTranslation();
  return (
    <div>
      <PageTitle
        title={t("CONSULTATION_TAB_TITLE__NURSING")}
        hideBack
        breadcrumbs={false}
      />
      <NursingPlot
        facilityId={props.facilityId}
        patientId={props.patientId}
        consultationId={props.consultationId}
      />
    </div>
  );
};
