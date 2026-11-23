import { faker } from "@faker-js/faker";

import { RESOURCE_CATEGORY_SLUG } from "tests/facility/settings/activityDefinition/activityDefinition";
import {
  createActivityDefinitionViaUi,
  createChargeItemDefinitionViaUi,
  openChargeItemDefinitionCategory,
} from "tests/helper/definitions";
import {
  createDepartmentViaUi,
  createLocationViaUi,
  createUserViaApi,
  linkUserToDepartmentViaUi,
} from "tests/helper/facilitySettings";
import { createHealthcareServiceViaUi } from "tests/helper/healthcareService";
import { clearFilter } from "tests/helper/ui";
import { expect, test } from "tests/support/test";

test.use({ storageState: "tests/.auth/user.json" });

test(
  "a facility is set up with a department and its staff, a location, a service there, a charge and an active activity",
  { tag: ["@workflow", "@cap:workflow.facility-setup"] },
  async ({ page, facilityId }) => {
    // Six create forms, each followed by a list lookup.
    test.setTimeout(240_000);

    const suffix = faker.string.alphanumeric(6).toUpperCase();

    const { name: departmentName } = await createDepartmentViaUi(page, {
      facilityId,
      name: `${faker.commerce.department()} ${suffix}`,
      type: "Department",
      description: faker.lorem.sentence(),
    });

    await test.step("The department is listed in facility settings", async () => {
      await page
        .getByRole("textbox", { name: "Search by department/team name" })
        .fill(departmentName);
      await expect(
        page.getByRole("row").filter({ hasText: departmentName }),
      ).toBeVisible();
    });

    const { name: locationName } = await createLocationViaUi(page, {
      facilityId,
      name: `${faker.company.buzzNoun()} room ${suffix}`,
    });

    await test.step("The location is listed in facility settings", async () => {
      await page
        .getByRole("textbox", { name: "Search by name" })
        .fill(locationName);
      await expect(page.locator('[data-slot="table-body"]')).toContainText(
        locationName,
      );
    });

    // A lab service at the new location.
    const { name: serviceName } = await createHealthcareServiceViaUi(page, {
      facilityId,
      name: `${suffix} ${faker.commerce.productName()}`,
      internalType: "Lab",
      locationName,
    });

    await test.step("The service is listed among the facility's services and opens its location", async () => {
      await page.goto(`/facility/${facilityId}/services`);
      await page
        .getByRole("textbox", {
          name: "Search healthcare services...",
          exact: true,
        })
        .fill(serviceName);
      await page.getByRole("link", { name: serviceName }).click();
      await expect(
        page.getByRole("heading", { level: 1, name: serviceName, exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: locationName }),
      ).toBeVisible();
    });

    const { username } = await createUserViaApi({ usernamePrefix: "wf-staff" });
    const role = "Doctor";
    await linkUserToDepartmentViaUi(page, {
      facilityId,
      departmentName,
      username,
      role,
    });

    await test.step("The department's users list the new staff member", async () => {
      await page
        .getByRole("textbox", { name: "Search by username" })
        .fill(username);
      await expect(page.getByText(username)).toBeVisible();
      await expect(page.getByText(role, { exact: true })).toBeVisible();
    });

    const chargeItemDefinition = await createChargeItemDefinitionViaUi(page, {
      facilityId,
    });

    await test.step("The charge item definition is listed in its category", async () => {
      await openChargeItemDefinitionCategory(page, {
        facilityId,
        categoryName: "Medications",
      });
      // Retry: the list's search can lag behind the create.
      await expect(async () => {
        await page.getByRole("textbox", { name: /search/i }).clear();
        await page
          .getByRole("textbox", { name: /search/i })
          .fill(chargeItemDefinition.name);
        await expect(
          page.getByRole("table").getByText(chargeItemDefinition.name),
        ).toBeVisible();
      }).toPass({ intervals: [2_000, 3_000, 5_000], timeout: 30_000 });
    });

    const activityDefinition = await createActivityDefinitionViaUi(page, {
      facilityId,
      status: "Active",
    });

    await test.step("The activity definition is listed as active in its category", async () => {
      await page.goto(
        `/facility/${facilityId}/settings/activity_definitions/categories/f-${facilityId}-${RESOURCE_CATEGORY_SLUG}`,
      );
      await clearFilter(page);
      await expect(page.locator('[data-slot="table-body"]')).toBeVisible();
      await page
        .getByPlaceholder(/search activity definition/i)
        .fill(activityDefinition.title);
      const row = page.locator('[data-slot="table-row"]', {
        hasText: activityDefinition.title,
      });
      await expect(row).toBeVisible();
      await expect(row).toContainText("Active");
    });
  },
);
