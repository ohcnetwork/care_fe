import { ConsultationTabProps } from "./index";
import PrescriptionAdministrationsTable from "../../Medicine/PrescriptionAdministrationsTable";

export default function ConsultationMedicinesTab(props: ConsultationTabProps) {
  return (
    <div className="my-4 flex flex-col gap-16">
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
}
