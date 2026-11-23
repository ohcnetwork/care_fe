import { faker } from "@faker-js/faker";
import {
  expect,
  request as playwrightRequest,
  type APIRequestContext,
} from "@playwright/test";

import { adminApiHeaders, apiBaseUrl } from "./questionnaireV2";

interface LocationFixture {
  id: string;
  name: string;
}

/** A mixed parent with one direct bed and a ward containing only a bed. */
export async function createLocationHierarchy(
  request: APIRequestContext,
  facilityId: string,
) {
  const facilityUrl = `${apiBaseUrl()}/api/v1/facility/${facilityId}`;
  const headers = adminApiHeaders();
  const organizations = await request.get(
    `${facilityUrl}/organizations/mine/`,
    {
      headers,
    },
  );
  expect(organizations.ok()).toBe(true);
  const { results } = (await organizations.json()) as {
    results: { id: string }[];
  };
  expect(
    results.length,
    "The admin needs a department for My Locations",
  ).toBeGreaterThan(0);

  async function create(
    name: string,
    form: "bu" | "wa" | "bd",
    parent?: string,
  ) {
    const response = await request.post(`${facilityUrl}/location/`, {
      headers,
      data: {
        name,
        form,
        mode: form === "bd" ? "instance" : "kind",
        parent,
        status: "active",
        operational_status: "U",
        description: "Location navigation regression",
        organizations: [],
      },
    });
    expect(response.ok(), await response.text()).toBe(true);
    return (await response.json()) as LocationFixture;
  }

  const name = `Location ${faker.string.alphanumeric(8)}`;
  const root = await create(name, "bu");
  const assignment = await request.post(
    `${facilityUrl}/location/${root.id}/organizations_add/`,
    { headers, data: { organization: results[0].id } },
  );
  expect(assignment.ok(), await assignment.text()).toBe(true);
  const ward = await create(`${name} Ward`, "wa", root.id);
  const rootBed = await create(`${name} Direct Bed`, "bd", root.id);
  const wardBed = await create(`${name} Ward Bed`, "bd", ward.id);
  return { root, ward, rootBed, wardBed };
}

/** Looks up a facility location (mode "kind") by its exact name through the API. */
export async function findLocationViaApi({
  facilityId,
  name,
}: {
  facilityId: string;
  name: string;
}): Promise<LocationFixture> {
  const request = await playwrightRequest.newContext();
  try {
    const locationsResponse = await request.get(
      `${apiBaseUrl()}/api/v1/facility/${facilityId}/location/?mode=kind&limit=100`,
      { headers: adminApiHeaders() },
    );
    expect(locationsResponse.ok()).toBe(true);
    const locations = (await locationsResponse.json()) as {
      results: LocationFixture[];
    };
    const location = locations.results.find(
      (location) => location.name === name,
    );
    expect(location, `The seeded facility must have a ${name}`).toBeDefined();
    return location!;
  } finally {
    await request.dispose();
  }
}

/** How a location takes part in inventory (Location settings "Inventory usage"). */
export type InventoryUsage = "none" | "consumption" | "store";

/** The location body the inventory location seeders send. */
export interface InventoryLocationPayload {
  name: string;
  description: string;
  status: string;
  operational_status: string;
  form: string;
  mode: string;
  organizations: string[];
  inventory_usage: InventoryUsage;
}

/** Creates a room location with the given inventory usage through the API. */
export async function createInventoryLocationViaApi({
  facilityId,
  inventoryUsage,
  name = `Inventory ${faker.string.alphanumeric(8)}`,
}: {
  facilityId: string;
  inventoryUsage: InventoryUsage;
  name?: string;
}): Promise<{ locationId: string; payload: InventoryLocationPayload }> {
  const payload: InventoryLocationPayload = {
    name,
    description: "",
    status: "active",
    operational_status: "O",
    form: "ro",
    mode: "kind",
    organizations: [],
    inventory_usage: inventoryUsage,
  };
  const request = await playwrightRequest.newContext();
  try {
    const created = await request.post(
      `${apiBaseUrl()}/api/v1/facility/${facilityId}/location/`,
      { headers: adminApiHeaders(), data: payload },
    );
    await expect(created).toBeOK();
    const { id } = (await created.json()) as { id: string };
    return { locationId: id, payload };
  } finally {
    await request.dispose();
  }
}

/** Changes the inventory usage of a location made by `createInventoryLocationViaApi`. */
export async function setLocationInventoryUsageViaApi({
  facilityId,
  locationId,
  payload,
  inventoryUsage,
}: {
  facilityId: string;
  locationId: string;
  payload: InventoryLocationPayload;
  inventoryUsage: InventoryUsage;
}): Promise<void> {
  const request = await playwrightRequest.newContext();
  try {
    const updated = await request.put(
      `${apiBaseUrl()}/api/v1/facility/${facilityId}/location/${locationId}/`,
      {
        headers: adminApiHeaders(),
        data: { ...payload, inventory_usage: inventoryUsage },
      },
    );
    await expect(updated).toBeOK();
  } finally {
    await request.dispose();
  }
}
