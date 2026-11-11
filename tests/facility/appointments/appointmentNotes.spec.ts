import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { addDays, format } from "date-fns";
import { createTestPatient } from "tests/helper/patient";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test("appointment notes keep typed letters and save and render Markdown", async ({
  page,
  request,
}) => {
  const facilityId = getFacilityId();
  const headers = getApiHeaders();
  const api = getApiUrl();
  const currentUser = await request.get(`${api}/api/v1/users/getcurrentuser/`, {
    headers,
  });
  expect(currentUser.ok()).toBe(true);
  const user = (await currentUser.json()) as { id: string };
  const day = format(addDays(new Date(), 2), "yyyy-MM-dd");
  const scheduleResponse = await request.post(
    `${api}/api/v1/facility/${facilityId}/schedule/`,
    {
      headers,
      data: {
        name: `Markdown notes ${faker.string.alphanumeric(8)}`,
        resource_type: "practitioner",
        resource_id: user.id,
        is_public: false,
        valid_from: `${day}T00:00:00`,
        valid_to: `${day}T23:59:59`,
        availabilities: [
          {
            name: "Notes session",
            slot_type: "appointment",
            slot_size_in_minutes: 15,
            tokens_per_slot: 10,
            reason: "Notes regression",
            availability: Array.from({ length: 7 }, (_, day_of_week) => ({
              day_of_week,
              start_time: "01:00:00",
              end_time: "01:30:00",
            })),
          },
        ],
      },
    },
  );
  expect(scheduleResponse.ok(), await scheduleResponse.text()).toBe(true);
  const schedule = (await scheduleResponse.json()) as { id: string };
  const slotsResponse = await request.post(
    `${api}/api/v1/facility/${facilityId}/slots/get_slots_for_day/`,
    {
      headers,
      data: { resource_type: "practitioner", resource_id: user.id, day },
    },
  );
  expect(slotsResponse.ok(), await slotsResponse.text()).toBe(true);
  const slots = (await slotsResponse.json()) as {
    results: { id: string; availability: { schedule: { id: string } } }[];
  };
  const slot = slots.results.find(
    (item) => item.availability.schedule.id === schedule.id,
  );
  expect(slot).toBeDefined();
  const patientId = await createTestPatient("Appointment Markdown");
  const created = await request.post(
    `${api}/api/v1/facility/${facilityId}/slots/${slot!.id}/create_appointment/`,
    { headers, data: { patient: patientId, note: "", tags: [] } },
  );
  expect(created.ok(), await created.text()).toBe(true);
  const appointment = (await created.json()) as { id: string };
  await page.goto(
    `/facility/${facilityId}/patient/${patientId}/appointments/${appointment.id}`,
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
      response.url().endsWith("/api/v1/batch_requests/") &&
      response.request().postData()?.includes(appointment.id),
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
});
