import { PaginatedResponse } from "@/Utils/request/types";

interface PaginatedResponseRecord {
  id: string;
  verification_status?: string;
  status?: string;
}

export function isRecordEnteredInError<TItem extends PaginatedResponseRecord>(
  records: PaginatedResponse<TItem> | undefined,
  id: string,
): boolean {
  if (!records?.results) {
    return false;
  }
  return records.results
    .filter(
      (result) =>
        result.verification_status === "entered_in_error" ||
        result.status === "entered_in_error",
    )
    .map((result) => result.id)
    .includes(id);
}
