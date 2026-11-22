import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { queryParam, waitForApiList } from "tests/helper/searchParams";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("User departments", () => {
  test.describe.configure({ mode: "serial" });

  test("finds a linked department by name and opens it from the results", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    await page.goto(`/facility/${facilityId}/users/care-nurse/departments?name=Adminis`);
    const search = page.getByRole("textbox", { name: /search departments/i });
    await expect(search).toHaveValue("Adminis");
    const link = page.getByRole("link", { name: "Administration", exact: true });
    const row = page.getByRole("row").filter({ has: link });
    await expect(row.getByRole("cell", { name: "Nurse", exact: true })).toBeVisible();
    await link.click();
    await expect(page.getByRole("heading", { name: "Administration", exact: true })).toBeVisible();
  });

  test("search from a later page resets the offset and can be cleared", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const path = `/facility/${facilityId}/organizations/`;
    const name = faker.string.uuid();
    const secondPage = waitForApiList(page, path, (params) =>
      params.has("containing_user") && params.get("offset") === "15",
    );
    await page.goto(`/facility/${facilityId}/users/admin/departments?page=2`);
    await secondPage;

    const search = page.getByRole("textbox", { name: /search departments/i });
    const filtered = waitForApiList(page, path, (params) =>
      params.has("containing_user") && params.get("name") === name && params.get("offset") === "0",
    );
    await search.fill(name);
    expect((await filtered).ok()).toBe(true);
    await expect(page.getByText("No departments found")).toBeVisible();
    await expect(page.getByText("No departments assigned")).toBeHidden();
    await expect(page).toHaveURL(queryParam("page", 1));

    const unfiltered = waitForApiList(page, path, (params) =>
      params.has("containing_user") && !params.has("name") && params.get("offset") === "0",
    );
    await page.getByRole("button", { name: "Clear search" }).click();
    expect((await unfiltered).ok()).toBe(true);
    await expect(search).toHaveValue("");
    await expect(page).not.toHaveURL(queryParam("name", name));
  });
});
