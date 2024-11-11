import { EncounterSymptom } from "@/components/Symptoms/types";

import { Writable } from "@/Utils/types";
import { compareByDateString } from "@/Utils/utils";

// TODO: switch to using Object.groupBy(...) instead once upgraded to node v22
export const groupAndSortSymptoms = <
  T extends Writable<EncounterSymptom> | EncounterSymptom,
>(
  records: T[],
) => {
  const result: Record<EncounterSymptom["clinical_impression_status"], T[]> = {
    "entered-in-error": [],
    "in-progress": [],
    completed: [],
  };

  for (const record of records) {
    const status =
      record.clinical_impression_status ||
      (record.cure_date ? "completed" : "in-progress");
    result[status].push(record);
  }

  result["completed"] = sortByOnsetDate(result["completed"]);
  result["in-progress"] = sortByOnsetDate(result["in-progress"]);
  result["entered-in-error"] = sortByOnsetDate(result["entered-in-error"]);

  return result;
};

export const sortByOnsetDate = <
  T extends Writable<EncounterSymptom> | EncounterSymptom,
>(
  records: T[],
) => {
  return records.sort(compareByDateString("onset_date"));
};
