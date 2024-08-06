import { useTranslation } from "react-i18next";
import PrintPreview from "../../CAREUI/misc/PrintPreview";
import { useSlugs } from "../../Common/hooks/useSlug";
import routes from "../../Redux/api";
import useQuery from "../../Utils/request/useQuery";
import { classNames, formatDate, formatPatientAge } from "../../Utils/utils";
import MedicineRoutes from "./routes";
import { Prescription } from "./models";
import CheckBoxFormField from "../Form/FormFields/CheckBoxFormField";
import { useState } from "react";

export default function PrescriptionsPrintPreview() {
  const { t } = useTranslation();
  const [patientId, consultationId] = useSlugs("patient", "consultation");

  const patientQuery = useQuery(routes.getPatient, {
    pathParams: { id: patientId },
  });

  const prescriptionsQuery = useQuery(MedicineRoutes.listPrescriptions, {
    pathParams: { consultation: consultationId },
    query: { discontinued: false, limit: 100 },
  });

  const patient = patientQuery.data;

  return (
    <PrintPreview
      title={
        patient ? `Prescriptions - ${patient.name}` : "Print Prescriptions"
      }
      disabled={!prescriptionsQuery.data?.results?.length || !patient}
    >
      <div className="mb-4 grid grid-cols-2 border-2 border-secondary-400">
        <PrescriptionIcon />
        <div className="my-auto flex flex-col gap-0.5 p-2">
          <PatientDetail
            name="Patient Name"
            value={patient?.name?.toUpperCase()}
          />
          <PatientDetail
            name="DOB"
            value={patient && formatDate(patient.date_of_birth)}
          />
          <PatientDetail
            name="Age"
            value={patient && formatPatientAge(patient, true)}
          />
          <PatientDetail
            name="Gender"
            value={patient && t(`GENDER__${patient.gender}`)}
          />
        </div>
      </div>
      <PrescriptionsTable items={prescriptionsQuery.data?.results} />
    </PrintPreview>
  );
}

const PrescriptionIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="178.313"
    height="212.219"
    className="-mx-4 -my-8 scale-50"
  >
    <path
      d="M318.281 282.844c-2.083 0-5.44.057-10.062.187-12.5.456-22.425.688-29.781.688-6.641 0-15.93-.26-27.844-.781l-.781.687v4.875l.78.688c6.902.26 11.243.638 13 1.093 1.759.456 2.945 1.034 3.563 1.75.619.717 1.082 2.133 1.375 4.281.293 2.15.466 6.954.531 14.375l.188 19.032v45.219l-.094 20.593c-.065 6.966-.327 11.482-.75 13.5-.423 2.018-.972 3.32-1.656 3.938-.684.618-2.013 1.14-4.031 1.531-2.018.39-6.07.708-12.125.969l-.781.594v4.875l.78.78c16.602-.52 25.92-.78 27.938-.78 2.604 0 6.222.057 10.844.187 11.133.39 16.862.594 17.188.594l.78-.781v-4.875l-.78-.594c-6.902-.26-11.243-.637-13-1.125-1.758-.489-2.945-1.097-3.563-1.813-.618-.716-1.08-2.133-1.406-4.281-.326-2.148-.529-6.924-.594-14.281l-.094-19.031v-45.22c0-22.98.492-35.192 1.47-36.624 6.054-1.888 12.476-2.813 19.312-2.813 9.765 0 17.52 2.2 23.25 6.594 5.729 4.395 8.593 10.875 8.593 19.469 0 9.57-3.182 17.065-9.562 22.469-6.38 5.403-15.206 8.093-26.469 8.093-1.888 0-4.52-.086-7.906-.281l-.969 3.031c11.719 13.347 23.177 27.813 34.375 43.438 9.187 12.849 15.957 21.961 20.469 27.531l3.062 5.125-26.656 37.469c-6.836 9.505-11.437 15.756-13.781 18.719-2.344 2.962-4.253 4.813-5.75 5.562-1.498.749-4.45 1.154-8.813 1.219l-.781.781v4.688l.875.875c4.102-.26 7.401-.375 9.875-.375 2.409 0 5.737.114 9.969.375 12.695-21.29 23.718-38.391 33.094-51.282l7.125-9.844 29.687 43.844a300.416 300.416 0 0 0 10.844 17.281c6.705-.26 11.71-.375 15.031-.375 2.539 0 6.909.115 13.094.375l.781-.78V489.5l-.781-.781c-4.167-.065-6.828-.356-8-.844-1.172-.488-2.736-1.962-4.656-4.469-1.921-2.506-4.438-6.297-7.563-11.375l-36.531-52.719c-.075-.356-.211-.71-.375-1.093l7.125-9.469 18.156-24.625c6.51-8.789 10.822-14.286 12.938-16.5 2.115-2.213 3.852-3.603 5.187-4.156 1.335-.553 4.055-.93 8.156-1.125l.781-.781v-4.375l-.78-.907c-5.535.196-8.574.313-9.094.313-1.172 0-4.498-.117-10.032-.313l-37.312 54.75c-1.462-1.871-3.536-4.882-6.75-9.094a1755.09 1755.09 0 0 1-14.438-19.187l-13.875-18.344c-4.752-6.25-8.052-10.648-9.875-13.187 9.83-1.888 17.557-4.725 23.156-8.469 5.6-3.743 9.823-8.226 12.688-13.5 2.864-5.273 4.312-10.656 4.313-16.125 0-8.203-2.922-15.292-8.782-21.281-5.86-5.99-17.028-9-33.5-9z"
      transform="translate(-249.813 -282.844)"
    />
  </svg>
);

