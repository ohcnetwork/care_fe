import { faker } from "@faker-js/faker";
import { APIRequestContext, expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

import { getApiHeaders, getApiUrl } from "tests/helper/utils";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Healthcare Service details - managing organization", () => {
  let facilityId: string;
  let serviceWithoutOrg: { id: string; name: string };
  let serviceWithOrg: { id: string; name: string };
  let organizationName: string;

  async function createService(
    request: APIRequestContext,
    managingOrganization: string | null,
  ) {
    const name = `Show ${faker.string.alphanumeric(8)}`;
    const response = await request.post(
      `${getApiUrl()}/api/v1/facility/${facilityId}/healthcare_service/`,
      {
        headers: getApiHeaders(),
        data: {
          name,
          extra_details: "",
          styling_metadata: {},
          locations: [],
          managing_organization: managingOrganization,
        },
      },
    );
    expect(response.ok(), await response.text()).toBeTruthy();
    return { id: (await response.json()).id as string, name };
  }

  test.beforeAll(async ({ playwright }) => {
    facilityId = getFacilityId();
    organizationName = `Org ${faker.string.alphanumeric(6)}`;

    const request = await playwright.request.newContext();
    const organizationResponse = await request.post(
      `${getApiUrl()}/api/v1/facility/${facilityId}/organizations/`,
      {
        headers: getApiHeaders(),
        data: {
          name: organizationName,
          description: "Healthcare service managing organization",
          org_type: "dept",
          facility: facilityId,
        },
      },
    );
    expect(
      organizationResponse.ok(),
      await organizationResponse.text(),
    ).toBeTruthy();
    const organization = await organizationResponse.json();

    serviceWithoutOrg = await createService(request, null);
    serviceWithOrg = await createService(request, organization.id);
    await request.dispose();
  });

  const detailsUrl = (serviceId: string) =>
    `/facility/${facilityId}/settings/healthcare_services/${serviceId}`;

  test("hides the managing organization section when none is set", async ({
    page,
  }) => {
    await page.goto(detailsUrl(serviceWithoutOrg.id));

    await expect(page.getByText(serviceWithoutOrg.name).first()).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Managing Organization" }),
    ).toHaveCount(0);
  });

  test("shows the managing organization section when one is set", async ({
    page,
  }) => {
    await page.goto(detailsUrl(serviceWithOrg.id));

    await expect(page.getByText(serviceWithOrg.name).first()).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Managing Organization" }),
    ).toBeVisible();
    await expect(page.getByText(organizationName)).toBeVisible();
  });
});
