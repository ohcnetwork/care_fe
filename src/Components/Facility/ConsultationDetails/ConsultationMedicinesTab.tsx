import { ConsultationTabProps } from "./index";
import PageTitle from "../../Common/PageHeadTitle";
import MedicineAdministrationSheet from "../../Medicine/MedicineAdministrationSheet";
import MedicineRoutes from "../../Medicine/routes";
import { navigate } from "raviger";
import useQuery from "../../../Utils/request/useQuery";
import useSlug from "../../../Common/hooks/useSlug";
import { MedibaseMedicine } from "../../Medicine/models";

export const ConsultationMedicinesTab = (props: ConsultationTabProps) => {
  const facility = useSlug("facility");
  const patient = useSlug("patient");
  const consultation = useSlug("consultation");

  return (
    <div className="my-4 flex flex-col gap-16">
      {/* eslint-disable-next-line i18next/no-literal-string */}
      <PageTitle title="Medicines" />
      <MedicineAdministrationSheet
        readonly={!!props.consultationData.discharge_date}
        is_prn={false}
      />
      <MedicineAdministrationSheet
        is_prn={true}
        readonly={!!props.consultationData.discharge_date}
      />
      <MedicinePrescriptionSummary
        facility={facility}
        patient={patient}
        consultation={consultation}
      />
    </div>
  );
};

const MedicinePrescriptionSummary = ({
  facility,
  patient,
  consultation,
}: any) => {
  const { data } = useQuery(MedicineRoutes.listPrescriptions, {
    pathParams: { consultation },
    query: { limit: 100 },
  });

  function extractUniqueMedicineObjects(prescriptions: any): any[] {
    const uniqueMedicineObjects: Set<string> = new Set();
    const uniqueMedicines: MedibaseMedicine[] = [];

    prescriptions.forEach((prescription: any) => {
      const { medicine_object } = prescription;
      const medicineId = medicine_object.id;

      if (!uniqueMedicineObjects.has(medicineId)) {
        uniqueMedicineObjects.add(medicineId);
        uniqueMedicines.push(medicine_object);
      }
    });

    return uniqueMedicines;
  }

  const medicinesList = extractUniqueMedicineObjects(data?.results ?? []);

  return (
    <div className="pt-6">
      <p className="text-xl font-bold text-gray-700">Summary</p>
      <div className="flex flex-col gap-2 pt-4">
        {medicinesList &&
          medicinesList.length > 0 &&
          medicinesList?.map((med: any) => (
            <div
              key={med.external_id}
              className="flex cursor-pointer items-center justify-between rounded-lg border bg-white p-4 shadow hover:bg-gray-200"
            >
              <div>{med.name}</div>
              <button
                onClick={() =>
                  navigate(
                    `/facility/${facility}/patient/${patient}/consultation/${consultation}/medicine/${med.id}`
                  )
                }
                className="btn btn-default"
              >
                View
              </button>
            </div>
          ))}
      </div>
    </div>
  );
};
