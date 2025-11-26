import {
  fetchCsvFromGoogleSheet,
  transformCsvToObjects,
} from "sudheendra-scripts/utils";

const getConfig = () => {
  const facilityIds = process.env.FACILITY_IDS?.split(",") || [];
  if (facilityIds.length === 0) {
    throw new Error("FACILITY_IDS is not set");
  }

  const googleSheetId = process.env.PRODUCT_KNOWLEDGE_GOOGLE_SHEET_ID!;
  if (!googleSheetId) {
    throw new Error("PRODUCT_KNOWLEDGE_GOOGLE_SHEET_ID is not set");
  }

  const sheetName = process.env.PRODUCT_KNOWLEDGE_SHEET_NAME!;
  if (!sheetName) {
    throw new Error("PRODUCT_KNOWLEDGE_SHEET_NAME is not set");
  }

  return { facilityIds, googleSheetId, sheetName };
};

const headerMap = {
  resourceCategory: 0,

  //product knowledge
  slug: 1,
  name: 2,
  baseUnitDisplay: 3,
  // status: 4,
  alternateIdentifier: 5,
  alternateNameType: 6,
  alternateNameValue: 7,
};

async function main() {
  const { facilityIds, googleSheetId, sheetName } = getConfig();
  const csvData = await fetchCsvFromGoogleSheet(googleSheetId, sheetName);
  const datapoints = transformCsvToObjects(csvData, headerMap);

  const resourceCategories = [
    ...new Set(datapoints.map((dp) => dp.resourceCategory)),
  ];

  for (const facilityId of facilityIds) {
    const categoryMap = await ensureResourceCategories(
      facilityId,
      resourceCategories,
    );
  }
}

main();

async function ensureResourceCategories(
  facilityId: string,
  resourceCategories: string[],
) {
  const categoryMap = await request<ResourceCategoryRead>(
    `/api/v1/facility/${facilityId}/resource_category/`,
    "GET",
  );
  return categoryMap;
}
