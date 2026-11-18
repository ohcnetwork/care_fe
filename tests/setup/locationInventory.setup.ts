import { expect, test } from "@playwright/test";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

// Kept independent of src types: the setup states the API contract it relies on.
type InventoryUsage = "none" | "store" | "consumption";

interface LocationRead {
  id: string;
  name: string;
  description: string;
  status: string;
  operational_status: string;
  form: string;
  mode: string;
  inventory_usage: InventoryUsage;
  location_type?: { code?: string };
  sort_index: number;
}

/**
 * Fixture locations come with `inventory_usage: "none"`, which hides their
 * inventory navigation, blocks External Supply (Store only) and drops them from
 * internal order/delivery location pickers. Give the locations used by the
 * inventory specs the usage those flows expect.
 */
const LOCATION_INVENTORY_USAGE: Record<string, InventoryUsage> = {
  Pharmacy: "store",
  "Bio-Chemistry Lab": "consumption",
};

test("set inventory usage on inventory fixture locations", async ({
  request,
}) => {
  const facilityId = getFacilityId();
  const headers = getApiHeaders();
  const locationUrl = `${getApiUrl()}/api/v1/facility/${facilityId}/location/`;

  const response = await request.get(`${locationUrl}?mode=kind&limit=100`, {
    headers,
  });
  await expect(response).toBeOK();
  const { results } = (await response.json()) as { results: LocationRead[] };

  for (const [name, inventoryUsage] of Object.entries(
    LOCATION_INVENTORY_USAGE,
  )) {
    const location = results.find((l) => l.name === name);
    if (!location) throw new Error(`Fixture location "${name}" not found`);
    if (location.inventory_usage === inventoryUsage) continue;

    // Location updates leave organizations and parent untouched, so only the
    // location's own fields are sent.
    const updated = await request.put(`${locationUrl}${location.id}/`, {
      headers,
      data: {
        name: location.name,
        description: location.description,
        status: location.status,
        operational_status: location.operational_status,
        form: location.form,
        mode: location.mode,
        // An unset location_type is read back as `{}`, which is not a valid write
        ...(location.location_type?.code
          ? { location_type: location.location_type }
          : {}),
        sort_index: location.sort_index,
        inventory_usage: inventoryUsage,
      },
    });
    await expect(updated, `updating "${name}"`).toBeOK();
    expect((await updated.json()).inventory_usage).toBe(inventoryUsage);
  }
});
