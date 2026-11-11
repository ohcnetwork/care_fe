import { faker } from "@faker-js/faker";
import { expect, Locator, Page, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

// Returns how many pixels any descendant of the container extends past the
// container's right edge (0 means nothing overflows).
async function getHorizontalOverflow(container: Locator) {
  return container.evaluate((el) => {
    const right = el.getBoundingClientRect().right;
    let overflow = Math.max(0, el.scrollWidth - el.clientWidth);
    el.querySelectorAll("*").forEach((child) => {
      overflow = Math.max(
        overflow,
        child.getBoundingClientRect().right - right,
      );
    });
    return Math.round(overflow);
  });
}

test.describe("Product Knowledge list with long values", () => {
  let facilityId: string;
  let longName: string;
  let longIdentifier: string;
  let longCode: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    // Unbroken strings are the worst case: they have no natural wrap points.
    longName = `LongName${faker.string.alpha(250)}`;
    longIdentifier = `LongId${faker.string.alphanumeric(200)}`;
    longCode = `LongCode${faker.string.alphanumeric(150)}`;

    await page.route("**/api/v1/product_knowledge/?*", async (route) => {
      const url = new URL(route.request().url());
      if (!url.searchParams.has("category")) {
        return route.fallback();
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          count: 1,
          next: null,
          previous: null,
          results: [
            {
              id: faker.string.uuid(),
              slug: "f-long-product",
              name: longName,
              alternate_identifier: longIdentifier,
              product_type: "medication",
              status: "active",
              code: {
                system: "http://snomed.info/sct",
                code: longCode,
                display: longName,
              },
              names: [],
              storage_guidelines: [],
              is_instance_level: false,
            },
          ],
        }),
      });
    });
  });

  async function openCategory(page: Page) {
    await page.goto(`/facility/${facilityId}/settings/product_knowledge`);
    await page.getByRole("heading", { name: "Medications" }).click();
  }

  test("desktop table keeps long values within the table", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await openCategory(page);

    const table = page.getByRole("table");
    const row = table.getByRole("row").filter({ hasText: longName });
    await expect(row).toBeVisible();
    await expect(row.getByText(longIdentifier)).toBeVisible();

    await expect(row.getByRole("link", { name: "View" })).toBeInViewport();
    expect(
      await getHorizontalOverflow(
        page.locator('[data-slot="table-container"]'),
      ),
    ).toBeLessThanOrEqual(1);
  });

  test("mobile card keeps long values within the card", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openCategory(page);

    const card = page
      .locator('[data-slot="card"]')
      .filter({ hasText: longName });
    await expect(card).toBeVisible();
    await expect(card.getByText(longIdentifier)).toBeVisible();
    await expect(card.getByText(longCode)).toBeVisible();

    expect(await getHorizontalOverflow(card)).toBeLessThanOrEqual(1);
    const hasPageHorizontalScroll = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(hasPageHorizontalScroll).toBe(false);
  });

  for (const width of [320, 390, 768, 1024, 1280, 1920]) {
    test(`filters stay within the page at ${width}px with selected values`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 800 });
      await openCategory(page);
      await expect(page.getByPlaceholder("Search products")).toBeVisible();

      const url = new URL(page.url());
      url.searchParams.set("status", "active");
      url.searchParams.set("product_type", "nutritional_product");
      await page.goto(url.toString());

      const search = page.getByPlaceholder("Search products");
      await expect(search).toBeVisible();
      const filterRow = search.locator("xpath=../..");
      const clearButtons = filterRow.getByRole("button", {
        name: "Remove filter",
      });
      await expect(clearButtons).toHaveCount(2);
      // On narrow screens the filter group scrolls sideways instead of
      // overflowing the page, so every clear button must stay reachable.
      for (const button of await clearButtons.all()) {
        await button.scrollIntoViewIfNeeded();
        await expect(button).toBeInViewport();
      }

      const { rowRight, groupRight, filtersRight } = await filterRow.evaluate(
        (row) => {
          const group = row.lastElementChild!;
          return {
            rowRight: row.getBoundingClientRect().right,
            groupRight: group.getBoundingClientRect().right,
            filtersRight: group.lastElementChild!.getBoundingClientRect().right,
          };
        },
      );
      expect(groupRight).toBeLessThanOrEqual(rowRight + 1);

      if (width >= 1280) {
        const searchBox = await search.boundingBox();
        for (const button of await clearButtons.all()) {
          const buttonBox = await button.boundingBox();
          expect(Math.abs(buttonBox!.y - searchBox!.y)).toBeLessThanOrEqual(2);
        }
        // Search stays first and the filters are pushed to the end.
        expect(Math.abs(rowRight - filtersRight)).toBeLessThanOrEqual(1);
      }

      const hasPageHorizontalScroll = await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      );
      expect(hasPageHorizontalScroll).toBe(false);
    });
  }
});
