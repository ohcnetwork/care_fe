import { ConsultationTabProps } from "./index";
import PageTitle from "../../Common/PageHeadTitle";
import MedicineAdministrationSheet from "../../Medicine/MedicineAdministrationSheet";
import MedicineRoutes from "../../Medicine/routes";
import useQuery from "../../../Utils/request/useQuery";
import useSlug from "../../../Common/hooks/useSlug";
import { MedibaseMedicine } from "../../Medicine/models";
import DialogModal from "../../Common/Dialog";
import { useState } from "react";
import { lazy } from "react";
import Timeline, { TimelineNode } from "../../../CAREUI/display/Timeline";
import { Prescription } from "../../Medicine/models";

const Loading = lazy(() => import("../../Common/Loading"));

export const ConsultationMedicinesTab = (props: ConsultationTabProps) => {
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
      <MedicinePrescriptionSummary consultation={consultation} />
    </div>
  );
};

const MedicinePrescriptionSummary = ({ consultation }: any) => {
  const [showMedicineModal, setShowMedicineModal] = useState({
    open: false,
    name: "",
    medicineId: "",
  });
  const { data } = useQuery(MedicineRoutes.listPrescriptions, {
    pathParams: { consultation },
    query: { limit: 100 },
  });

  const closeMedicineModal = () => {
    setShowMedicineModal({ ...showMedicineModal, open: false });
  };

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
                  setShowMedicineModal({
                    open: true,
                    name: med.name,
                    medicineId: med.id,
                  })
                }
                className="btn btn-default"
              >
                View
              </button>
            </div>
          ))}
      </div>

      <DialogModal
        title={<p>{showMedicineModal.name} Prescription Logs</p>}
        show={showMedicineModal.open}
        onClose={closeMedicineModal}
        fixedWidth={false}
        className="md:w-3/4"
      >
        <ConsultationMedicineLogs
          consultationId={consultation}
          medicineId={showMedicineModal.medicineId}
        />
      </DialogModal>
    </div>
  );
};

