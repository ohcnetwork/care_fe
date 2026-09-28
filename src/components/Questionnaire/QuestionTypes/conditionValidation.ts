interface ClinicalCodeRecord {
  code: { code: string };
  verification_status: string;
}

/** Matches the diagnosis and symptom pickers: records entered in error
 *  do not prevent recording the same code again. */
export function hasDuplicateClinicalCode(
  records: readonly ClinicalCodeRecord[],
  code: string,
): boolean {
  return records.some(
    (record) =>
      record.code.code === code &&
      record.verification_status !== "entered_in_error",
  );
}