const PatientDetail = ({ name, value }: { name: string; value?: string }) => {
  return (
    <div className="inline-flex items-center tracking-wide">
      <div className="w-28 font-bold text-secondary-700">{name}: </div>
      {value ? (
        <span className="pl-2 font-bold">{value}</span>
      ) : (
        <div className="h-5 w-48 animate-pulse bg-secondary-200" />
      )}
    </div>
  );
};

const PrescriptionsTable = ({ items }: { items?: Prescription[] }) => {
  if (!items) {
    return (
      <div className="h-96 w-full animate-pulse rounded-lg bg-secondary-200" />
    );
  }

  return (
    <table className="w-full border-collapse border-2 border-secondary-400">
      <thead className="border-b-2 border-secondary-400 bg-secondary-50">
        <tr>
          <th className="print:hidden" />
          <th className="max-w-52 px-1 py-1">Medicine</th>
          <th className="px-1 py-1">Dosage</th>
          <th className="px-1 py-1">Route</th>
          <th className="px-1 py-1">
            <p>Freq. or</p>
            <p>Indicator</p>
          </th>
          <th className="px-1 py-1">Notes</th>
        </tr>
      </thead>
      <tbody className="border-b-2 border-secondary-400">
        {items.map((item) => (
          <PrescriptionEntry key={item.id} obj={item} />
        ))}
      </tbody>
    </table>
  );
};

const PrescriptionEntry = ({ obj }: { obj: Prescription }) => {
  const { t } = useTranslation();
  const [checked, setChecked] = useState(true);

  const medicine = obj.medicine_object;

  return (
    <tr
      className={classNames(
        "cursor-pointer border-y border-y-secondary-400 text-center text-xs transition-all duration-200 ease-in-out even:bg-secondary-100 hover:bg-primary-100",
        !checked && "line-through opacity-50 print:hidden",
      )}
      onClick={() => setChecked((c) => !c)}
    >
      <td className="scale-90 pl-2 print:hidden">
        <CheckBoxFormField
          errorClassName="hidden"
          label=""
          value={checked}
          name="check_all"
          onChange={({ value }) => setChecked(value)}
        />
      </td>
      <td className="px-1 py-2 text-start text-sm">
        <p className="max-w-52">
          <strong className="uppercase">
            {medicine?.name ?? obj.medicine_old}
          </strong>{" "}
        </p>
        {medicine?.type === "brand" && (
          <span className="text-xs text-secondary-600">
            <p>
              Generic:{" "}
              <span className="capitalize text-secondary-800">
                {medicine.generic}
              </span>
            </p>
            <p>
              Brand:{" "}
              <span className="capitalize text-secondary-800">
                {medicine.company}
              </span>
            </p>
          </span>
        )}
      </td>
      <td className="px-1 py-1 text-center">
        {obj.dosage_type === "REGULAR" && obj.base_dosage}
        {obj.dosage_type === "PRN" && (
          <>
            {obj.base_dosage && <p>{obj.base_dosage}</p>}
            {obj.target_dosage && <p>target: {obj.target_dosage}</p>}
            {obj.max_dosage && <p>Max {obj.max_dosage} in 24hrs</p>}
            {obj.min_hours_between_doses && (
              <p>Min. {obj.min_hours_between_doses}hrs b/w doses</p>
            )}
          </>
        )}
      </td>
      <td className="max-w-20 break-words px-1 py-1">
        {obj.route && t(`PRESCRIPTION_ROUTE_${obj.route}`)}
      </td>
      <td className="px-1 py-1 text-xs">
        {obj.frequency && t(`PRESCRIPTION_FREQUENCY_${obj.frequency}`)}
        {obj.indicator}
      </td>
      <td className="w-32 break-words px-1 py-1">{obj.notes}</td>
    </tr>
  );
};
