import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

// verify keyboard movement and Enter/Space key selection on public booking calendar

test.describe("public calendar keyboard", () => {
  test("arrow navigation and Enter select date", async ({ page }) => {
    const facilityId = getFacilityId();
    // TODO: Extract to test fixture or environment variable for better determinism
    const staffId = "1";

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

    // focus first available calendar day (not past)
    const firstCalendarDay = page
      .locator("button[role=\"gridcell\"]:not([aria-disabled=\"true\"])")
      .first();
    await firstCalendarDay.focus();
    const initialTitle = await firstCalendarDay.getAttribute("title");

    // navigate right and verify focus moves to a different cell
    await page.keyboard.press("ArrowRight");
    const focusedCalendarDay = page.locator("button[role=\"gridcell\"]:focus");
    await expect(focusedCalendarDay).not.toHaveAttribute(
      "title",
      initialTitle ?? "",
    );

    // press Enter and verify date is selected
    await page.keyboard.press("Enter");
    await expect(focusedCalendarDay).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("arrow navigation and Space select date", async ({ page }) => {
    const facilityId = getFacilityId();
    const staffId = "1";

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

    // focus first available calendar day
    const firstCalendarDay = page
      .locator("button[role=\"gridcell\"]:not([aria-disabled=\"true\"])")
      .first();
    await firstCalendarDay.focus();
    const initialTitle = await firstCalendarDay.getAttribute("title");

    // navigate left and verify focus moves
    await page.keyboard.press("ArrowLeft");
    const focusedCalendarDay = page.locator("button[role=\"gridcell\"]:focus");
    await expect(focusedCalendarDay).not.toHaveAttribute(
      "title",
      initialTitle ?? "",
    );

    // press Space and verify date is selected
    await page.keyboard.press(" ");
    await expect(focusedCalendarDay).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});
