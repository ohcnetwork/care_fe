import _ from "lodash-es";
import { lazy, ReactNode } from "react";
import routes from "../../../Redux/api";
import useQuery from "../../../Utils/request/useQuery";
import PrintPreview from "../../../CAREUI/misc/PrintPreview";
import { useTranslation } from "react-i18next";
const Loading = lazy(() => import("../../Common/Loading"));
import {
  classNames,
  formatDate,
  patientAgeInYears,
} from "../../../Utils/utils";
import { Investigation } from "./Reports/types";
import careConfig from "@careConfig";

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

const InvestigationEntry = ({
  investigation,
}: {
  investigation: Investigation;
}) => {
  return (
    <tr className="border-y border-y-secondary-400 text-center text-xs transition-all duration-200 ease-in-out even:bg-secondary-100">
      <td className="whitespace px-6 py-4 text-left">
        <p className="text-sm font-medium text-secondary-900">
          {investigation.investigation_object.name || "---"}
        </p>
        <p className="flex flex-row gap-x-2">
          <span>
            Min: {investigation.investigation_object.min_value || "---"}
          </span>
          <span>
            {" "}
            Max: {investigation.investigation_object.max_value || "---"}
          </span>
        </p>
        <p className="text-secondary-600">
          Units: {investigation.investigation_object.unit || "---"}
        </p>
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-xs text-secondary-700">
        {investigation.value || "---"}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-xs text-secondary-700">
        {investigation.investigation_object.ideal_value || "---"}
      </td>
    </tr>
  );
};

const InvestigationsPreviewTable = ({
  investigations,
}: {
  investigations?: Investigation[];
}) => {
  const { t } = useTranslation();
  if (!investigations) {
    return (
      <tr className="text-center text-secondary-500 print:text-black">
        <td className="col-span-6">{t("no_tests_taken")}</td>
      </tr>
    );
  }

  return (
    <table className="mb-8 mt-4 w-full border-collapse border-2 border-secondary-400">
      <caption className="mb-2 caption-top text-lg font-bold">
        Investigations
      </caption>
      <thead className="border-b-2 border-secondary-400 bg-secondary-50 px-6 text-center">
        <tr>
          <th className="max-w-52 px-6 py-1 text-left">Name</th>
          <th className="p-1">Value</th>
          <th className="max-w-32 p-1">Ideal</th>
        </tr>
      </thead>
      <tbody className="border-b-2 border-secondary-400">
        {investigations.map((item) => (
          <InvestigationEntry key={item.id} investigation={item} />
        ))}
      </tbody>
    </table>
  );
};

interface InvestigationPrintPreviewProps {
  consultationId: string;
  patientId: string;
  sessionId: string;
  facilityId: string;
}
export default function InvestigationPrintPreview(
  props: InvestigationPrintPreviewProps,
) {
  const { consultationId, patientId, sessionId } = props;
  const { t } = useTranslation();
  const { loading: investigationLoading, data: investigations } = useQuery(
    routes.getInvestigation,
    {
      pathParams: {
        consultation_external_id: consultationId,
      },
      query: {
        session: sessionId,
      },
    },
  );

  const { data: patient, loading: patientLoading } = useQuery(
    routes.getPatient,
    {
      pathParams: { id: patientId },
    },
  );

  const { data: consultation } = useQuery(routes.getConsultation, {
    pathParams: { id: consultationId },
    prefetch: !!consultationId,
  });

  if (patientLoading || investigationLoading) {
    return <Loading />;
  }
  return (
    <PrintPreview
      title={t("investigation_report_for_{{name}}", {
        name: patient?.name,
      })}
    >
      <div className="mb-3 flex items-center justify-between p-4">
        <h3>{consultation?.facility_name}</h3>
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
          {consultation?.patient_no}
        </PatientDetail>

        <PatientDetail
          name={
            consultation
              ? `${t(`encounter_suggestion__${consultation.suggestion}`)} on`
              : ""
          }
          className="col-span-5"
        >
          {formatDate(consultation?.encounter_date)}
        </PatientDetail>
        <PatientDetail name="Bed" className="col-span-3">
          {consultation?.current_bed?.bed_object.location_object?.name}
          {" - "}
          {consultation?.current_bed?.bed_object.name}
        </PatientDetail>

        <PatientDetail name="Allergy to medication" className="col-span-8">
          {patient?.allergies ?? "None"}
        </PatientDetail>
      </div>
      <InvestigationsPreviewTable investigations={investigations?.results} />
    </PrintPreview>
  );
}
