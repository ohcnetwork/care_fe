import type { ReactNode } from "react";
import { EventGeneric } from "./types";

interface IProps {
  event: EventGeneric;
}

/**
 * object - array, date
 */

const formatValue = (value: unknown, key?: string): ReactNode => {
  if (value === undefined || value === null) {
    return "N/A";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (trimmed === "") {
      return "Empty";
    }

    if (!isNaN(Number(trimmed))) {
      return trimmed;
    }

    if (new Date(trimmed).toString() !== "Invalid Date") {
      return new Date(trimmed).toLocaleString();
    }

    return trimmed;
  }

  if (typeof value === "object") {
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return `No ${key?.replace(/_/g, " ")}`;
      }

      return value.map((v) => formatValue(v, key)).join(", ");
    }

    if (value instanceof Date) {
      return value.toLocaleString();
    }

    if (Object.entries(value).length === 0) {
      return `No ${key?.replace(/_/g, " ")}`;
    }

    return Object.entries(value).map(([key, value]) => (
      <div className="flex flex-col items-center gap-2 md:flex-row">
        <span className="text-xs uppercase text-gray-700">
          {key.replace(/_/g, " ")}
        </span>
        <span className="text-sm font-semibold text-gray-700">
          {formatValue(value, key)}
        </span>
      </div>
    ));
  }

  return JSON.stringify(value);
};

export default function GenericEvent({ event }: IProps) {
  return (
    <div className="flex w-full flex-col gap-4 rounded-lg border border-gray-400 p-4 @container">
      {Object.entries(event.value).map(([key, value]) => (
        <div className="flex w-full flex-col items-center gap-2 md:flex-row">
          <span className="text-xs uppercase text-gray-700">
            {key.replace(/_/g, " ")}
          </span>
          <span className="break-all text-sm font-semibold text-gray-700">
            {formatValue(value, key)}
          </span>
        </div>
      ))}
    </div>
  );
}