export default function ConsultationMedicineLogs(props: any) {
  const { consultationId, medicineId } = props;

  const { data, loading } = useQuery(MedicineRoutes.listPrescriptions, {
    pathParams: { consultation: consultationId },
    query: {
      medicine: medicineId,
    },
  });

  if (loading) {
    return <Loading />;
  }

  const calculateChanges = (prescriptions: Prescription[]) => {
    const changes = [];

    const message = `Details: ${
      prescriptions[0].base_dosage != null
        ? `Base Dosage: ${prescriptions[0].base_dosage} mg, `
        : ""
    }${
      prescriptions[0].route != null ? `Route: ${prescriptions[0].route}, ` : ""
    }${
      prescriptions[0].dosage_type != null
        ? `Dosage Type: ${prescriptions[0].dosage_type}, `
        : ""
    }${
      prescriptions[0].target_dosage != null
        ? `Target Dosage: ${prescriptions[0].target_dosage} mg, `
        : ""
    }${
      prescriptions[0].instruction_on_titration != null
        ? `Instruction on Titration: ${prescriptions[0].instruction_on_titration}, `
        : ""
    }${
      prescriptions[0].frequency != null
        ? `Frequency: ${prescriptions[0].frequency}, `
        : ""
    }${
      prescriptions[0].days != null ? `Days: ${prescriptions[0].days}, ` : ""
    }${
      prescriptions[0].indicator != null
        ? `Indicator: ${prescriptions[0].indicator}, `
        : ""
    }${
      prescriptions[0].max_dosage != null
        ? `Max Dosage: ${prescriptions[0].max_dosage} mg, `
        : ""
    }${
      prescriptions[0].min_hours_between_doses != null
        ? `Min Hours Between Doses: ${prescriptions[0].min_hours_between_doses}, `
        : ""
    }`.replace(/, $/, ""); // Remove trailing comma and space if any

    changes.push({
      prescriptionId: prescriptions[0].id,
      changeMessage: message,
      prescribed_by: prescriptions[0].prescribed_by,
      created_date: prescriptions[0].created_date,
    });

    for (let i = 1; i < prescriptions.length; i++) {
      const prevPrescription = prescriptions[i - 1];
      const currentPrescription = prescriptions[i];

      const changesForPrescription: string[] = [];

      // Check for changes in base dosage
      if (prevPrescription.base_dosage !== currentPrescription.base_dosage) {
        changesForPrescription.push(
          `Base dosage changed to ${currentPrescription.base_dosage} mg from ${prevPrescription.base_dosage} mg`,
        );
      }

      // Check for changes in route
      if (prevPrescription.route !== currentPrescription.route) {
        changesForPrescription.push(
          `Route changed to ${
            currentPrescription.route ?? "Not specified"
          } from ${prevPrescription.route ?? "Not specified"}`,
        );
      }

      // Check for changes in dosage type
      if (prevPrescription.dosage_type !== currentPrescription.dosage_type) {
        changesForPrescription.push(
          `Dosage type changed to ${
            currentPrescription.dosage_type ?? "Not specified"
          } from ${prevPrescription.dosage_type ?? "Not specified"}`,
        );
      }

      // Check for changes in target dosage
      if (
        prevPrescription.target_dosage !== currentPrescription.target_dosage
      ) {
        changesForPrescription.push(
          `Target dosage changed to ${
            currentPrescription.target_dosage ?? "Not specified"
          } from ${prevPrescription.target_dosage ?? "Not specified"}`,
        );
      }

      // Check for changes in instruction on titration
      if (
        prevPrescription.instruction_on_titration !==
        currentPrescription.instruction_on_titration
      ) {
        changesForPrescription.push(
          `Instruction on titration changed to ${
            currentPrescription.instruction_on_titration ?? "Not specified"
          } from ${
            prevPrescription.instruction_on_titration ?? "Not specified"
          }`,
        );
      }

      // Check for changes in frequency
      if (prevPrescription.frequency !== currentPrescription.frequency) {
        changesForPrescription.push(
          `Frequency changed to ${
            currentPrescription.frequency ?? "Not specified"
          } from ${prevPrescription.frequency ?? "Not specified"}`,
        );
      }

      // Check for changes in days
      if (prevPrescription.days !== currentPrescription.days) {
        changesForPrescription.push(
          `Days changed to ${
            currentPrescription.days ?? "Not specified"
          } from ${prevPrescription.days ?? "Not specified"}`,
        );
      }

      // Check for changes in indicator
      if (prevPrescription.indicator !== currentPrescription.indicator) {
        changesForPrescription.push(
          `Indicator changed to ${
            currentPrescription.indicator ?? "Not specified"
          } from ${prevPrescription.indicator ?? "Not specified"}`,
        );
      }

      // Check for changes in max dosage
      if (prevPrescription.max_dosage !== currentPrescription.max_dosage) {
        changesForPrescription.push(
          `Max dosage changed to ${
            currentPrescription.max_dosage ?? "Not specified"
          } from ${prevPrescription.max_dosage ?? "Not specified"}`,
        );
      }

      // Check for changes in min hours between doses
      if (
        prevPrescription.min_hours_between_doses !==
        currentPrescription.min_hours_between_doses
      ) {
        changesForPrescription.push(
          `Min hours between doses changed to ${
            currentPrescription.min_hours_between_doses ?? "Not specified"
          } from ${prevPrescription.min_hours_between_doses ?? "Not specified"}`,
        );
      }

      // If there are changes, add them to the changes array
      if (changesForPrescription.length > 0) {
        const message = `Changes: ${changesForPrescription.join(", ")}`;
        changes.push({
          prescriptionId: currentPrescription.id,
          changeMessage: message,
          prescribed_by: currentPrescription.prescribed_by,
          created_date: currentPrescription.created_date,
        });
      } else {
        // If no changes, just list out the details of the prescription
        const message = `Details: ${
          currentPrescription.base_dosage != null
            ? `Base Dosage: ${currentPrescription.base_dosage} mg, `
            : ""
        }${
          currentPrescription.route != null
            ? `Route: ${currentPrescription.route}, `
            : ""
        }${
          currentPrescription.dosage_type != null
            ? `Dosage Type: ${currentPrescription.dosage_type}, `
            : ""
        }${
          currentPrescription.target_dosage != null
            ? `Target Dosage: ${currentPrescription.target_dosage} mg, `
            : ""
        }${
          currentPrescription.instruction_on_titration != null
            ? `Instruction on Titration: ${currentPrescription.instruction_on_titration}, `
            : ""
        }${
          currentPrescription.frequency != null
            ? `Frequency: ${currentPrescription.frequency}, `
            : ""
        }${
          currentPrescription.days != null
            ? `Days: ${currentPrescription.days}, `
            : ""
        }${
          currentPrescription.indicator != null
            ? `Indicator: ${currentPrescription.indicator}, `
            : ""
        }${
          currentPrescription.max_dosage != null
            ? `Max Dosage: ${currentPrescription.max_dosage} mg, `
            : ""
        }${
          currentPrescription.min_hours_between_doses != null
            ? `Min Hours Between Doses: ${currentPrescription.min_hours_between_doses}, `
            : ""
        }`.replace(/, $/, ""); // Remove trailing comma and space if any

        changes.push({
          prescriptionId: currentPrescription.id,
          changeMessage: message,
          prescribed_by: currentPrescription.prescribed_by,
          created_date: currentPrescription.created_date,
        });
      }
    }

    return changes;
  };

  return (
    <div>
      <Timeline
        className="rounded-lg bg-white p-2 shadow"
        name={data?.results[0].medicine_object?.name ?? ""}
      >
        {data?.results &&
          calculateChanges(data?.results.reverse()).map((changes, index) => (
            <TimelineNode
              event={{
                type: "prescribed",
                timestamp: changes.created_date,
                by: changes.prescribed_by,
                icon: "l-syringe",
              }}
              isLast={index == data?.results.length - 1}
            >
              <p>{changes?.changeMessage}</p>
            </TimelineNode>
          ))}
      </Timeline>
    </div>
  );
}
