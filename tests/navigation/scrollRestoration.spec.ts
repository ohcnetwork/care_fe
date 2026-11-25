import { expect, test, type Locator } from "@playwright/test";

import { mockTestPlugin } from "tests/helper/testPlugin";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

const scrollTop = (content: Locator) =>
  content.evaluate((element) => element.scrollTop);

test("new pages start at the top while history and hash navigation restore their positions", async ({
  page,
}) => {
  await mockTestPlugin(page);
  await page.goto("/test-plugin/scroll/one");
  await expect(
    page.getByRole("heading", { name: "Scroll page one" }),
  ).toBeVisible();
  const content = page.locator("[data-cui-page]");

  await test.step("A new page does not inherit the previous page's scroll", async () => {
    await content.evaluate((element) => element.scrollTo(0, 420));
    await expect.poll(() => scrollTop(content)).toBe(420);
    await page.getByRole("link", { name: "Other scroll page" }).click();
    await expect(
      page.getByRole("heading", { name: "Scroll page two" }),
    ).toBeVisible();
    await expect.poll(() => scrollTop(content)).toBe(0);
  });

  await test.step("Back and Forward retain each history entry's own position", async () => {
    await content.evaluate((element) => element.scrollTo(0, 680));
    await expect.poll(() => scrollTop(content)).toBe(680);
    await page.goBack();
    await expect(
      page.getByRole("heading", { name: "Scroll page one" }),
    ).toBeVisible();
    await expect.poll(() => scrollTop(content)).toBe(420);
    await page.goForward();
    await expect(
      page.getByRole("heading", { name: "Scroll page two" }),
    ).toBeVisible();
    await expect.poll(() => scrollTop(content)).toBe(680);
  });

  await test.step("A hash link scrolls to its target", async () => {
    await page.getByRole("link", { name: "Jump to section" }).click();
    await expect(page).toHaveURL(/#scroll-target$/);
    await expect.poll(() => scrollTop(content)).toBeGreaterThan(900);
    await expect(
      page.getByRole("heading", { name: "Scroll destination" }),
    ).toBeInViewport();
  });
});

test("updating a list's query parameters keeps the current page scroll", async ({
  page,
}) => {
  const facilityId = getFacilityId();
  // The list data makes both pages long enough to scroll. The real response
  // list, pagination control, query hook, app shell and router own the change.
  await page.route("**/api/v1/resource_responses/?*", (route) => {
    const offset = Number(
      new URL(route.request().url()).searchParams.get("offset"),
    );
    return route.fulfill({
      json: {
        count: 40,
        results: Array.from({ length: 20 }, (_, index) => ({
          id: `scroll-response-${offset + index}`,
          subject_id: facilityId,
          questionnaire: {
            id: "scroll-questionnaire",
            slug: "scroll-questionnaire",
            title: `Scroll response ${offset + index + 1}`,
            questions: [],
          },
          status: "completed",
          responses: [],
          created_by: null,
          created_date: null,
        })),
      },
    });
  });
  await page.goto(`/facility/${facilityId}/settings/responses`);
  await expect(
    page.getByText("Scroll response 1", { exact: true }),
  ).toBeVisible();
  const content = page.locator("[data-cui-page]");
  const next = page.getByRole("button", {
    name: "Go to next page",
    exact: true,
  });
  await next.scrollIntoViewIfNeeded();
  await page.evaluate(() => document.fonts.ready);
  await next.focus();
  await expect(next).toBeFocused();
  const previousTop = await scrollTop(content);
  expect(previousTop).toBeGreaterThan(200);

  await next.press("Enter");
  await expect(page).toHaveURL(/[?&]page=2(&|$)/);
  await expect(
    page.getByText("Scroll response 21", { exact: true }),
  ).toBeVisible();
  await expect.poll(() => scrollTop(content)).toBe(previousTop);
});
