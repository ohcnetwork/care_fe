import { expect, test } from "@playwright/test";
import { createLocationHierarchy } from "tests/helper/locations";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test("location navigation distinguishes sub-locations from beds while preserving both in child views", async ({
  page,
  request,
}) => {
  const facilityId = getFacilityId();
  const { root, ward, rootBed, wardBed } = await createLocationHierarchy(
    request,
    facilityId,
  );

  await page.goto(`/facility/${facilityId}/locations/${root.id}/beds`);
  await expect(page.getByText(rootBed.name, { exact: true })).toBeVisible();
  await expect(page.getByText(ward.name, { exact: true })).toBeVisible();

  await page.getByRole("button", { name: root.name, exact: true }).click();
  const selector = page.getByRole("dialog");
  await selector.getByPlaceholder("Search").fill(root.name);
  await selector
    .getByRole("option")
    .filter({ has: page.getByText(root.name, { exact: true }) })
    .filter({
      has: page.getByRole("button", {
        name: "View Sub-Locations",
        exact: true,
      }),
    })
    .click();
  const wardOption = selector
    .getByRole("option")
    .filter({ hasText: ward.name });
  await expect(wardOption).toBeVisible();
  await expect(
    wardOption.getByRole("button", { name: "Select", exact: true }),
  ).toBeVisible();
  await wardOption.click();
  await expect(selector).not.toBeVisible();
  await expect(page).toHaveURL(new RegExp(`/locations/${ward.id}/beds$`));
  await expect(page.getByText(wardBed.name, { exact: true })).toBeVisible();

  await page.goto(`/facility/${facilityId}/settings/locations`);
  await page.getByRole("textbox", { name: "Search by name" }).fill(root.name);
  const rootRow = page
    .getByRole("row")
    .filter({ has: page.getByText(root.name, { exact: true }) });
  await expect(rootRow).toBeVisible();
  await expect(
    rootRow.getByRole("img", { name: "Has sub-locations" }),
  ).toBeVisible();
  await expect(rootRow.getByRole("img", { name: "Has beds" })).toBeVisible();
  await expect(
    rootRow.getByRole("button", { name: "Delete", exact: true }),
  ).toHaveCount(0);
  await rootRow.click();

  const wardRow = page
    .getByRole("row")
    .filter({ has: page.getByText(ward.name, { exact: true }) });
  await expect(wardRow).toBeVisible();
  await expect(wardRow.getByRole("img", { name: "Has beds" })).toBeVisible();
  await expect(
    wardRow.getByRole("img", { name: "Has sub-locations" }),
  ).toHaveCount(0);
  await expect(
    wardRow.getByRole("button", { name: "Delete", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("row").filter({ hasText: rootBed.name }),
  ).toBeVisible();
});
