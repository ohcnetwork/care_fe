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
  // The overflow cue is decorative (aria-hidden); it is shown via CSS while
  // the content can scroll further down.
  const cue = content.locator('[data-slot="sidebar-scroll-cue"]');
  await expect(content).toHaveAttribute("data-scroll-down", "");
  await expect(cue).toBeVisible();
  await content.evaluate((el) => el.scrollTo(0, el.scrollHeight));
  await expect(content).toHaveAttribute("data-scroll-up", "");
  await expect(content).not.toHaveAttribute("data-scroll-down");
  await expect(cue).toBeHidden();
  await content.evaluate((el) => el.scrollTo(0, 0));
  await expect(cue).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 1200 });
  await expect(cue).toBeHidden();
  await page.getByRole("button", { name: "Search page actions" }).click();
  await expect(page.getByPlaceholder("Search page actions")).toBeVisible();
});
