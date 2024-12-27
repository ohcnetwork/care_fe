import PageTitle from "@/components/Common/PageHeadTitle";
import { ConsultationTabProps } from "@/components/Facility/ConsultationDetails/index";
import MedicineAdministrationSheet from "@/components/Medicine/MedicineAdministrationSheet";

export const ConsultationMedicinesTab = (props: ConsultationTabProps) => {
  return (
    <div className="my-4 flex flex-col gap-16">
      {/* eslint-disable-next-line i18next/no-literal-string */}
      <PageTitle title="Medicines" />
      <MedicineAdministrationSheet
        readonly={!!props.consultationData.discharge_date}
        isPrn={false}
      />
      <MedicineAdministrationSheet
        isPrn={true}
        readonly={!!props.consultationData.discharge_date}
      />
    </div>
  );
};
