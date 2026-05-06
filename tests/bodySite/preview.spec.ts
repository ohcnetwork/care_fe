import { expect, test } from "@playwright/test";

test.describe("Body Site Selector preview", () => {
  test.beforeEach(async ({ context }) => {
    // Reset persisted mode preference so tests are deterministic
    await context.addInitScript(() => {
      window.localStorage.removeItem("body-site-render-mode");
    });
  });

  test("renders 2D body chart by default", async ({ page }) => {
    await page.goto("/preview/body-site");

    await expect(
      page.getByRole("application", { name: /body site selector/i }),
    ).toBeVisible();
    // 2D mode shows an SVG body image
    await expect(
      page.getByRole("img", { name: /body front view/i }),
    ).toBeVisible();
  });

  test("search highlights matching regions and selects one", async ({
    page,
  }) => {
    await page.goto("/preview/body-site");

    const search = page.getByPlaceholder(/search body region/i);
    await search.fill("shoulder");

    const rightShoulder = page.getByRole("button", {
      name: /right shoulder region/i,
    });
    await expect(rightShoulder).toBeVisible();
    await rightShoulder.click();

    // Selected region appears in status bar
    await expect(
      page.locator("text=Right shoulder region").first(),
    ).toBeVisible();
  });

  test("front/back view toggle", async ({ page }) => {
    await page.goto("/preview/body-site");

    const front = page.getByRole("button", { name: "Front", exact: true });
    const back = page.getByRole("button", { name: "Back", exact: true });

    await expect(front).toHaveAttribute("aria-pressed", "true");
    await back.click();
    await expect(back).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByRole("img", { name: /body back view/i }),
    ).toBeVisible();
  });

  test("multi-select demo accumulates regions and clears", async ({ page }) => {
    await page.goto("/preview/body-site");
    await page
      .getByRole("button", { name: /multi-select \(wound mapping\)/i })
      .click();

    const search = page.getByPlaceholder(/search body region/i);
    await search.fill("right knee");
    await page
      .getByRole("button", { name: /right knee region/i })
      .first()
      .click();

    await search.fill("right elbow");
    await page
      .getByRole("button", { name: /right elbow region/i })
      .first()
      .click();

    await expect(page.locator("text=2 sites selected")).toBeVisible();

    await page.getByRole("button", { name: /clear all/i }).click();
    await expect(page.locator("text=2 sites selected")).toBeHidden();
  });

  test("annotations: place a wound marker and clear it", async ({ page }) => {
    await page.goto("/preview/body-site");
    await page
      .getByRole("button", { name: /annotations \(wounds, pain, scars\)/i })
      .click();

    // Pick the Wound tool
    await page.getByRole("button", { name: "Wound", exact: true }).click();

    // Click on the body silhouette to place a marker
    const body = page.getByRole("img", { name: /body front view/i });
    const box = await body.boundingBox();
    if (!box) throw new Error("body bounding box missing");
    await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.4);

    // The clear-annotations button should now appear
    await expect(
      page.getByRole("button", { name: /clear 1 annotation/i }),
    ).toBeVisible();

    // Clear and verify gone
    await page.getByRole("button", { name: /clear 1 annotation/i }).click();
    await expect(
      page.getByRole("button", { name: /clear 1 annotation/i }),
    ).toBeHidden();
  });

  test("IM injection use case restricts to injection sites", async ({
    page,
  }) => {
    await page.goto("/preview/body-site");
    await page
      .getByRole("button", { name: /im injection sites only/i })
      .click();

    const search = page.getByPlaceholder(/search body region/i);
    await search.fill("deltoid");

    await expect(
      page.getByRole("button", { name: /right deltoid/i }),
    ).toBeVisible();

    // Non-injection regions should not match
    await search.fill("eye");
    await expect(page.locator("text=No Results Found")).toBeVisible();
  });
});
