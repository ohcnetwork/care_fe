import { getColorIndex, rowColor, transformData } from "./utils";

import ButtonV2 from "../../../Common/components/ButtonV2";
import { InvestigationResponse } from "./types";
import React from "react";
import { formatDate } from "../../../../Utils/utils";

const ReportRow = ({ data, name, min, max }: any) => {
  return (
    <tr className="bg-white even:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
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
            className={"text-center break-all"}
          >
            {d?.notes ||
              (d?.value &&
                Math.round((d.value + Number.EPSILON) * 100) / 100) ||
              "---"}
          </td>
        );
      })}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {min}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {max}
      </td>
    </tr>
  );
};

interface ReportTableProps {
  title?: string;
  patientDetails?: {
    name: string;
    age: number;
    hospitalName: string;
  };
  investigationData: InvestigationResponse;
  hidePrint?: boolean;
}

const ReportTable: React.FC<ReportTableProps> = ({
  title,
  investigationData,
  patientDetails,
  hidePrint = false,
}) => {
  const { data, sessions } = transformData(investigationData);

  return (
    <>
      {!hidePrint && (
        <div className="flex justify-end print:hidden m-2.5 pt-2.5">
          <ButtonV2 variant="primary" onClick={window.print}>
            Print Report
          </ButtonV2>
        </div>
      )}

      <div className=" p-4 my-4" id="section-to-print">
        {title && <h1 className="text-xl text-gray-800 font-bold">{title}</h1>}
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
          <span className="inline-block  bg-yellow-200 py-1 m-1 px-6 rounded-full text-yellow-900 font-medium">
            Below Ideal
          </span>

          <span className="inline-block  bg-primary-200 py-1 m-1 px-6 rounded-full text-primary-900 font-medium">
            Ideal
          </span>

          <span className="inline-block  bg-red-200 py-1 m-1 px-6 rounded-full text-red-900 font-medium">
            Above Ideal
          </span>
        </div>
        <br />
        <div className="shadow overflow-x-scroll border-b border-gray-200 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider"
                >
                  Name
                </th>
                {sessions.map((session) => (
                  <th
                    scope="col"
                    key={session.session_external_id}
                    className="px-6 py-3 text-center text-xs font-semibold text-[#F9FAFB] bg-[#4B5563]  uppercase tracking-wider"
                  >
                    {formatDate(session.session_created_date)}
                  </th>
                ))}
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider"
                >
                  Min
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider"
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
                <tr className="text-center text-gray-500">No tests taken</tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default ReportTable;
