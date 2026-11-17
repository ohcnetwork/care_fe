import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test("shows Inventory and Pharmacy only when the location uses inventory", async ({
  baseURL,
  page,
}) => {
  const facilityId = getFacilityId();
  const locationUrl = `${getApiUrl()}/api/v1/facility/${facilityId}/location/`;
  const headers = getApiHeaders();
  const name = `Inventory ${faker.string.alphanumeric(8)}`;
  const location = {
    name,
    description: "",
    status: "active",
    operational_status: "O",
    form: "ro",
    mode: "kind",
    organizations: [],
    inventory_usage: "consumption",
  };
  const created = await page.request.post(locationUrl, {
    headers,
    data: location,
  });
  await expect(created).toBeOK();
  const { id } = await created.json();
  const bedsUrl = `/facility/${facilityId}/locations/${id}/beds`;
  const inventory = page.getByRole("button", {
    name: "Inventory",
    exact: true,
  });
  const pharmacy = page.getByRole("button", { name: "Pharmacy", exact: true });

  await page
    .context()
    .addCookies([{ name: "sidebar:state", value: "true", url: baseURL }]);
  await page.goto(bedsUrl);
  await expect(inventory).toBeVisible();
  await expect(pharmacy).toBeVisible();

  const updated = await page.request.put(`${locationUrl}${id}/`, {
    headers,
    data: { ...location, inventory_usage: "none" },
  });
  await expect(updated).toBeOK();

  await page.reload();
  await expect(page.getByRole("button", { name, exact: true })).toBeVisible();
  await expect(inventory).toHaveCount(0);
  await expect(pharmacy).toHaveCount(0);
});
