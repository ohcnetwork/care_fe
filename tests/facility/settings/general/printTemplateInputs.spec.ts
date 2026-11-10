import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test("should allow typing in print templates opened from configurations", async ({
  page,
}) => {
  await page.goto(`/facility/${getFacilityId()}/settings/general`);
  await page
    .getByRole("button", { name: "Configurations", exact: true })
    .click();
  await page
    .getByRole("menuitem", { name: "Print Templates", exact: true })
    .click();
  await expect(page.getByRole("menu")).toHaveCount(0);
  const sheet = page.getByRole("dialog", {
    name: "Print Templates",
    exact: true,
  });
  const pageSettings = sheet.getByRole("button", {
    name: "Page Settings",
    exact: true,
  });
  const originalCount = await pageSettings.count();
  await sheet.getByRole("button", { name: "Add Print Template" }).click();
  await sheet
    .getByRole("button", { name: "Page Settings", exact: true })
    .last()
    .click();
  const margin = sheet.getByRole("spinbutton").nth(-4);
  await margin.pressSequentially("12.5");
  await expect(margin).toHaveValue("12.5");
  await sheet
    .getByRole("button", { name: "Branding", exact: true })
    .last()
    .click();
  const logoUrl = sheet
    .getByPlaceholder("https://...", { exact: true })
    .nth(-3);
  await logoUrl.pressSequentially("https://example.com/logo.png");
  await expect(logoUrl).toHaveValue("https://example.com/logo.png");
  await sheet.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(sheet).not.toBeVisible();

  await page
    .getByRole("button", { name: "Configurations", exact: true })
    .click();
  await page
    .getByRole("menuitem", { name: "Print Templates", exact: true })
    .click();
  await expect(pageSettings).toHaveCount(originalCount);
  await sheet.getByRole("button", { name: "Cancel", exact: true }).click();
});
