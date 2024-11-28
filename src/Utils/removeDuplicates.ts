export const preventDuplicatePatientsDuetoPolicyId = (data: string): string => {
  if (!data || typeof data !== "string") {
    throw new Error("Input must be a non-empty string");
  }
  // Generate a array which contains imforamation of duplicate patient IDs and there respective linenumbers
  const lines = data.split("\n"); // Split the data into individual lines
  const idsMap = new Map(); // To store indices of lines with the same patient ID
  interface DuplicateInfo {
    patientId: string;
    indexSame: number[];
  }

  const CSV_COLUMNS = {
    PATIENT_ID: 0,
    POLICY_ID: 5,
  } as const;

  lines.map((line: any, i: number) => {
    const patientId = line.split(",")[0]; // Extract the patient ID from each line
    if (idsMap.has(patientId)) {
      idsMap.get(patientId).push(i); // Add the index to the existing array
    } else {
      idsMap.set(patientId, [i]); // Create a new array with the current index
    }
  });

  const linesWithSameId: DuplicateInfo[] = Array.from(idsMap.entries())
    .filter(([, indices]) => indices.length > 1)
    .map(([patientId, indices]) => ({
      patientId,
      indexSame: indices,
    }));

  // after getting the array of duplicate patient IDs and there respective linenumbers we will merge the policy IDs of the duplicate patients

  linesWithSameId.forEach((lineInfo) => {
    const indexes = lineInfo.indexSame;
    if (!indexes.length) return;
    //get policyid of all the duplicate patients and merge them by seperating them with a semicolon
    const mergedPolicyId = indexes
      .map((currentIndex: number) => {
        const columns = lines[currentIndex].split(",");
        const policyId = columns[CSV_COLUMNS.POLICY_ID];
        return policyId?.trim() || "";
      })
      .filter(Boolean)
      .join(";");
    // replace the policy ID of the first patient with the merged policy ID
    const arrayOfCurrentLine = lines[indexes[0]].split(",");
    arrayOfCurrentLine[5] = mergedPolicyId;
    const lineAfterMerge = arrayOfCurrentLine.join(",");
    lines[indexes[0]] = `${lineAfterMerge}`;
  });

  // after merging the policy IDs of the duplicate patients we will remove the duplicate patients from the data

  const cleanedData = Array.from(
    lines
      .reduce((map, line) => {
        const patientId = line.split(",")[CSV_COLUMNS.PATIENT_ID];
        if (!map.has(patientId)) {
          map.set(patientId, line);
        }
        return map;
      }, new Map())
      .values(),
  ).join("\n"); // Join the unique lines back together
  return cleanedData;
};
