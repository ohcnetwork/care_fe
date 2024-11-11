import careConfig from "@careConfig";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import PrintPreview from "@/CAREUI/misc/PrintPreview";

import { Prescription } from "@/components/Medicine/models";
import MedicineRoutes from "@/components/Medicine/routes";

import { useSlugs } from "@/hooks/useSlug";

import routes from "@/Utils/request/api";
import useQuery from "@/Utils/request/useQuery";
import {
  classNames,
  formatDate,
  formatDateTime,
  formatName,
  patientAgeInYears,
} from "@/Utils/utils";

export default function PrescriptionsPrintPreview() {
  const { t } = useTranslation();
  const [patientId, consultationId] = useSlugs("patient", "consultation");

  const patientQuery = useQuery(routes.getPatient, {
    pathParams: { id: patientId },
  });

  const encounterQuery = useQuery(routes.getConsultation, {
    pathParams: { id: consultationId },
  });

  const prescriptionsQuery = useQuery(MedicineRoutes.listPrescriptions, {
    pathParams: { consultation: consultationId },
    query: { discontinued: false, limit: 100 },
  });

  const patient = patientQuery.data;
  const encounter = encounterQuery.data;

  const items = prescriptionsQuery.data?.results;
  const normalPrescriptions = items?.filter((p) => p.dosage_type !== "PRN");
  const prnPrescriptions = items?.filter((p) => p.dosage_type === "PRN");

  return (
    <PrintPreview
      title={
        patient ? `Prescriptions - ${patient.name}` : "Print Prescriptions"
      }
      disabled={!(patient && encounter && items)}
    >
      <div className="mb-3 flex items-center justify-between p-4">
        <h3>{encounter?.facility_name}</h3>
        <img
          className="h-10 w-auto"
          src={careConfig.mainLogo?.dark}
          alt="care logo"
        />
      </div>
      <div className="mb-6 grid grid-cols-8 gap-y-1.5 border-2 border-secondary-400 p-2">
        <PatientDetail name="Patient" className="col-span-5">
          {patient && (
            <>
              <span className="uppercase">{patient.name}</span> -{" "}
              {t(`GENDER__${patient.gender}`)},{" "}
              {patientAgeInYears(patient).toString()}yrs
            </>
          )}
        </PatientDetail>
        <PatientDetail name="IP/OP No." className="col-span-3">
          {encounter?.patient_no}
        </PatientDetail>

        <PatientDetail
          name={
            encounter
              ? `${t(`encounter_suggestion__${encounter.suggestion}`)} on`
              : ""
          }
          className="col-span-5"
        >
          {formatDate(encounter?.encounter_date)}
        </PatientDetail>
        <PatientDetail name="Bed" className="col-span-3">
          {encounter?.current_bed?.bed_object.location_object?.name}
          {" - "}
          {encounter?.current_bed?.bed_object.name}
        </PatientDetail>

        <PatientDetail name="Allergy to medication" className="col-span-8">
          {patient?.allergies ?? "None"}
        </PatientDetail>
      </div>

      <PrescriptionsTable items={normalPrescriptions} />
      <PrescriptionsTable items={prnPrescriptions} prn />

      <div className="pt-12">
        <p className="font-medium text-secondary-800">
          Sign of the Consulting Doctor
        </p>
        <PatientDetail name="Name of the Consulting Doctor">
          {encounter?.treating_physician_object &&
            formatName(encounter?.treating_physician_object)}
        </PatientDetail>
        <p className="pt-6 text-center text-xs font-medium text-secondary-700">
          Generated on: {formatDateTime(new Date())}
        </p>
        <p className="pt-1 text-center text-xs font-medium text-secondary-700">
          This is a computer generated prescription. It shall be issued to the
          patient only after the concerned doctor has verified the content and
          authorized the same by affixing signature.
        </p>
      </div>
    </PrintPreview>
  );
}

