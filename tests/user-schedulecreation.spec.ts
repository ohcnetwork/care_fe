import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // Login and navigation setup
  await page.goto("/");
  await page.getByRole("button", { name: "Log in as Staff" }).click();
  await page.getByRole("textbox", { name: "Username" }).fill("admin");
  await page.getByRole("textbox", { name: "Password" }).fill("admin");
  await page.getByRole("button", { name: "Login" }).click();
  await page
    .getByRole("tabpanel", { name: /View facility details/i })
    .first()
    .click();
  await page.getByRole("button", { name: "Toggle Sidebar" }).click();
  await page.getByRole("button", { name: /admin/i }).click();
  await page.getByRole("menuitem", { name: "Profile" }).click();
  await page.locator("html").click();
  await page.getByRole("link", { name: "Availability" }).click();
});

test("user can create a schedule template with weekdays", async ({ page }) => {
  // Start template creation
  await page.getByRole("button", { name: "Create Template" }).click();

  // Fill template name
  await page
    .getByRole("textbox", { name: "Template Name *" })
    .fill("OP Consultation");

  // Select 'Valid From' as tomorrow
  // Verify 'Valid From' label is present and required before clicking 'Pick a date'
  await page
    .locator("div")
    .filter({ hasText: /^Valid FromPick a date$/ })
    .getByRole("button")
    .click();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  await page
    .getByRole("button", { name: new RegExp(tomorrowStr, "i") })
    .click();

  // Select weekdays (Mon-Fri)
  const formItemDiv = page.locator('div[data-slot="form-item"]');
  for (const day of ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]) {
    await formItemDiv.getByRole("button", { name: day }).click();
  }

  // Select 'Valid Till' as one month from now
  await page
    .locator("div")
    .filter({ hasText: /^Valid TillPick a date$/ })
    .getByRole("button")
    .click();
  const nextMonthBtn = page.getByRole("button", {
    name: "Go to the Next Month",
  });
  await expect(nextMonthBtn).toBeVisible();
  await nextMonthBtn.click({ force: true });
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const nextMonthStr = nextMonth.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  await page
    .getByRole("button", { name: new RegExp(nextMonthStr, "i") })
    .click();

  // Fill session details
  await page.getByRole("textbox", { name: "Session Title *" }).fill("IP Round");
  await page.getByRole("textbox", { name: "Start Time *" }).fill("10:00");
  await page.getByRole("textbox", { name: "End Time *" }).fill("15:00");
  await page.getByRole("switch", { name: "Auto-fill slot duration" }).click();
  await page
    .getByRole("spinbutton", { name: "Patients per Slot *" })
    .fill("300");

  // Save the template
  await page.getByRole("button", { name: "Save" }).click();

  // Assert that the schedule text is present anywhere on the page
  await expect(
    page.getByText("Scheduled for: Mon, Tue, Wed, Thu, Fri").count(),
  ).resolves.toBeGreaterThan(0);
});
