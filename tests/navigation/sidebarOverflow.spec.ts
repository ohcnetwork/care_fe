import { expect, test } from "@playwright/test";

test.use({ storageState: "tests/.auth/user.json" });

test("admin navigation indicates overflow and explains the header search", async ({
  page,
  context,
  baseURL,
}) => {
  await context.addCookies([
    { name: "sidebar:state", value: "true", url: baseURL! },
  ]);
  await page.setViewportSize({ width: 1280, height: 440 });
  await page.goto("/admin/questionnaires");
  const content = page.locator('[data-sidebar="content"]');
  const more = page.getByRole("button", { name: "More navigation" });
  await expect(more).toBeVisible();
  await more.click();
  await expect
    .poll(() => content.evaluate((el) => el.scrollTop))
    .toBeGreaterThan(0);
  await content.evaluate((el) => el.scrollTo(0, el.scrollHeight));
  await expect(more).not.toBeVisible();
  await content.evaluate((el) => el.scrollTo(0, 0));
  await expect(more).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 1200 });
  await expect(more).not.toBeVisible();
  await page.getByRole("button", { name: "Search page actions" }).click();
  await expect(page.getByPlaceholder("Search page actions")).toBeVisible();
});
