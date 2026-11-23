interface ClinicalCodeRecord {
  code: { code: string };
  verification_status: string;
}

/** Records entered in error do not count as duplicates. */
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
