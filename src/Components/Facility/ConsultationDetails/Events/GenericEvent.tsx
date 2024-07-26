import type { ReactNode } from "react";
import consultationMessage from "../../../../../src/Locale/en/Consultation.json";
interface IProps {
  values: Record<string, unknown>;
}

type ConsultationMessageKeys = keyof typeof consultationMessage;
/**
 * object - array, date
 */
const formatValue = (value: unknown, key?: string): ReactNode => {
  if (value == null) {
    return "N/A";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "number") {
    return value % 1 ? value.toFixed(2) : value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim().replaceAll(/_/g, " ");

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
        return `No ${key?.replaceAll(/_/g, " ")}`;
      }

      return (
        <ul className="list-disc space-y-2 pl-4">
          {value.map((v) => (
            <li>{formatValue(v, key)}</li>
          ))}
        </ul>
      );
    }

    if (value instanceof Date) {
      return value.toLocaleString();
    }

    const entries = Object.entries(value).filter(
      ([_, value]) => value != null && value !== "",
    );

    if (entries.length === 0) {
      return `No ${key?.replaceAll(/_/g, " ")}`;
    }

    return entries.map(([key, value]) => (
      <div className="flex flex-col items-center gap-2 md:flex-row">
        <span className="text-xs uppercase text-secondary-700">
          {key.replaceAll(/_/g, " ")}
        </span>
        <span className="text-sm font-semibold capitalize text-secondary-700">
          {formatValue(value, key)}
        </span>
      </div>
    ));
  }

  return JSON.stringify(value);
};

export default function GenericEvent(props: IProps) {
  return (
    <div className="flex w-full flex-col gap-4 rounded-lg border border-secondary-400 p-4 @container">
      {Object.entries(props.values).map(([key, value]) => (
        <div className="flex w-full flex-col items-start gap-2">
          {(key as ConsultationMessageKeys) in consultationMessage ? (
            <span className="text-xs text-secondary-700">
              {consultationMessage[key as ConsultationMessageKeys]}
            </span>
          ) : (
            <span className="text-xs capitalize text-secondary-700">
              {key.replaceAll(/_/g, " ")}
            </span>
          )}
          <span className="break-all text-sm font-semibold text-secondary-700">
            {formatValue(value, key)}
          </span>
        </div>
      ))}
    </div>
  );
}
