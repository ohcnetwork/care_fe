import type { APIRequestContext } from "@playwright/test";
import { ResourceCategoryRead } from "src/types/base/resourceCategory/resourceCategory";
import { createAuthenticatedAPIContext } from "./utils/auth-context";

export interface FacilitySetup {
  facilityId: string;
  resourceCategory: ResourceCategoryRead;
}

export async function getFacilityAndCategory(): Promise<FacilitySetup> {
  const apiContext = await createAuthenticatedAPIContext();

  try {
    const facilityId = await getFirstFacility(apiContext);
    const resourceCategory = await getFirstResourceCategory(
      apiContext,
      facilityId,
      "activity_definition",
    );

    return { facilityId, resourceCategory };
  } finally {
    await apiContext.dispose();
  }
}

async function getFirstFacility(
  apiContext: APIRequestContext,
): Promise<string> {
  const response = await apiContext.get("/api/v1/facility/?limit=1");

  if (!response.ok()) {
    throw new Error(
      `Failed to fetch facilities: ${response.status()} ${await response.text()}`,
    );
  }

  const data = await response.json();
  if (data?.results?.[0]?.id) {
    return data.results[0].id;
  }

  throw new Error(
    "No facilities found. Ensure backend fixtures are up to date and seeded.",
  );
}

async function getFirstResourceCategory(
  apiContext: APIRequestContext,
  facilityId: string,
  resourceType: string,
): Promise<ResourceCategoryRead> {
  const response = await apiContext.get(
    `/api/v1/facility/${facilityId}/resource_category/?resource_type=${resourceType}&limit=1`,
  );

  if (!response.ok()) {
    throw new Error(
      `Failed to fetch resource categories: ${response.status()} ${await response.text()}`,
    );
  }

  const data = await response.json();
  if (data?.results?.[0]) {
    return data.results[0];
  }

  throw new Error(
    `No resource category of type '${resourceType}' found for facility ${facilityId}. Ensure backend fixtures are up to date and seeded.`,
  );
}
