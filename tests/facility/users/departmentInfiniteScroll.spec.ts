import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { departmentTrigger } from "tests/helper/departmentSelect";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { getFacilityId } from "tests/support/facilityId";

const DEPT_COUNT = 25; // > PAGE_LIMIT (20) to trigger infinite scroll
const DEPT_PREFIX = "ScrollTest";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Department Selector Infinite Scroll", () => {
  test.beforeAll(async () => {
    const facilityId = getFacilityId();
    const apiUrl = getApiUrl();
    const headers = getApiHeaders();

    // Check how many ScrollTest departments already exist
    const listRes = await fetch(
      `${apiUrl}/api/v1/facility/${facilityId}/organizations/?name=${DEPT_PREFIX}&limit=50`,
      { headers },
    );
    if (!listRes.ok) throw new Error(`Failed to list orgs: ${listRes.status}`);
    const listData = (await listRes.json()) as { count: number };

    if (listData.count >= DEPT_COUNT) {
      console.log(
        `✅ Already have ${listData.count} ${DEPT_PREFIX} departments`,
      );
      return;
    }

    const toCreate = DEPT_COUNT - listData.count;
    console.log(`Creating ${toCreate} departments...`);

    for (let i = 0; i < toCreate; i++) {
      const name = `${DEPT_PREFIX} ${faker.string.alphanumeric(6)}`;
      const res = await fetch(
        `${apiUrl}/api/v1/facility/${facilityId}/organizations/`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            name,
            description: `Test department for infinite scroll`,
            org_type: "dept",
            facility: facilityId,
          }),
        },
      );
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(
          `Failed to create department: ${res.status} — ${errorText}`,
        );
      }
    }
    console.log(`✅ Created ${toCreate} departments`);
  });

  test("dropdown loads first page and scrolling loads more", async ({
    page,
  }) => {
    const facilityId = getFacilityId();

    await test.step("Navigate to a user's Departments tab", async () => {
      await page.goto(`/facility/${facilityId}/users`);
      await expect(
        page.getByRole("button", { name: "See Details" }).first(),
      ).toBeVisible();
      await page.getByRole("button", { name: "See Details" }).first().click();
      await page.getByText("Departments", { exact: true }).click();
    });

    await test.step("Open Link Department sheet", async () => {
      // The picker in the sheet loads the first page of top-level departments
      // (offset=0) and "My departments" as it mounts. Both must settle before
      // the scroll step, whose listener matches any request with an offset.
      const firstPageLoaded = page.waitForResponse((resp) => {
        const url = new URL(resp.url());
        return (
          url.pathname.endsWith(`/facility/${facilityId}/organizations/`) &&
          url.searchParams.get("parent") === "" &&
          url.searchParams.get("offset") === "0" &&
          resp.status() === 200
        );
      });
      const myDepartmentsLoaded = page.waitForResponse((resp) =>
        resp.url().includes(`/facility/${facilityId}/organizations/mine/`),
      );
      await page.getByRole("button", { name: "Link Department" }).click();
      await expect(page.getByText("Link User to Department")).toBeVisible();
      await Promise.all([firstPageLoaded, myDepartmentsLoaded]);
    });

    await test.step("Open department dropdown", async () => {
      await departmentTrigger(page).click();
    });

    const items = page.getByRole("treeitem");

    await test.step("Verify first page of departments loads", async () => {
      await expect(items.first()).toBeVisible();
      const initialCount = await items.count();
      expect(initialCount).toBeGreaterThan(0);
    });

    await test.step("Scroll to bottom to trigger infinite scroll", async () => {
      const initialCount = await items.count();

      // Set up listener for the next-page API request before scrolling
      const nextPageRequest = page.waitForResponse(
        (resp) =>
          resp.url().includes("/organizations/") &&
          resp.url().includes("offset=") &&
          resp.status() === 200,
      );

      // Scroll the list to the bottom to trigger the sentinel
      const list = page.locator('[data-slot="tree-select-list"]');
      await list.evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });

      // Verify the paginated API request was fired
      await nextPageRequest;

      // Verify more items rendered from the response
      await expect(async () => {
        const newCount = await items.count();
        expect(newCount).toBeGreaterThan(initialCount);
      }).toPass();
    });
  });
});
