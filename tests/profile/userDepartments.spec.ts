import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";
import { expectToast } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

const LINK_SUCCESS_TOAST = "User linked to department successfully";
const ROLE_UPDATE_TOAST = "User role updated successfully";

interface ApiDepartment {
  id: string;
  name: string;
}

async function createDepartment(
  page: Page,
  facilityId: string,
  name: string,
): Promise<ApiDepartment> {
  await page.goto(`/facility/${facilityId}/settings/departments`);
  await page
    .getByRole("button", { name: "Add Department/Team" })
    .first()
    .click();
  await page.getByRole("textbox", { name: "Name" }).pressSequentially(name);

  const responsePromise = page.waitForResponse(
    (resp) =>
      resp.url().includes(`/facility/${facilityId}/organizations/`) &&
      resp.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Create Organization" }).click();
  const response = await responsePromise;
  expect([200, 201]).toContain(response.status());
  const dept = await response.json();

  await expect(
    page
      .locator("li[data-sonner-toast]")
      .getByText("Organization created successfully"),
  ).toBeVisible({ timeout: 10000 });

  return { id: dept.id, name: dept.name };
}

// Unique, search-safe prefix so result counts are deterministic regardless of
// pre-existing departments the user already belongs to.
function uniquePrefix(): string {
  return `dept${faker.string.alphanumeric(8).toLowerCase()}`;
}

test.describe("User Departments Tab", () => {
  let facilityId: string;

  test.beforeEach(() => {
    facilityId = getFacilityId();
  });

  function searchInput(page: Page) {
    return page.getByRole("textbox", { name: /search departments/i });
  }

  async function gotoDepartmentsTab(page: Page) {
    await page.goto(`/facility/${facilityId}/users/admin/departments`);
    await expect(
      page.getByRole("heading", { name: "Departments", exact: true }),
    ).toBeVisible();
  }

  // Links the user to an existing department through the Link Department sheet
  // (the real user journey). `searchTerm` finds the department in the org
  // selector; the success toast is cleared before returning so callers can link
  // several departments in a row without stacked-toast collisions.
  async function linkDepartmentViaSheet(
    page: Page,
    department: ApiDepartment,
    roleName: string,
    searchTerm: string,
  ) {
    await page.getByRole("button", { name: "Link Department" }).click();
    await expect(page.getByText("Link User to Department")).toBeVisible();

    // Switch tab before opening the dropdown (clicking it would close the popover)
    await page.getByRole("tab", { name: "All Organizations" }).click();
    await page
      .getByRole("combobox")
      .filter({ hasText: "Select Department" })
      .click();
    await page.getByPlaceholder("Search Organizations").fill(searchTerm);
    await page.getByRole("option", { name: department.name }).click();

    await page.getByRole("combobox").filter({ hasText: "Select Role" }).click();
    await page.getByRole("option", { name: roleName }).first().click();

    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes(`/organizations/${department.id}/users/`) &&
        resp.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Link to Department" }).click();
    const response = await responsePromise;
    expect([200, 201]).toContain(response.status());

    await expectToast(page, LINK_SUCCESS_TOAST);
    // Clear the toast before returning so a subsequent link's assertion does not
    // collide with a still-visible identical toast.
    await expect(
      page.locator(".toaster.group").getByText(LINK_SUCCESS_TOAST),
    ).toHaveCount(0, { timeout: 15000 });
  }

  test("links a department to the user and shows its type and role", async ({
    page,
  }) => {
    const prefix = uniquePrefix();
    const dept = await createDepartment(
      page,
      facilityId,
      `${prefix}-cardiology`,
    );

    await gotoDepartmentsTab(page);

    await test.step("Link the department through the sheet", async () => {
      await linkDepartmentViaSheet(page, dept, "Doctor", prefix);
    });

    await test.step("Verify the card shows name, type and role", async () => {
      await searchInput(page).fill(prefix);
      const card = page
        .locator('[data-slot="card"]')
        .filter({ hasText: dept.name });
      await expect(
        card.getByRole("heading", { name: dept.name }),
      ).toBeVisible();
      await expect(card.getByText("Department", { exact: true })).toBeVisible();
      await expect(card.getByText("Doctor")).toBeVisible();
    });
  });

  test("filters the list as the user types in search", async ({ page }) => {
    const prefix = uniquePrefix();
    const alpha = await createDepartment(page, facilityId, `${prefix}-alpha`);
    const beta = await createDepartment(page, facilityId, `${prefix}-beta`);

    await gotoDepartmentsTab(page);

    await test.step("Link both departments through the sheet", async () => {
      await linkDepartmentViaSheet(page, alpha, "Doctor", prefix);
      await linkDepartmentViaSheet(page, beta, "Doctor", prefix);
    });

    await test.step("Both departments show when searching the shared prefix", async () => {
      await searchInput(page).fill(prefix);
      await expect(
        page.getByRole("heading", { name: alpha.name }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: beta.name }),
      ).toBeVisible();
    });

    await test.step("Narrowing the search filters server-side", async () => {
      const responsePromise = page.waitForResponse(
        (resp) =>
          resp.url().includes("/organizations/") &&
          resp.url().includes(`name=${prefix}-alpha`) &&
          resp.request().method() === "GET" &&
          resp.status() === 200,
      );
      await searchInput(page).fill(`${prefix}-alpha`);
      await responsePromise;

      await expect(
        page.getByRole("heading", { name: alpha.name }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: beta.name }),
      ).not.toBeVisible();
    });
  });

  test("shows the empty state when search has no matches", async ({ page }) => {
    await gotoDepartmentsTab(page);

    await searchInput(page).fill(faker.string.uuid());

    await expect(page.getByText("No departments found")).toBeVisible();
  });

  test("opens the department detail page when a card is clicked", async ({
    page,
  }) => {
    const prefix = uniquePrefix();
    const dept = await createDepartment(page, facilityId, `${prefix}-oncology`);

    await gotoDepartmentsTab(page);
    await linkDepartmentViaSheet(page, dept, "Doctor", prefix);

    await searchInput(page).fill(prefix);
    await page.getByRole("link", { name: dept.name }).first().click();

    await expect(page).toHaveURL(
      new RegExp(`/settings/departments/${dept.id}/departments`),
    );
    await expect(page.getByRole("heading", { name: dept.name })).toBeVisible();
  });

  test("updates the user's role in a department", async ({ page }) => {
    const prefix = uniquePrefix();
    const dept = await createDepartment(
      page,
      facilityId,
      `${prefix}-pathology`,
    );

    await gotoDepartmentsTab(page);
    await linkDepartmentViaSheet(page, dept, "Doctor", prefix);

    await searchInput(page).fill(prefix);

    const card = page
      .locator('[data-slot="card"]')
      .filter({ hasText: dept.name });

    await test.step("Open the edit role sheet from the card", async () => {
      await expect(card.getByText("Doctor")).toBeVisible();
      await card.getByRole("button").click();
      await expect(page.getByText("Edit User Role")).toBeVisible();
    });

    await test.step("Pick a different role and update", async () => {
      await page.getByRole("combobox").filter({ hasText: "Doctor" }).click();
      await page.getByRole("option", { name: "Staff" }).first().click();

      const responsePromise = page.waitForResponse(
        (resp) =>
          resp.url().includes(`/organizations/${dept.id}/users/`) &&
          resp.request().method() === "PUT",
      );
      await page.getByRole("button", { name: "Update Role" }).click();
      const response = await responsePromise;
      expect(response.status()).toBe(200);

      await expectToast(page, ROLE_UPDATE_TOAST);
    });

    await test.step("Verify the role badge reflects the new role", async () => {
      await expect(card.getByText("Staff")).toBeVisible();
    });
  });
});
