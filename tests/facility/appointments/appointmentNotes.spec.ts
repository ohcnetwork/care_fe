import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { createAppointmentViaApi } from "tests/helper/appointment";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test(
  "appointment notes keep typed letters and save and render Markdown",
  { tag: ["@atomic", "@cap:appointment.note.create"] },
  async ({ page, request }) => {
    const facilityId = getFacilityId();
    const { appointmentId, patientId } = await createAppointmentViaApi({
      request,
      facilityId,
      scheduleName: `Markdown notes ${faker.string.alphanumeric(8)}`,
      sessionName: "Notes session",
      reason: "Notes regression",
      startTime: "01:00:00",
      endTime: "01:30:00",
      patientName: "Appointment Markdown",
    });
    await page.goto(
      `/facility/${facilityId}/patient/${patientId}/appointments/${appointmentId}`,
    );
    await page.getByRole("button", { name: "Actions", exact: true }).click();
    await page
      .getByRole("menuitem", { name: "Cancel Appointment", exact: true })
      .click();
    const dialog = page.getByRole("alertdialog");
    const editor = dialog.getByRole("textbox");
    await expect(editor).toBeEditable();
    await editor.pressSequentially("Care abcdefghijklmnopqrstuvwxyz");
    await expect
      .poll(() =>
        editor.evaluate((element) =>
          element instanceof HTMLTextAreaElement
            ? element.value
            : element.textContent,
        ),
      )
      .toBe("Care abcdefghijklmnopqrstuvwxyz");
    await editor.press("ControlOrMeta+a");
    await editor.press("ControlOrMeta+b");
    const saved = page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        new URL(response.url()).pathname ===
          `/api/v1/facility/${facilityId}/appointments/${appointmentId}/cancel/`,
    );
    await dialog.getByRole("button", { name: "Confirm", exact: true }).click();
    const response = await saved;
    expect(response.ok(), await response.text()).toBe(true);
    await page.reload();
    await expect(
      page
        .locator("strong")
        .filter({ hasText: "Care abcdefghijklmnopqrstuvwxyz" }),
    ).toBeVisible();
  },
);
