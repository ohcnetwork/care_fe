import { lazy } from "react";
import { useTranslation } from "react-i18next";
import routes from "../../../../Redux/api";
import useQuery from "../../../../Utils/request/useQuery";
import PageTitle from "../../../Common/PageTitle";
import MedicineRoutes from "../../../Medicine/routes";
import { formatDateTime } from "../../../../Utils/utils";

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
