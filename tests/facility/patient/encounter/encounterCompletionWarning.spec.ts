import type { EncounterRead } from "@/types/emr/encounter/encounter";
import type {
  AppointmentRead,
  AppointmentStatus,
  SchedulableResourceType,
} from "@/types/scheduling/schedule";
import type { TokenStatus } from "@/types/tokens/token/token";
import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { createQuestionnaireEncounter } from "tests/helper/questionnaire";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Encounter completion warning", () => {
  async function openEncounter(
    page: import("@playwright/test").Page,
    appointmentStatus?: AppointmentStatus,
    includeToken = false,
  ): Promise<import("@playwright/test").Locator> {
    const facilityId = getFacilityId();
    const { patientId, encounterId } =
      await createQuestionnaireEncounter(facilityId);

    if (appointmentStatus) {
      await page.route(
        (url) => url.pathname === `/api/v1/encounter/${encounterId}/`,
        async (route) => {
          if (route.request().method() !== "GET") {
            await route.continue();
            return;
          }

          const response = await route.fetch();
          const encounter: EncounterRead = await response.json();

          const appointment: AppointmentRead = {
            id: faker.string.uuid(),
            facility: encounter.facility,
            patient: encounter.patient,
            resource_type:
              "practitioner" as SchedulableResourceType.Practitioner,
            resource: {
              ...encounter.created_by,
              id: faker.string.uuid(),
            },
            status: appointmentStatus,
            note: "Completion warning test fixture",
            tags: [],
            booked_on: "2026-09-27T10:00:00Z",
            booked_by: encounter.created_by,
            created_by: encounter.created_by,
            updated_by: encounter.created_by,
            modified_date: "2026-09-27T10:00:00Z",
            token_slot: {
              id: faker.string.uuid(),
              start_datetime: "2026-09-27T10:00:00Z",
              end_datetime: "2026-09-27T10:30:00Z",
              allocated: 1,
              availability: {
                name: "Test availability",
                tokens_per_slot: 1,
                schedule: {
                  id: faker.string.uuid(),
                  name: "Test schedule",
                },
              },
            },
            token: includeToken
              ? {
                  id: faker.string.uuid(),
                  number: 7,
                  note: "Completion warning token fixture",
                  status: "IN_PROGRESS" as TokenStatus,
                  category: {
                    id: faker.string.uuid(),
                    name: "General",
                    shorthand: "OP",
                    default: true,
                    resource_type:
                      "practitioner" as SchedulableResourceType.Practitioner,
                  },
                  queue: {
                    id: faker.string.uuid(),
                    name: "Test queue",
                    date: "2026-09-27",
                    is_primary: true,
                    system_generated: false,
                  },
                }
              : null,
          };

          await route.fulfill({
            response,
            json: {
              ...encounter,
              appointment,
            },
          });
        },
      );
    }

    await page.goto(
      `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/updates`,
    );

    await page
      .getByRole("button", { name: "Mark as Completed" })
      .evaluate((element: HTMLButtonElement) => element.click());

    return page.getByRole("alertdialog", {
      name: "Mark as Complete",
    });
  }

  test("does not show a warning when the encounter has no appointment", async ({
    page,
  }) => {
    const dialog = await openEncounter(page);

    await expect(dialog).toBeVisible();

    await expect(
      dialog.getByText("This action will close the Appointment and Encounter", {
        exact: true,
      }),
    ).toHaveCount(0);

    await expect(
      dialog.getByText(
        "This action will close the Appointment, Token and Encounter",
        { exact: true },
      ),
    ).toHaveCount(0);

    await expect(
      dialog.getByText("This action will close the Token and Encounter", {
        exact: true,
      }),
    ).toHaveCount(0);
  });

  test("shows the appointment warning when an active appointment is linked", async ({
    page,
  }) => {
    const dialog = await openEncounter(
      page,
      "in_consultation" as AppointmentStatus.IN_CONSULTATION,
    );

    await expect(dialog).toBeVisible();

    await expect(
      dialog.getByText("This action will close the Appointment and Encounter", {
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      dialog.getByText(
        "This action will close the Appointment, Token and Encounter",
        { exact: true },
      ),
    ).toHaveCount(0);
  });

  test("shows the combined warning when an active appointment and token are linked", async ({
    page,
  }) => {
    const dialog = await openEncounter(
      page,
      "in_consultation" as AppointmentStatus.IN_CONSULTATION,
      true,
    );

    await expect(dialog).toBeVisible();

    await expect(
      dialog.getByText(
        "This action will close the Appointment, Token and Encounter",
        { exact: true },
      ),
    ).toBeVisible();

    await expect(
      dialog.getByText("This action will close the Appointment and Encounter", {
        exact: true,
      }),
    ).toHaveCount(0);
  });

  test("does not show a warning when the linked appointment is already fulfilled", async ({
    page,
  }) => {
    const dialog = await openEncounter(
      page,
      "fulfilled" as AppointmentStatus.FULFILLED,
    );

    await expect(dialog).toBeVisible();

    await expect(
      dialog.getByText("This action will close the Appointment and Encounter", {
        exact: true,
      }),
    ).toHaveCount(0);

    await expect(
      dialog.getByText(
        "This action will close the Appointment, Token and Encounter",
        { exact: true },
      ),
    ).toHaveCount(0);

    await expect(
      dialog.getByText("This action will close the Token and Encounter", {
        exact: true,
      }),
    ).toHaveCount(0);
  });
});
