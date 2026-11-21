import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

import { getApiHeaders, getApiUrl } from "tests/helper/utils";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Healthcare Service details - managing organization", () => {
  let facilityId: string;
  let serviceId: string;
  let serviceName: string;

  test.beforeAll(async ({ playwright }) => {
    facilityId = getFacilityId();
    serviceName = `Show ${faker.string.alphanumeric(8)}`;

    const request = await playwright.request.newContext();
    const response = await request.post(
      `${getApiUrl()}/api/v1/facility/${facilityId}/healthcare_service/`,
      {
        headers: getApiHeaders(),
        data: {
          name: serviceName,
          extra_details: "",
          styling_metadata: {},
          locations: [],
          managing_organization: null,
        },
      },
    );
    expect(response.ok(), await response.text()).toBeTruthy();
    serviceId = (await response.json()).id;
    await request.dispose();
  });

  const detailsUrl = () =>
    `/facility/${facilityId}/settings/healthcare_services/${serviceId}`;

  test("hides the managing organization section when none is set", async ({
    page,
  }) => {
    await page.goto(detailsUrl());

    await expect(page.getByText(serviceName).first()).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Managing Organization" }),
    ).toHaveCount(0);
  });

  test("shows the managing organization section once the service has loaded", async ({
    page,
  }) => {
    const organizationName = `Org ${faker.string.alphanumeric(6)}`;

    await page.route(
      `**/api/v1/facility/${facilityId}/healthcare_service/${serviceId}/`,
      async (route) => {
        if (route.request().method() !== "GET") return route.fallback();
        const response = await route.fetch();
        const body = await response.json();
        await route.fulfill({
          response,
          json: {
            ...body,
            managing_organization: {
              id: faker.string.uuid(),
              name: organizationName,
              description: "",
            },
          },
        });
      },
    );

    await page.goto(detailsUrl());

    await expect(
      page.getByRole("heading", { name: "Managing Organization" }),
    ).toBeVisible();
    await expect(page.getByText(organizationName)).toBeVisible();
  });
});
