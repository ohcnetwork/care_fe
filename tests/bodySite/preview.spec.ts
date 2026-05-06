import { expect, test } from "@playwright/test";

test.describe("3D Body Site Selector preview", () => {
  test("renders the picker and view controls", async ({ page }) => {
    await page.goto("/preview/body-site");

    await expect(
      page.getByRole("application", { name: /3D body site selector/i }),
    ).toBeVisible();

    // View toggle buttons
    for (const label of ["Front", "Back", "Left", "Right"]) {
      await expect(page.getByRole("button", { name: label })).toBeVisible();
    }

    // Search field
    await expect(page.getByPlaceholder(/search body region/i)).toBeVisible();
  });

  test("search highlights matching regions and selects one", async ({
    page,
  }) => {
    await page.goto("/preview/body-site");

    const search = page.getByPlaceholder(/search body region/i);
    await search.fill("shoulder");

    // The search dropdown should list the right shoulder
    const rightShoulder = page.getByRole("button", {
      name: /right shoulder region/i,
    });
    await expect(rightShoulder).toBeVisible();

    await rightShoulder.click();

    // Selected region should appear in the bottom status bar
    await expect(page.getByText(/Right shoulder region/i)).toBeVisible();
    await expect(page.getByText(/91775009/)).toBeVisible();
  });

  test("view buttons toggle aria-pressed", async ({ page }) => {
    await page.goto("/preview/body-site");

    const front = page.getByRole("button", { name: "Front" });
    const back = page.getByRole("button", { name: "Back" });

    await expect(front).toHaveAttribute("aria-pressed", "true");
    await back.click();
    await expect(back).toHaveAttribute("aria-pressed", "true");
    await expect(front).toHaveAttribute("aria-pressed", "false");
  });
});
