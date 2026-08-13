import { expect, type Page } from "@playwright/test";
import { selectFirstAvailablePractitioner } from "tests/helper/ui";

/**
 * Books an appointment for the patient shown on the current page and returns the
 * created appointment's id once the detail page has loaded.
 *
 * Mirrors the user flow: open the booking sheet, pick a practitioner, add a
 * reason, choose the first bookable day, and confirm. The slot picker
 * auto-selects the first free slot for the chosen day, which reveals the confirm
 * action.
 */
export async function bookAppointment(
  page: Page,
  reason: string,
): Promise<string> {
  await page.getByRole("button", { name: "Schedule Appointment" }).click();

  const sheet = page.getByRole("dialog", { name: "Book Appointment" });
  await expect(sheet).toBeVisible();

  await selectFirstAvailablePractitioner(page, sheet);

  await sheet.getByPlaceholder("Type the reason for visit").fill(reason);

  // Pick the first bookable day. Bookable days are the enabled calendar-day
  // buttons; disabled days render with the `disabled` attribute. We identify
  // day cells as buttons whose text starts with the day number and — unlike the
  // HH:mm slot buttons — contain no colon. We deliberately don't key off the
  // "N left" token text: it's only rendered when the schedule has token limits
  // (finite tokensLeft), so a limitless schedule would render a bookable day
  // without it.
  await sheet
    .locator("button:not([disabled])")
    .filter({ hasText: /^\d/ })
    .filter({ hasNotText: ":" })
    .first()
    .click();

  const confirm = sheet.getByRole("button", { name: "Confirm Appointment" });
  await expect(confirm).toBeEnabled();

  // Assert the create call succeeds so a rejected booking (e.g. a slot taken by
  // a racing test) fails here with a clear status rather than a waitForURL
  // timeout.
  const [response] = await Promise.all([
    page.waitForResponse(
      (r) =>
        r.url().includes("/create_appointment/") &&
        r.request().method() === "POST",
    ),
    confirm.click(),
  ]);
  expect(response.status()).toBeLessThan(300);

  await page.waitForURL(/\/appointments\/[a-f0-9-]+/);
  await expect(
    page.getByRole("heading", { name: "Appointment Details" }),
  ).toBeVisible();

  return page.url().match(/appointments\/([a-f0-9-]+)/)?.[1] ?? "";
}
