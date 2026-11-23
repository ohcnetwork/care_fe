import { faker } from "@faker-js/faker";
import { addDays } from "date-fns";

import {
  bookAppointmentViaUi,
  createBookableServiceViaApi,
} from "tests/helper/appointment";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { expect, test } from "tests/support/test";

test.use({ storageState: "tests/.auth/user.json" });

test(
  "an appointment booked with a healthcare service becomes the patient's planned encounter",
  { tag: ["@workflow", "@cap:workflow.appointment-to-encounter"] },
  async ({ page, request, facilityId, isolatedPatient }) => {
    test.slow();

    const { patientId } = isolatedPatient;
    const reason = `Workflow visit ${faker.string.alphanumeric(8)}`;
    const service = await createBookableServiceViaApi({ request, facilityId });

    // The browser and backend can be on different calendar dates, so book a
    // day well inside the schedule rather than today.
    const { appointmentId } = await bookAppointmentViaUi(page, {
      facilityId,
      patientId,
      resourceType: "Healthcare Service",
      resourceName: service.serviceName,
      date: addDays(service.validFrom, 2),
      reason,
    });

    // No step function creates an encounter from an appointment yet; this
    // mirrors the "Create Planned Encounter" quick action of
    // tests/facility/appointments/scheduleEncounterType.spec.ts on a real backend.
    const encounterId =
      await test.step("appointment.encounter.create", async () => {
        await expect(page.getByText(reason, { exact: true })).toBeVisible();
        await page
          .getByRole("button", { name: /create planned encounter/i })
          .click();
        const sheet = page.getByRole("dialog", {
          name: "Initiate Patient Encounter",
          exact: true,
        });
        await expect(sheet).toBeVisible();
        await expect(
          sheet.getByRole("combobox", { name: "Status", exact: true }),
        ).toContainText("Planned");
        // The seeded service schedule has no encounter type, so the sheet
        // preselects no class and blocks submit with "Required".
        const ambulatory = sheet.getByRole("button", { name: /^Ambulatory\b/ });
        await ambulatory.click();
        await expect(ambulatory).toHaveAttribute("aria-pressed", "true");
        const created = page.waitForResponse(
          (response) =>
            response.request().method() === "POST" &&
            new URL(response.url()).pathname === "/api/v1/encounter/",
        );
        await sheet.getByRole("button", { name: /^Create Encounter/ }).click();
        const response = await created;
        expect(response.ok(), await response.text()).toBe(true);
        const { id } = (await response.json()) as { id: string };
        await expect(
          page.getByText("Encounter created successfully"),
        ).toBeVisible();
        await expect(sheet).toBeHidden();
        return id;
      });

    await test.step("The appointment links to the patient's planned encounter", async () => {
      const headers = getApiHeaders();
      const appointmentResponse = await request.get(
        `${getApiUrl()}/api/v1/facility/${facilityId}/appointments/${appointmentId}/`,
        { headers },
      );
      expect(appointmentResponse.ok(), await appointmentResponse.text()).toBe(
        true,
      );
      expect(await appointmentResponse.json()).toMatchObject({
        patient: { id: patientId },
        note: reason,
        associated_encounter: { id: encounterId },
      });

      const encounterResponse = await request.get(
        `${getApiUrl()}/api/v1/encounter/${encounterId}/`,
        { headers },
      );
      expect(encounterResponse.ok(), await encounterResponse.text()).toBe(true);
      expect(await encounterResponse.json()).toMatchObject({
        patient: { id: patientId },
        facility: { id: facilityId },
        appointment: { id: appointmentId },
        status: "planned",
      });
    });

    await test.step("The appointment page opens the encounter", async () => {
      await page
        .getByRole("button", { name: "View Encounter", exact: true })
        .click();
      await expect(page).toHaveURL(
        (url) =>
          url.pathname ===
          `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/updates`,
      );
      await expect(
        page
          .getByRole("region", { name: "Encounter", exact: true })
          .getByRole("button", {
            name: "Status History: Planned",
            exact: true,
          }),
      ).toBeVisible();
    });
  },
);
