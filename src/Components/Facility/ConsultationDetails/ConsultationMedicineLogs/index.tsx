import { lazy } from "react";
import { useTranslation } from "react-i18next";
import routes from "../../../../Redux/api";
import useQuery from "../../../../Utils/request/useQuery";
import PageTitle from "../../../Common/PageTitle";
import MedicineRoutes from "../../../Medicine/routes";
import { formatDateTime } from "../../../../Utils/utils";
import Timeline, { TimelineNode } from "../../../../CAREUI/display/Timeline";
import { Prescription } from "../../../Medicine/models";

const Loading = lazy(() => import("../../../Common/Loading"));

export default function ConsultationMedicineLogs(props: any) {
  const { t } = useTranslation();
  const { consultationId, patientId, facilityId, medicineId } = props;

  const { data, loading } = useQuery(MedicineRoutes.listPrescriptions, {
    pathParams: { consultation: consultationId },
    query: {
      medicine: medicineId,
    },
  });

  const { data: patientData, loading: patientLoading } = useQuery(
    routes.getPatient,
    {
      pathParams: { id: patientId },
    }
  );

  const medicineName = data?.results[0]?.medicine_object?.name;

  if (patientLoading || loading) {
    return <Loading />;
  }

  const calculateChanges = (prescriptions: Prescription[]) => {
    const changes = [];

    // first prescription
    const message = `Details: Base Dosage: ${
      prescriptions[0].base_dosage ?? "Not specified"
    }, Route: ${prescriptions[0].route ?? "Not specified"}, Dosage Type: ${
      prescriptions[0].dosage_type ?? "Not specified"
    }, Target Dosage: ${
      prescriptions[0].target_dosage ?? "Not specified"
    }, Instruction on Titration: ${
      prescriptions[0].instruction_on_titration ?? "Not specified"
    }, Frequency: ${prescriptions[0].frequency ?? "Not specified"}, Days: ${
      prescriptions[0].days ?? "Not specified"
    }, Indicator: ${
      prescriptions[0].indicator ?? "Not specified"
    }, Max Dosage: ${
      prescriptions[0].max_dosage ?? "Not specified"
    }, Min Hours Between Doses: ${
      prescriptions[0].min_hours_between_doses ?? "Not specified"
    }`;
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
          `Base dosage changed to ${currentPrescription.base_dosage} mg from ${prevPrescription.base_dosage} mg`
        );
      }

      // Check for changes in route
      if (prevPrescription.route !== currentPrescription.route) {
        changesForPrescription.push(
          `Route changed to ${
            currentPrescription.route ?? "Not specified"
          } from ${prevPrescription.route ?? "Not specified"}`
        );
      }

      // Check for changes in dosage type
      if (prevPrescription.dosage_type !== currentPrescription.dosage_type) {
        changesForPrescription.push(
          `Dosage type changed to ${
            currentPrescription.dosage_type ?? "Not specified"
          } from ${prevPrescription.dosage_type ?? "Not specified"}`
        );
      }

      // Check for changes in target dosage
      if (
        prevPrescription.target_dosage !== currentPrescription.target_dosage
      ) {
        changesForPrescription.push(
          `Target dosage changed to ${
            currentPrescription.target_dosage ?? "Not specified"
          } from ${prevPrescription.target_dosage ?? "Not specified"}`
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
          }`
        );
      }

      // Check for changes in frequency
      if (prevPrescription.frequency !== currentPrescription.frequency) {
        changesForPrescription.push(
          `Frequency changed to ${
            currentPrescription.frequency ?? "Not specified"
          } from ${prevPrescription.frequency ?? "Not specified"}`
        );
      }

      // Check for changes in days
      if (prevPrescription.days !== currentPrescription.days) {
        changesForPrescription.push(
          `Days changed to ${
            currentPrescription.days ?? "Not specified"
          } from ${prevPrescription.days ?? "Not specified"}`
        );
      }

      // Check for changes in indicator
      if (prevPrescription.indicator !== currentPrescription.indicator) {
        changesForPrescription.push(
          `Indicator changed to ${
            currentPrescription.indicator ?? "Not specified"
          } from ${prevPrescription.indicator ?? "Not specified"}`
        );
      }

      // Check for changes in max dosage
      if (prevPrescription.max_dosage !== currentPrescription.max_dosage) {
        changesForPrescription.push(
          `Max dosage changed to ${
            currentPrescription.max_dosage ?? "Not specified"
          } from ${prevPrescription.max_dosage ?? "Not specified"}`
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
          } from ${prevPrescription.min_hours_between_doses ?? "Not specified"}`
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
        const message = `Details: Base Dosage: ${
          currentPrescription.base_dosage ?? "Not specified"
        }, Route: ${
          currentPrescription.route ?? "Not specified"
        }, Dosage Type: ${
          currentPrescription.dosage_type ?? "Not specified"
        }, Target Dosage: ${
          currentPrescription.target_dosage ?? "Not specified"
        }, Instruction on Titration: ${
          currentPrescription.instruction_on_titration ?? "Not specified"
        }, Frequency: ${
          currentPrescription.frequency ?? "Not specified"
        }, Days: ${currentPrescription.days ?? "Not specified"}, Indicator: ${
          currentPrescription.indicator ?? "Not specified"
        }, Max Dosage: ${
          currentPrescription.max_dosage ?? "Not specified"
        }, Min Hours Between Doses: ${
          currentPrescription.min_hours_between_doses ?? "Not specified"
        }`;
        changes.push({
          prescriptionId: currentPrescription.id,
          changeMessage: message,
          prescribed_by: currentPrescription.prescribed_by,
          created_date: currentPrescription.created_date,
        });
      }
    }

    return changes.reverse();
  };

  return (
    <div className="mx-auto max-w-7xl px-4">
      <PageTitle
        title={`${t("Medicines")}: ${medicineName}`}
        className="mx-3 md:mx-4"
        crumbsReplacements={{
          [facilityId]: { name: patientData?.facility_object?.name },
          [patientId]: { name: patientData?.name },
          [medicineId]: { name: data?.results[0]?.medicine_object?.name },
        }}
        backUrl={`/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/medicines`}
      />
      <div>
        <Timeline
          className="rounded-lg bg-white p-2 shadow"
          name={data?.results[0].medicine_object?.name ?? ""}
        >
          {data?.results &&
            calculateChanges(data?.results).map((changes, index) => (
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
      <div className="mt-12">
        <MedicineLogsTable prescriptionList={data?.results} />
      </div>
    </div>
  );
}

const MedicineLogsTable = (prescriptionList: any) => {
  return (
    <div className="overflow-x-scroll border-b border-gray-200 shadow sm:rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {[
              "Discontinued",
              "Frequency",
              "Base Dosage",
              "Max Dosage",
              "Prescription Type",
              "Prescribed By",
              "Date",
            ].map((heading) => (
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-800"
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody x-max="2">
          {prescriptionList?.prescriptionList?.length > 0 ? (
            prescriptionList?.prescriptionList
              ?.reverse()
              .map((t: any, i: any) => {
                return <PrescriptionRow data={t} key={t.id} i={i} />;
              })
          ) : (
            <tr className="text-center text-gray-500">
              No prescriptions found
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const PrescriptionRow = ({ data, i }: any) => {
  return (
    <tr
      className={i % 2 == 0 ? "bg-gray-50" : "bg-white"}
      x-description="Even row"
    >
      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
        {data?.discontinued ? "Yes" : "No"}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
        {data?.frequency}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
        {data?.base_dosage}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
        {data?.max_dosage}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
        {data?.prescription_type}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
        {data?.prescribed_by?.first_name} {data?.prescribed_by?.last_name}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
        {formatDateTime(data?.created_date)}
      </td>
    </tr>
  );
};
