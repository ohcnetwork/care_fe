import { createAuthenticatedAPIContext } from "@/tests/utils/auth-context";
import fs from "fs";
import path from "path";
import {
  ResourceCategoryRead,
  ResourceCategoryResourceType,
  ResourceCategorySubType,
} from "src/types/base/resourceCategory/resourceCategory";
import type { FacilityRead } from "src/types/facility/facility";

export interface FacilitySetup {
  facility: FacilityRead;
  resourceCategory: ResourceCategoryRead;
}

/**
 * Loads facility data from the cache created by facility.setup.ts
 * This should be called in tests after the setup project has run
 */
export function loadFacility(): FacilityRead {
  const cacheFile = path.join(__dirname, "../.cache/facility.json");

  if (!fs.existsSync(cacheFile)) {
    throw new Error(
      "Facility cache not found. Ensure the setup project has run.",
    );
  }

  const data = fs.readFileSync(cacheFile, "utf-8");
  return JSON.parse(data);
}

/**
 * Fetches a resource category for a given facility and resource type
 * @param facilityId - The facility ID
 * @param resourceType - The type of resource category to fetch
 * @returns The resource category
 */
export async function getResourceCategory(
  facilityId: string,
  resourceType: string,
): Promise<ResourceCategoryRead> {
  const apiContext = await createAuthenticatedAPIContext();

  try {
    const response = await apiContext.get(
      `/api/v1/facility/${facilityId}/resource_category/?resource_type=${resourceType}&ordering=-id`,
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
  } finally {
    await apiContext.dispose();
  }
}

/**
 * Creates a new resource category via API
 * @param facilityId - The facility ID
 * @param data - Category data to create
 * @returns The created resource category
 */
export async function createResourceCategory(
  facilityId: string,
  data: {
    name: string;
    description?: string;
    resourceType: ResourceCategoryResourceType;
    resourceSubType?: ResourceCategorySubType;
    parent?: string;
  },
): Promise<ResourceCategoryRead> {
  const apiContext = await createAuthenticatedAPIContext();

  try {
    const response = await apiContext.post(
      `/api/v1/facility/${facilityId}/resource_category/`,
      {
        data: {
          title: data.name,
          slug_value: `${data.name.toLowerCase().replace(/ /g, "-").slice(0, 25)}`,
          description: data.description || "",
          resource_type: data.resourceType,
          resource_sub_type:
            data.resourceSubType || ResourceCategorySubType.other,
          parent: data.parent,
        },
      },
    );

    if (!response.ok()) {
      throw new Error(
        `Failed to create category: ${response.status()} ${await response.text()}`,
      );
    }

    return await response.json();
  } finally {
    await apiContext.dispose();
  }
}
