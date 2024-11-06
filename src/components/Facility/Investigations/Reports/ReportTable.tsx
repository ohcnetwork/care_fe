import { FC } from "react";

import ButtonV2 from "@/components/Common/ButtonV2";
import { InvestigationResponse } from "@/components/Facility/Investigations/Reports/types";
import {
  getColorIndex,
  rowColor,
  transformData,
} from "@/components/Facility/Investigations/Reports/utils";

import { formatDateTime } from "@/Utils/utils";

const ReportRow = ({ data, name, min, max }: any) => {
  return (
    <tr className="bg-white even:bg-secondary-50">
      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-secondary-900">
        {name}
      </td>
      {data.map((d: any) => {
        const color = getColorIndex({
          min: d?.min,
          max: d?.max,
          value: d?.value,
        });

        return (
          <td
            key={d?.value}
            style={{
              ...(color >= 0
                ? {
                    backgroundColor: rowColor[color]?.color || "white",
                    color: rowColor[color]?.text || "black",
                  }
                : {}),
            }}
            className={"break-all text-center"}
          >
            {d?.notes ||
              (d?.value &&
                Math.round((d.value + Number.EPSILON) * 100) / 100) ||
              "---"}
          </td>
        );
      })}
      <td className="whitespace-nowrap px-6 py-4 text-sm text-secondary-700">
        {min}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-secondary-700">
        {max}
      </td>
    </tr>
  );
};

interface ReportTableProps {
  title?: string;
  patientDetails?: {
    name: string;
    age: string;
    hospitalName: string;
  };
  investigationData: InvestigationResponse;
  hidePrint?: boolean;
}

const ReportTable: FC<ReportTableProps> = ({
  title,
  investigationData,
  patientDetails,
  hidePrint = false,
}) => {
  const { data, sessions } = transformData(investigationData);

  return (
    <>
      {!hidePrint && (
        <div className="m-2.5 flex justify-end pt-2.5 print:hidden">
          <ButtonV2 variant="primary" onClick={window.print}>
            Print Report
          </ButtonV2>
        </div>
      )}

      <div className="my-4 p-4" id="section-to-print">
        {title && (
          <h1 className="text-xl font-bold text-secondary-800">{title}</h1>
        )}
        <br />
        {patientDetails && (
          <div className="flex flex-col gap-1 p-1">
            <p>Name: {patientDetails.name}</p>
            <p>Age: {patientDetails.age}</p>
            <p>Hospital: {patientDetails.hospitalName}</p>
          </div>
        )}
        <br />
        <div className="my-4">
          <span className="m-1 inline-block rounded-full bg-yellow-200 px-6 py-1 font-medium text-yellow-900">
            Below Ideal
          </span>

          <span className="m-1 inline-block rounded-full bg-primary-200 px-6 py-1 font-medium text-primary-900">
            Ideal
          </span>

          <span className="m-1 inline-block rounded-full bg-red-200 px-6 py-1 font-medium text-red-900">
            Above Ideal
          </span>
        </div>
        <br />
        <div className="overflow-x-scroll border-b border-secondary-200 shadow sm:rounded-lg">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary-800"
                >
                  Name
                </th>
                {sessions.map((session: any) => (
                  <th
                    scope="col"
                    key={session.session_external_id}
                    className="bg-[#4B5563] px-6 py-3 text-center text-xs font-semibold tracking-wider text-[#F9FAFB]"
                  >
                    <div className="flex flex-col items-center justify-center gap-1">
                      {formatDateTime(session.session_created_date)}
                      <a
                        className="max-w-fit font-semibold text-white hover:underline"
                        href={`/facility/${session.facility_id}/`}
                      >
                        {session.facility_name}
                      </a>
                    </div>
                  </th>
                ))}
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary-800"
                >
                  Min
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary-800"
                >
                  Max
                </th>
              </tr>
            </thead>
            <tbody x-max="2">
              {data.length > 0 ? (
                data.map((t: any) => {
                  return (
                    <ReportRow
                      data={t.sessionValues}
                      key={t.id}
                      min={t.investigation_object.min_value}
                      max={t.investigation_object.max_value}
                      name={t.investigation_object.name}
                    />
                  );
                })
              ) : (
                <tr className="text-center text-secondary-500">
                  No tests taken
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default ReportTable;
