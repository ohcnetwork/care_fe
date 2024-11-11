import careConfig from "@careConfig";
import { lazy } from "react";
import { useTranslation } from "react-i18next";

import PrintPreview from "@/CAREUI/misc/PrintPreview";

import { Investigation } from "@/components/Facility/Investigations/Reports/types";

import routes from "@/Utils/request/api";
import useQuery from "@/Utils/request/useQuery";

const Loading = lazy(() => import("@/components/Common/Loading"));

const InvestigationEntry = ({
  investigation,
}: {
  investigation: Investigation;
}) => {
  const { t } = useTranslation();
  return (
    <tr className="border-y border-y-secondary-400 text-center text-xs transition-all duration-200 ease-in-out even:bg-secondary-100">
      <td className="whitespace px-6 py-4 text-left">
        <p className="text-sm font-medium text-secondary-900">
          {investigation.investigation_object.name || "---"}
        </p>
        <p className="flex flex-row gap-x-2">
          <span>
            {t("investigations__range")}:{" "}
            {investigation.investigation_object.min_value || ""}
            {investigation.investigation_object.min_value ? " - " : ""}
            {investigation.investigation_object.max_value || ""}
          </span>
        </p>
        <p className="text-secondary-600">
          {t("investigations__unit")}:{" "}
          {investigation.investigation_object.unit || "---"}
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
        {t("investigations")}
      </caption>
      <thead className="border-b-2 border-secondary-400 bg-secondary-50 px-6 text-center">
        <tr>
          <th className="max-w-52 px-6 py-1 text-left">
            {t("investigations__name")}
          </th>
          <th className="p-1">{t("investigations__result")}</th>
          <th className="max-w-32 p-1"> {t("investigations__ideal_value")}</th>
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
      <InvestigationsPreviewTable investigations={investigations?.results} />
    </PrintPreview>
  );
}
