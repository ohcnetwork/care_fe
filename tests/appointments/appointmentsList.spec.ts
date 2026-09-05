import { expect, test } from "@playwright/test";
import { addDays, format } from "date-fns";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

import { createAppointmentViaApi, getCurrentUser } from "./helpers";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Appointments List Page", () => {
  let facilityId: string;
  let practitionerId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    practitionerId = (await getCurrentUser()).id;
    const today = format(new Date(), "yyyy-MM-dd");

    await page.goto(
      `/facility/${facilityId}/appointments?practitioners=${practitionerId}&date_from=${today}&date_to=${today}`,
    );
  });

  test("should display appointments page with board and list views", async ({
    page,
  }) => {
    await test.step("Verify page title and view tabs", async () => {
      await expect(
        page.getByRole("heading", { name: /appointments/i }),
      ).toBeVisible();
      await expect(page.getByRole("tab", { name: /board/i })).toBeVisible();
      await expect(page.getByRole("tab", { name: /list/i })).toBeVisible();
    });

    await test.step("Verify board status columns", async () => {
      await expect(
        page.getByRole("heading", { name: /booked/i }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: /checked-in/i }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: /in consultation/i }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: /fulfilled/i }),
      ).toBeVisible();
    });
  });

  test("should switch between board and list views", async ({ page }) => {
    await page.getByRole("tab", { name: /list/i }).click();
    await expect(page.getByRole("tab", { name: /list/i })).toHaveAttribute(
      "data-state",
      "active",
    );

    // List view exposes desktop status tabs
    await expect(
      page.getByRole("tab", { name: /booked/i }).first(),
    ).toBeVisible();

    await page.getByRole("tab", { name: /board/i }).click();
    await expect(page.getByRole("tab", { name: /board/i })).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  test("should toggle auto-refresh and persist it in the URL", async ({
    page,
  }) => {
    const autoRefresh = page.getByLabel(/auto refresh/i);
    await expect(autoRefresh).toBeVisible();

    const initialChecked = await autoRefresh.isChecked();
    await autoRefresh.click();
    await expect(autoRefresh).toHaveAttribute(
      "data-state",
      initialChecked ? "unchecked" : "checked",
    );
    await expect(page).toHaveURL(/autoRefresh=(true|false)/);
  });

  test("should show empty state when no appointments match filters", async ({
    page,
  }) => {
    const farFuture = format(addDays(new Date(), 120), "yyyy-MM-dd");
    await page.goto(
      `/facility/${facilityId}/appointments?practitioners=${practitionerId}&date_from=${farFuture}&date_to=${farFuture}`,
    );

    await expect(page.getByText(/no appointments found/i).first()).toBeVisible({
      timeout: 15000,
    });
  });

  test("should display a booked appointment on the board and open detail", async ({
    page,
  }) => {
    const patientId = getPatientId();
    const appointment = await createAppointmentViaApi({
      facilityId,
      patientId,
      practitionerId,
    });

    const today = format(new Date(), "yyyy-MM-dd");
    await page.goto(
      `/facility/${facilityId}/appointments?practitioners=${practitionerId}&date_from=${today}&date_to=${today}`,
    );

    await test.step("Find appointment card in booked column", async () => {
      const appointmentLink = page
        .locator(`a[href*="/appointments/${appointment.id}"]`)
        .first();
      await expect(appointmentLink).toBeVisible({ timeout: 20000 });
      await appointmentLink.click();
    });

    await test.step("Verify navigation to detail page", async () => {
      await expect(page).toHaveURL(
        new RegExp(`/appointments/${appointment.id}`),
      );
      await expect(page.getByText(/appointment details/i)).toBeVisible();
    });
  });

  test("should enable print from list view for a valid date range", async ({
    page,
  }) => {
    await page.getByRole("tab", { name: /list/i }).click();

    const printButton = page.getByRole("button", { name: /print/i });
    await expect(printButton).toBeVisible();
    await expect(printButton).toBeEnabled();

    await printButton.click();
    await expect(page).toHaveURL(/\/appointments\/print/);
  });
});
