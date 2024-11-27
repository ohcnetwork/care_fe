export const preventDuplicatePatientsDuetoPolicyId = (data: any) => {
  // Generate a array which contains imforamation of duplicate patient IDs and there respective linenumbers
  const lines = data.split("\n"); // Split the data into individual lines
  const idsMap = new Map(); // To store indices of lines with the same patient ID

  lines.map((line: any, i: number) => {
    const patientId = line.split(",")[0]; // Extract the patient ID from each line
    if (idsMap.has(patientId)) {
      idsMap.get(patientId).push(i); // Add the index to the existing array
    } else {
      idsMap.set(patientId, [i]); // Create a new array with the current index
    }
  });

  const linesWithSameId = Array.from(idsMap.entries())
    .filter(([_, indices]) => indices.length > 1)
    .map(([patientId, indices]) => ({
      patientId,
      indexSame: indices,
    }));

  // after getting the array of duplicate patient IDs and there respective linenumbers we will merge the policy IDs of the duplicate patients

  linesWithSameId.map((lineInfo) => {
    const indexes = lineInfo.indexSame;
    //get policyid of all the duplicate patients and merge them by seperating them with a semicolon
    const mergedPolicyId = indexes
      .map((currentIndex: number) => lines[currentIndex].split(",")[5])
      .join(";");
    // replace the policy ID of the first patient with the merged policy ID
    const arrayOfCurrentLine = lines[indexes[0]].split(",");
    arrayOfCurrentLine[5] = mergedPolicyId;
    const lineAfterMerge = arrayOfCurrentLine.join(",");
    lines[indexes[0]] = `${lineAfterMerge}`;
  });

  // after merging the policy IDs of the duplicate patients we will remove the duplicate patients from the data
  const uniqueLines = [];
  const ids = new Set(); // To keep track of unique patient IDs

  for (const line of lines) {
    const patientId = line.split(",")[0]; // Extract the patient ID from each line
    if (!ids.has(patientId)) {
      uniqueLines.push(line);
      ids.add(patientId);
    }
  }

  const cleanedData = uniqueLines.join("\n"); // Join the unique lines back together
  return cleanedData;
};
