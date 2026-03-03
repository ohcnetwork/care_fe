import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

// verify keyboard movement and Enter key selection on public booking calendar

test.describe("public calendar keyboard", () => {
  test("arrow navigation and Enter select date", async ({ page }) => {
    const facilityId = getFacilityId();
    const staffId = "1"; // adjust to match seeded data if necessary

    // stub out API calls so calendar renders quickly
    await page.route("**/otp/slots/get_create_appointment_heatmap/**", (r) =>
      r.fulfill({ status: 200, body: "{}" }),
    );
    await page.route("**/otp/slots/get_slots_for_day/**", (r) =>
      r.fulfill({ status: 200, body: "[]" }),
    );

    await page.goto(
      `/facility/${facilityId}/appointments/${staffId}/book-appointment`,
    );

    // focus first available day and move right, then press Enter
    await page.locator("button").first().focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Enter");

    // focus should be on a button with aria-selected="true"
    await expect(page.locator("button:focus")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});
