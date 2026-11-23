import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { openMultiFilter } from "tests/helper/multiFilter";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { getFacilityId } from "tests/support/facilityId";

import type { FacilityRead } from "@/types/facility/facility";

test.use({ storageState: "tests/.auth/user.json" });

test("department filters restore only in the facility where they were selected", async ({
  page,
  request,
}) => {
  const facilityId = getFacilityId();
  const headers = getApiHeaders();
  const api = getApiUrl();
  const sourceResponse = await request.get(
    `${api}/api/v1/facility/${facilityId}/`,
    { headers },
  );
  expect(sourceResponse.ok()).toBe(true);
  const source = (await sourceResponse.json()) as FacilityRead;
  const stamp = faker.string.alphanumeric(8);
  const createdFacility = await request.post(`${api}/api/v1/facility/`, {
    headers,
    data: {
      name: `Filter scope ${stamp}`,
      description: "Filter regression",
      address: source.address,
      pincode: source.pincode,
      phone_number: source.phone_number,
      facility_type: source.facility_type,
      is_public: false,
      geo_organization: source.geo_organization.id,
      features: [],
    },
  });
  expect(createdFacility.ok(), await createdFacility.text()).toBe(true);
  const other = (await createdFacility.json()) as { id: string };
  const createdDepartment = await request.post(
    `${api}/api/v1/facility/${facilityId}/organizations/`,
    {
      headers,
      data: {
        name: `Scope department ${stamp}`,
        org_type: "dept",
        active: true,
      },
    },
  );
  expect(createdDepartment.ok(), await createdDepartment.text()).toBe(true);
  const department = (await createdDepartment.json()) as {
    id: string;
    name: string;
  };
  await page.goto(`/facility/${facilityId}/encounters/patients/all`);
  await openMultiFilter(page, /^Department$/);
  await page.getByPlaceholder("Search departments...").fill(department.name);
  await page
    .getByRole("menuitem", { name: department.name, exact: true })
    .click();
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(new RegExp(`organization=${department.id}`));
  const requestsInOtherFacility: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (
      url.pathname === "/api/v1/encounter/" &&
      url.searchParams.get("facility") === other.id
    )
      requestsInOtherFacility.push(url.searchParams.get("organization") ?? "");
  });
  await page.goto(`/facility/${other.id}/encounters/patients/all`);
  await expect(page.getByRole("button", { name: /^Filter$/ })).toBeVisible();
  await expect.poll(() => requestsInOtherFacility.length).toBeGreaterThan(0);
  expect(requestsInOtherFacility.every((value) => value === "")).toBe(true);
  await expect(page).not.toHaveURL(/organization=/);
  await page.goto(`/facility/${facilityId}/encounters/patients/all`);
  await expect(page).toHaveURL(new RegExp(`organization=${department.id}`));
});
