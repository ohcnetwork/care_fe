import { ConsultationTabProps } from "./index";
import PrescriptionAdministrationsTable from "../../Medicine/PrescriptionAdministrationsTable";
import PageTitle from "../../Common/PageHeadTitle";

export const ConsultationMedicinesTab = (props: ConsultationTabProps) => {
  return (
    <div className="my-4 flex flex-col gap-16">
      {/* eslint-disable-next-line i18next/no-literal-string */}
      <PageTitle title="Medicines" />
      <PrescriptionAdministrationsTable
        consultation_id={props.consultationId}
        readonly={!!props.consultationData.discharge_date}
        prn={false}
      />
      <PrescriptionAdministrationsTable
        consultation_id={props.consultationId}
        prn={true}
        readonly={!!props.consultationData.discharge_date}
      />
    </div>
  );
};
