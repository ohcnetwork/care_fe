import React from "react";
import { formatDate, formatTime } from "../../../Utils/utils";
import { classNames } from "../../../Utils/utils";
import { useTranslation } from "react-i18next";

interface SharedSectionTableProps {
  data: Record<string, any>;
  rows: Array<{ title?: string; field?: string; subField?: boolean }>;
  choices?: Record<string, Record<number | string, string>>;
}

const LogUpdateAnalayseTable: React.FC<SharedSectionTableProps> = ({
  data,
  rows,
  choices = {},
}) => {
  const { t } = useTranslation();

  // Helper function to get the display value
  const getDisplayValue = (
    value: string | boolean | null | undefined,
    field?: string,
  ): string => {
    if (value == null) {
      return " ";
    }

    if (typeof value === "boolean") {
      return t(value ? "yes" : "no");
    }
    if (field && choices[field]) {
      const choice =
        choices[field][value as keyof (typeof choices)[typeof field]];
      return choice ? t(`${field.toUpperCase()}__${choice}`) : "-";
    }
    if (value && typeof value == "string") return value;

    return "-";
  };

  return (
    <div className="m-2 w-full overflow-hidden overflow-x-auto rounded-lg border border-black shadow md:w-fit">
      <table className="border-collapse rounded-lg border bg-secondary-100">
        <thead className="sticky top-0 bg-white shadow">
          <tr>
            <th className="sticky left-0 border-b-2 border-r-2 border-black bg-white"></th>
            {Object.keys(data).map((date) => (
              <>
                <th
                  key={date}
                  className="w-40 border border-b-2 border-secondary-500 border-b-black p-1 text-sm font-semibold"
                >
                  <p>{formatDate(date)}</p>
                  <p>{formatTime(date)}</p>
                </th>
              </>
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
              <th
                className={classNames(
                  "sticky left-0 border border-r-2 border-secondary-500 border-r-black bg-white p-2",
                  row.subField ? "pl-4 font-medium" : "font-bold",
                )}
              >
                {row.title ?? t(`LOG_UPDATE_FIELD_LABEL__${row.field!}`)}
              </th>
              {Object.values(data).map((obj, idx) => {
                const value = obj[row.field!];
                return (
                  <td
                    key={`${row.field}-${idx}`}
                    className="w-80 border border-l-2 border-secondary-500 bg-secondary-100 p-2 text-center font-medium"
                  >
                    {getDisplayValue(value, row.field)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LogUpdateAnalayseTable;