const PatientDetail = ({
  name,
  children,
  className,
}: {
  name: string;
  children?: ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={classNames(
        "inline-flex items-center whitespace-nowrap text-sm tracking-wide",
        className,
      )}
    >
      <div className="font-medium text-secondary-800">{name}: </div>
      {children != null ? (
        <span className="pl-2 font-bold">{children}</span>
      ) : (
        <div className="h-5 w-48 animate-pulse bg-secondary-200" />
      )}
    </div>
  );
};

const PrescriptionsTable = ({
  items,
  prn,
}: {
  items?: Prescription[];
  prn?: boolean;
}) => {
  if (!items) {
    return (
      <div className="h-96 w-full animate-pulse rounded-lg bg-secondary-200" />
    );
  }

  if (!items.length) {
    return;
  }

  return (
    <table className="mb-8 mt-4 w-full border-collapse border-2 border-secondary-400">
      <caption className="mb-2 caption-top text-lg font-bold">
        {prn && "PRN"} Prescriptions
      </caption>
      <thead className="border-b-2 border-secondary-400 bg-secondary-50">
        <tr>
          <th className="max-w-52 p-1">Medicine</th>
          <th className="p-1">Dosage</th>
          <th className="p-1">Directions</th>
          <th className="max-w-32 p-1">Notes / Instructions</th>
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
  const medicine = obj.medicine_object;

  return (
    <tr className="border-y border-y-secondary-400 text-center text-xs transition-all duration-200 ease-in-out even:bg-secondary-100">
      <td className="max-w-52 px-2 py-2 text-start text-sm">
        <p>
          <strong className="uppercase">
            {medicine?.name ?? obj.medicine_old}
          </strong>{" "}
        </p>
        {medicine?.type === "brand" && (
          <span className="text-xs text-secondary-600">
            <p>
              Generic:{" "}
              <span className="capitalize text-secondary-800">
                {medicine.generic ?? "--"}
              </span>
            </p>
            <p>
              Brand:{" "}
              <span className="capitalize text-secondary-800">
                {medicine.company ?? "--"}
              </span>
            </p>
          </span>
        )}
      </td>
      <td className="space-y-1 px-2 py-1 text-center">
        {obj.dosage_type === "TITRATED" && <p>Titrated</p>}
        <p className="font-semibold">
          {obj.base_dosage}{" "}
          {obj.target_dosage != null && `→ ${obj.target_dosage}`}{" "}
        </p>
        {obj.max_dosage && (
          <p>
            Max. <span className="font-semibold">{obj.max_dosage}</span> in
            24hrs
          </p>
        )}
        {obj.min_hours_between_doses && (
          <p>
            Min.{" "}
            <span className="font-semibold">
              {obj.min_hours_between_doses}hrs
            </span>{" "}
            b/w doses
          </p>
        )}
      </td>
      <td className="max-w-32 whitespace-break-spaces px-2 py-1">
        {obj.route && (
          <p>
            <span className="text-secondary-700">Route: </span>
            <span className="font-medium">
              {t(`PRESCRIPTION_ROUTE_${obj.route}`)}
            </span>
          </p>
        )}
        {obj.frequency && (
          <p>
            <span className="text-secondary-700">Freq: </span>
            <span className="font-medium">
              {t(`PRESCRIPTION_FREQUENCY_${obj.frequency}`)}
            </span>
          </p>
        )}
        {obj.days && (
          <p>
            <span className="text-secondary-700">Days: </span>
            <span className="font-medium">{obj.days} day(s)</span>
          </p>
        )}
        {obj.indicator && (
          <p>
            <span className="text-secondary-700">Indicator: </span>
            <span className="font-medium">{obj.indicator}</span>
          </p>
        )}
      </td>
      <td className="max-w-36 whitespace-break-spaces break-words px-2 py-1 text-left text-xs">
        {obj.notes}
        {obj.instruction_on_titration && (
          <p className="pt-1">
            <span className="text-secondary-700">Titration instructions:</span>{" "}
            {obj.instruction_on_titration}
          </p>
        )}
      </td>
    </tr>
  );
};
