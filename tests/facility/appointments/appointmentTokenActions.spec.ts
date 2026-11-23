import { faker } from "@faker-js/faker";
import { expect, test, type APIRequestContext } from "@playwright/test";

import { createAppointmentViaApi } from "tests/helper/appointment";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { getFacilityId } from "tests/support/facilityId";

import type { TokenRead } from "@/types/tokens/token/token";

test.use({ storageState: "tests/.auth/user.json" });

async function createAppointmentWithToken(request: APIRequestContext) {
  const facilityId = getFacilityId();
  const headers = getApiHeaders();
  const api = getApiUrl();
  const { appointmentId, path } = await createAppointmentViaApi({
    request,
    facilityId,
    scheduleName: `Token actions ${faker.string.alphanumeric(8)}`,
    sessionName: "Token session",
    reason: "Token actions regression",
    startTime: "02:00:00",
    endTime: "02:30:00",
    patientName: "Appointment token",
  });
  const appointmentUrl = `${api}/api/v1/facility/${facilityId}/appointments/${appointmentId}/`;
  const categoryResponse = await request.get(
    `${api}/api/v1/facility/${facilityId}/token/category/?resource_type=practitioner`,
    { headers },
  );
  expect(categoryResponse.ok()).toBe(true);
  const categories = (await categoryResponse.json()) as {
    results: { id: string }[];
  };
  let categoryId = categories.results[0]?.id;
  if (!categoryId) {
    const category = await request.post(
      `${api}/api/v1/facility/${facilityId}/token/category/`,
      {
        headers,
        data: {
          name: `Token actions ${faker.string.alphanumeric(8)}`,
          shorthand: faker.string.alpha(5),
          resource_type: "practitioner",
        },
      },
    );
    expect(category.ok(), await category.text()).toBe(true);
    categoryId = ((await category.json()) as { id: string }).id;
  }
  const generated = await request.post(`${appointmentUrl}generate_token/`, {
    headers,
    data: {
      category: categoryId,
      note: `Preserve token note ${faker.string.alphanumeric(8)}`,
    },
  });
  expect(generated.ok(), await generated.text()).toBe(true);
  const token = (await generated.json()) as TokenRead;
  return {
    facilityId,
    headers,
    token,
    appointmentUrl,
    tokenUrl: `${api}/api/v1/facility/${facilityId}/token/queue/${token.queue.id}/token/${token.id}/`,
    path,
  };
}

test(
  "cancel an appointment token from its menu and refresh its status without cancelling the appointment",
  { tag: ["@atomic", "@cap:appointment.token.cancel"] },
  async ({ page, request }) => {
    const fixture = await createAppointmentWithToken(request);
    await page.goto(fixture.path);
    const actions = page.getByRole("button", {
      name: "Token actions",
      exact: true,
    });
    await expect(actions).toBeVisible();

    await test.step("The action stays out of printed tokens", async () => {
      await page.emulateMedia({ media: "print" });
      await expect(actions).toBeHidden();
      await page.emulateMedia({ media: "screen" });
    });

    await test.step("Dismissing confirmation leaves the token active", async () => {
      await actions.click();
      await page
        .getByRole("menuitem", { name: "Cancel Token", exact: true })
        .click();
      await page
        .getByRole("alertdialog")
        .getByRole("button", { name: "Cancel", exact: true })
        .click();
      const response = await request.get(fixture.tokenUrl, {
        headers: fixture.headers,
      });
      expect((await response.json()).status).toBe("CREATED");
    });

    await test.step("Confirming cancels the token and refreshes the visible appointment", async () => {
      await actions.click();
      await page
        .getByRole("menuitem", { name: "Cancel Token", exact: true })
        .click();
      await page
        .getByRole("alertdialog")
        .getByRole("button", { name: /^Cancel Token/ })
        .click();
      await expect(
        page.getByRole("status", { name: "Token status", exact: true }),
      ).toHaveText("Cancelled");
      await expect(actions).toHaveCount(0);

      const response = await request.get(fixture.tokenUrl, {
        headers: fixture.headers,
      });
      expect(await response.json()).toMatchObject({
        status: "CANCELLED",
        note: fixture.token.note,
      });
      const booking = await request.get(fixture.appointmentUrl, {
        headers: fixture.headers,
      });
      expect((await booking.json()).status).toBe("booked");
      await page.reload();
      await expect(
        page.getByRole("status", { name: "Token status", exact: true }),
      ).toHaveText("Cancelled");
      await expect(
        page.getByText("Appointment Booked", { exact: true }),
      ).toBeVisible();
    });
  },
);

test(
  "read-only users have no cancel action and terminal token states remain visible",
  { tag: ["@atomic", "@cap:appointment.token.cancel"] },
  async ({ page, request }) => {
    const fixture = await createAppointmentWithToken(request);
    await page.route("**/api/v1/users/getcurrentuser/", async (route) => {
      const response = await route.fetch();
      const user = await response.json();
      await route.fulfill({ json: { ...user, is_superuser: false } });
    });
    await page.route(
      `**/api/v1/facility/${fixture.facilityId}/`,
      async (route) => {
        const response = await route.fetch();
        const facility = (await response.json()) as { permissions: string[] };
        await route.fulfill({
          json: {
            ...facility,
            permissions: facility.permissions.filter(
              (permission) => permission !== "can_write_token",
            ),
          },
        });
      },
    );
    await page.goto(fixture.path);
    await expect(
      page.getByText("Appointment Booked", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Token actions", exact: true }),
    ).toHaveCount(0);

    for (const [status, label] of [
      ["CANCELLED", "Cancelled"],
      ["ENTERED_IN_ERROR", "Entered in Error"],
      ["FULFILLED", "Fulfilled"],
    ]) {
      const response = await request.put(fixture.tokenUrl, {
        headers: fixture.headers,
        data: { status, note: fixture.token.note, sub_queue: null },
      });
      expect(response.ok(), await response.text()).toBe(true);
      await page.reload();
      await expect(
        page.getByRole("status", { name: "Token status", exact: true }),
      ).toHaveText(label);
      await expect(
        page.getByRole("button", { name: "Token actions", exact: true }),
      ).toHaveCount(0);
    }
  },
);
