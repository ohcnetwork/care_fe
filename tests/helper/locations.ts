import { faker } from "@faker-js/faker";
import { expect, type APIRequestContext } from "@playwright/test";

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
