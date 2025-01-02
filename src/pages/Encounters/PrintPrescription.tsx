import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

import PrintPreview from "@/CAREUI/misc/PrintPreview";

import api from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { classNames, formatPatientAge } from "@/Utils/utils";
import { MedicationRequest } from "@/types/emr/medicationRequest";

export const PrintPrescription = (props: {
  facilityId: string;
  encounterId: string;
}) => {
  const { facilityId, encounterId } = props;
  const { t } = useTranslation();

  const { data: encounter } = useQuery({
    queryKey: ["encounter", encounterId],
    queryFn: query(api.encounter.get, {
      pathParams: { id: encounterId },
      queryParams: { facility: facilityId },
    }),
  });

  const { data: medications } = useQuery({
    queryKey: ["medications", encounter?.patient?.id],
    queryFn: query(api.medicationRequest.list, {
      pathParams: { patientId: encounter?.patient?.id || "" },
      queryParams: { encounter: encounterId },
    }),
    enabled: !!encounter?.patient?.id,
  });

  const normalMedications = medications?.results?.filter(
    (m) => !m.dosage_instruction[0]?.as_needed_boolean,
  );
  const prnMedications = medications?.results?.filter(
    (m) => m.dosage_instruction[0]?.as_needed_boolean,
  );

  if (!medications?.results?.length) {
    return <div className="p-4">No medications found for this encounter.</div>;
  }

  return (
    <PrintPreview
      title={
        encounter?.patient
          ? `Prescriptions - ${encounter.patient.name}`
          : "Print Prescriptions"
      }
      disabled={!(encounter?.patient && medications)}
    >
      <div className="mb-3 flex items-center justify-between p-4">
        <h3>{encounter?.facility?.name}</h3>
        <img
          className="h-10 w-auto"
          src={careConfig.mainLogo?.dark}
          alt="care logo"
        />
      </div>

      <div className="mb-6 grid grid-cols-8 gap-y-1.5 border-2 border-secondary-400 p-2">
        <PatientDetail name="Patient" className="col-span-5">
          {encounter?.patient && (
            <>
              <span className="uppercase">{encounter.patient.name}</span> -{" "}
              {t(`GENDER__${encounter.patient.gender}`)},{" "}
              {formatPatientAge(encounter.patient, true)}
            </>
          )}
        </PatientDetail>
        {encounter?.external_identifier && (
          <PatientDetail name="IP/OP No." className="col-span-3">
            {encounter?.external_identifier}
          </PatientDetail>
        )}

        <PatientDetail name="Encounter Date" className="col-span-5">
          {encounter?.period?.start &&
            format(new Date(encounter.period.start), "PPP")}
        </PatientDetail>
      </div>

      <PrescriptionsTable items={normalMedications} />
      <PrescriptionsTable items={prnMedications} prn />

      <div className="pt-12">
        <p className="pt-1 text-center text-xs font-medium text-secondary-700">
          This is a computer generated prescription. It shall be issued to the
          patient only after the concerned doctor has verified the content and
          authorized the same by affixing signature.
        </p>
      </div>
    </PrintPreview>
  );
};

const PatientDetail = ({
  name,
  children,
  className,
}: {
  name: string;
  children?: React.ReactNode;
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
  items?: MedicationRequest[];
  prn?: boolean;
}) => {
  if (!items) {
    return (
      <div className="h-96 w-full animate-pulse rounded-lg bg-secondary-200" />
    );
  }

  if (!items.length) {
    return null;
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
          <PrescriptionEntry key={item.id} medication={item} />
        ))}
      </tbody>
    </table>
  );
};

const PrescriptionEntry = ({
  medication,
}: {
  medication: MedicationRequest;
}) => {
  const instruction = medication.dosage_instruction[0];

  if (!instruction) return null;

  return (
    <tr className="border-y border-y-secondary-400 text-center text-xs transition-all duration-200 ease-in-out even:bg-secondary-100">
      <td className="max-w-52 px-2 py-2 text-start text-sm">
        <p>
          <strong className="uppercase">
            {medication.medication?.display}
          </strong>
        </p>
      </td>
      <td className="space-y-1 px-2 py-1 text-center">
        {instruction.dose_and_rate?.type === "calculated" ? (
          <>
            <p>Titrated</p>
            <p className="font-semibold">
              {instruction.dose_and_rate.dose_range?.low.value}{" "}
              {instruction.dose_and_rate.dose_range?.low.unit} →{" "}
              {instruction.dose_and_rate.dose_range?.high.value}{" "}
              {instruction.dose_and_rate.dose_range?.high.unit}
            </p>
          </>
        ) : (
          <p className="font-semibold">
            {instruction.dose_and_rate?.dose_quantity?.value}{" "}
            {instruction.dose_and_rate?.dose_quantity?.unit}
          </p>
        )}
        {instruction.max_dose_per_period && (
          <p>
            Max.{" "}
            <span className="font-semibold">
              {instruction.max_dose_per_period.high.value}{" "}
              {instruction.max_dose_per_period.high.unit}
            </span>{" "}
            in 24hrs
          </p>
        )}
        {instruction.text && (
          <p className="mt-1 text-xs text-muted-foreground">
            {instruction.text}
          </p>
        )}
      </td>
      <td className="max-w-32 whitespace-break-spaces px-2 py-1">
        {instruction.route && (
          <p>
            <span className="text-secondary-700">Route: </span>
            <span className="font-medium">{instruction.route.display}</span>
          </p>
        )}
        {instruction.method && (
          <p>
            <span className="text-secondary-700">Method: </span>
            <span className="font-medium">{instruction.method.display}</span>
          </p>
        )}
        {instruction.site && (
          <p>
            <span className="text-secondary-700">Site: </span>
            <span className="font-medium">{instruction.site.display}</span>
          </p>
        )}
        {instruction.timing?.repeat && (
          <p>
            <span className="text-secondary-700">Freq: </span>
            <span className="font-medium">
              {instruction.timing.repeat.frequency} time
              {instruction.timing.repeat.frequency !== 1 ? "s" : ""} per{" "}
              {instruction.timing.repeat.period}{" "}
              {instruction.timing.repeat.period_unit}
            </span>
          </p>
        )}
        {instruction.as_needed_boolean && (
          <p>
            <span className="text-secondary-700">PRN: </span>
            <span className="font-medium">
              {instruction.as_needed_for
                ? instruction.as_needed_for.display
                : "Yes"}
            </span>
          </p>
        )}
      </td>
      <td className="max-w-36 whitespace-break-spaces break-words px-2 py-1 text-left text-xs">
        {medication.note}
        {instruction.patient_instruction && (
          <p className="pt-1">
            <span className="text-secondary-700">Patient instructions:</span>{" "}
            {instruction.patient_instruction}
          </p>
        )}
        {instruction.additional_instruction?.map((instr, idx) => (
          <p key={idx} className="pt-1">
            <span className="text-secondary-700">Additional:</span>{" "}
            {instr.display}
          </p>
        ))}
      </td>
    </tr>
  );
};
