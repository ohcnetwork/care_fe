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

  test("annotations: place, edit, and delete a wound marker", async ({
    page,
  }) => {
    await page.goto("/preview/body-site");
    await page
      .getByRole("button", { name: /annotations \(wounds, pain, scars\)/i })
      .click();

    // Pick the Wound tool
    await page
      .getByRole("toolbar", { name: /annotation tools/i })
      .getByRole("button", { name: "Wound", exact: true })
      .click();

    const body = page.getByRole("img", { name: /body front view/i });
    const box = await body.boundingBox();
    if (!box) throw new Error("body bounding box missing");
    // Place at upper torso area
    await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.35);

    await expect(
      page.getByRole("button", { name: /clear 1 annotation/i }),
    ).toBeVisible();

    // Switch to "Select region" so subsequent clicks open the editor
    await page
      .getByRole("toolbar", { name: /annotation tools/i })
      .getByRole("button", { name: /select region/i })
      .click();

    // Click the placed annotation marker
    await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.35);

    // Editor dialog should open
    const dialog = page.getByRole("dialog", { name: /edit annotation/i });
    await expect(dialog).toBeVisible();

    // Add a note
    await dialog.getByLabel(/note/i).fill("2 cm laceration");
    // Pick severity 3
    await dialog.getByRole("button", { name: /^severity 3$/i }).click();
    await dialog.getByRole("button", { name: /^save$/i }).click();
    await expect(dialog).toBeHidden();

    // Re-open editor and delete
    await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.35);
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: /^delete$/i }).click();
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
