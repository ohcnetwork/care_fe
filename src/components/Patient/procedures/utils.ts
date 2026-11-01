import { format } from "date-fns";

import { ProcedureOccurrence } from "@/types/emr/procedure/procedure";

/** One line for whichever occurrence form was recorded; "" when none was. */
export function formatProcedureOccurrence(occurrence?: ProcedureOccurrence) {
  if (occurrence?.occurrence_string) return occurrence.occurrence_string;
  if (occurrence?.occurrence_datetime)
    return format(new Date(occurrence.occurrence_datetime), "dd MMM yyyy");
  const period = occurrence?.occurrence_period;
  if (period?.start || period?.end) {
    return [period.start, period.end]
      .map((value) => (value ? format(new Date(value), "dd MMM yyyy") : "…"))
      .join(" – ");
  }
  return "";
}
