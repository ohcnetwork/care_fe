import type { APIRequestContext } from "@playwright/test";
import { ResourceCategoryRead } from "src/types/base/resourceCategory/resourceCategory";
import type { FacilityRead } from "src/types/facility/facility";
import { createAuthenticatedAPIContext } from "./utils/auth-context";

export interface FacilitySetup {
  facility: FacilityRead;
  resourceCategory: ResourceCategoryRead;
}

export async function getFacilityAndCategory(
  resourceType: string,
): Promise<FacilitySetup> {
  const apiContext = await createAuthenticatedAPIContext();

  try {
    const facility = await getLastFacility(apiContext);
    const resourceCategory = await getLastResourceCategory(
      apiContext,
      facility.id,
      resourceType,
    );

    return { facility, resourceCategory };
  } finally {
    await apiContext.dispose();
  }
}

async function getLastFacility(
  apiContext: APIRequestContext,
): Promise<FacilityRead> {
  const response = await apiContext.get("/api/v1/facility/?limit=1");

  if (!response.ok()) {
    throw new Error(
      `Failed to fetch facilities: ${response.status()} ${await response.text()}`,
    );
  }

  const data = await response.json();
  const last = data?.results?.at?.(-1);
  if (last) {
    return last;
  }

  throw new Error(
    "No facilities found. Ensure backend fixtures are up to date and seeded.",
  );
}

async function getLastResourceCategory(
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
  const last = data?.results?.at?.(-1);
  if (last) {
    return last;
  }

  throw new Error(
    `No resource category of type '${resourceType}' found for facility ${facilityId}. Ensure backend fixtures are up to date and seeded.`,
  );
}
