import React from "react";
import { formatDate, formatTime } from "../../../../Utils/utils";
import { classNames } from "../../../../Utils/utils";

interface SharedSectionTableProps {
  data: Record<string, any>;
  rows: Array<{ title?: string; field?: string; subField?: boolean }>;
  choices?: Record<string, Record<number | string, string>>;
  translateKey: string;
  t: (key: string) => string;
}

const SharedSectionTable: React.FC<SharedSectionTableProps> = ({
  data,
  rows,
  choices = {},
  translateKey,
  t,
}) => {
  return (
    <div className="m-2 w-full overflow-hidden overflow-x-auto rounded-lg border border-black shadow md:w-fit">
      <table className="border-collapse overflow-hidden rounded-lg border bg-secondary-100">
        <thead className="bg-white shadow">
          <tr>
            <th className="border-b-2 border-r-2 border-black" />
            {Object.keys(data).map((date) => (
              <th
                key={date}
                className="w-40 border border-b-2 border-secondary-500 border-b-black p-1 text-sm font-semibold"
              >
                <p>{formatDate(date)}</p>
                <p>{formatTime(date)}</p>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-secondary-200">
          {rows.map((row) => (
            <tr
              key={row.field ?? row.title}
              className={classNames(
                row.title && "border-t-2 border-t-secondary-600",
              )}
            >
              <td
                className={classNames(
                  "border border-r-2 border-secondary-500 border-r-black bg-white p-2",
                  row.subField ? "pl-4 font-medium" : "font-bold",
                )}
              >
                {row.title ?? t(`${translateKey}__${row.field}`)}
              </td>
              {Object.values(data).map((obj, idx) => (
                <td
                  key={`${row.field}-${idx}`}
                  className="border border-secondary-500 bg-secondary-100 p-2 text-center font-medium"
                >
                  {row.field
                    ? choices[row.field]
                      ? (choices[row.field][obj[row.field]] ?? "-")
                      : (obj[row.field] ?? "-")
                    : "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SharedSectionTable;
