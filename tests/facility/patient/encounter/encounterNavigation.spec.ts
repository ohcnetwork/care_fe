import { faker } from "@faker-js/faker";
import { expect, test, type Request } from "@playwright/test";
import { createQuestionnaireEncounter } from "tests/helper/questionnaire";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { getFacilityId } from "tests/support/facilityId";

import type { EncounterRead } from "@/types/emr/encounter/encounter";
import type {
  AppointmentRead,
  AppointmentStatus,
  SchedulableResourceType,
} from "@/types/scheduling/schedule";
import type { TokenStatus } from "@/types/tokens/token/token";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Encounter navigation", () => {
  test.describe.configure({ mode: "serial" });
  let patientId: string;
  let primaryEncounterId: string;
  let pastEncounterId: string;

  test.beforeAll(async ({ request }) => {
    const encounter = await createQuestionnaireEncounter(getFacilityId());
    patientId = encounter.patientId;
    primaryEncounterId = encounter.encounterId;

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const response = await request.post(`${getApiUrl()}/api/v1/encounter/`, {
      headers: getApiHeaders(),
      data: {
        patient: patientId,
        facility: getFacilityId(),
        status: "completed",
        encounter_class: "amb",
        period: { start: yesterday, end: yesterday },
        priority: "routine",
        organizations: [],
      },
    });
    expect(response.ok()).toBeTruthy();
    pastEncounterId = (await response.json()).id;
  });

  test.afterEach(async ({ page }) => {
    await page.unrouteAll({ behavior: "wait" });
  });

  for (const [layout, width] of [
    ["desktop", 1440],
    ["mobile", 390],
  ] as const) {
    test.describe(layout, () => {
      test.use({ viewport: { width, height: 900 } });

      test("keeps the chosen encounter across sections and returns to the current encounter", async ({
        page,
      }) => {
        const encounterContext = page.getByRole("region", {
          name: "Encounter",
          exact: true,
        });
        const updateEncounter = encounterContext.getByRole("link", {
          name: "Edit encounter",
          exact: true,
        });
        const historicalContext = page.getByText("Viewing another encounter", {
          exact: true,
        });
        const returnToCurrent = page.getByRole("button", {
          name: "Back to current encounter",
          exact: true,
        });
        let currentFacilityName = "";
        await page.route(
          (url) => url.pathname === `/api/v1/encounter/${primaryEncounterId}/`,
          async (route) => {
            const response = await route.fetch();
            const encounter = await response.json();
            currentFacilityName = encounter.facility.name;
            await route.fulfill({
              response,
              // The backend embeds an empty object for an encounter with
              // no appointment; it is not a complete AppointmentRead.
              json: { ...encounter, period: {}, appointment: {} },
            });
          },
        );

        await page.goto(
          `/facility/${getFacilityId()}/patient/${patientId}/encounter/${primaryEncounterId}/updates`,
        );
        await expect(
          page.getByRole("button", { name: /Encounter History/i }),
        ).toBeVisible();
        const header = page.locator("[data-cui-app-header]");
        await expect(
          header.getByText("Encounter", { exact: true }),
        ).toBeVisible();
        await expect(
          page.getByRole("group", { name: "Appointment", exact: true }),
        ).toHaveCount(0);
        await expect(historicalContext).not.toBeVisible();
        await expect(returnToCurrent).not.toBeVisible();
        await expect(updateEncounter).toBeVisible();
        expect(currentFacilityName).not.toBe("");
        await expect(
          encounterContext.getByText(currentFacilityName, { exact: true }),
        ).not.toBeVisible();
        await expect(
          encounterContext.getByRole("button", { name: /^Encounter dates:/ }),
        ).toHaveText(/\d{1,2} [A-Za-z]{3}.*Ongoing/);

        await test.step("Read encounter status and dates using the keyboard", async () => {
          await encounterContext
            .getByRole("button", { name: /^Status History:/ })
            .focus();
          await page.keyboard.press("Enter");
          const details = page.getByRole("dialog");
          await expect(
            details.getByRole("heading", { name: "Status History" }),
          ).toBeVisible();
          await expect(
            details.getByText("In Progress", { exact: true }),
          ).toBeVisible();
          await page.keyboard.press("Escape");
          await expect(details).not.toBeVisible();

          await encounterContext
            .getByRole("button", { name: /^Encounter dates:/ })
            .focus();
          await page.keyboard.press("Enter");
          await expect(
            details.getByText("Start date", { exact: true }),
          ).toBeVisible();
          await expect(
            details.getByText("Not Specified", { exact: true }),
          ).toBeVisible();
          await expect(
            details.getByText("Created Date", { exact: true }),
          ).toBeVisible();
          await expect(
            details.getByText("End date", { exact: true }),
          ).toBeVisible();
          await expect(details.getByText(/\d{1,2}:\d{2}/)).toBeVisible();
          await expect(
            details.getByText("Ongoing", { exact: true }),
          ).toBeVisible();
          await page.keyboard.press("Escape");
          await expect(details).not.toBeVisible();
        });

        await test.step("Choose the historical encounter", async () => {
          await page
            .getByRole("button", { name: /Encounter History/i })
            .click();
          const history = page.getByRole("dialog");
          await history.locator('button[aria-pressed="false"]:visible').click();
          await expect(history).not.toBeVisible();
          await expect(page).toHaveURL(
            (url) =>
              url.searchParams.get("selectedEncounter") === pastEncounterId,
          );
          await expect(historicalContext).toBeVisible();
          await expect(returnToCurrent).toBeVisible();
          await expect(updateEncounter).not.toBeVisible();
          await expect(
            encounterContext.getByText(currentFacilityName, { exact: true }),
          ).toBeVisible();
          const dates = encounterContext.getByRole("button", {
            name: /^Encounter dates:/,
          });
          await expect(dates).not.toContainText("Ongoing");
          await dates.focus();
          await page.keyboard.press("Enter");
          const details = page.getByRole("dialog");
          await expect(details.getByText(/\d{1,2}:\d{2}/)).toHaveCount(2);
          await expect(
            details.getByText("Created Date", { exact: true }),
          ).not.toBeVisible();
          await page.keyboard.press("Escape");
          await expect(details).not.toBeVisible();
        });

        await test.step("Open Notes and retain the historical encounter", async () => {
          await page.getByRole("tab", { name: "Notes" }).click();
          await expect(page).toHaveURL(
            (url) =>
              url.pathname.endsWith("/notes") &&
              url.searchParams.get("selectedEncounter") === pastEncounterId,
          );
          await expect(
            page.getByRole("tab", { name: "Notes" }),
          ).toHaveAttribute("aria-selected", "true");
          await expect(
            page.getByRole(layout === "mobile" ? "button" : "heading", {
              name: layout === "mobile" ? /^Threads/ : "Discussions",
              exact: true,
            }),
          ).toBeVisible();
        });

        await test.step("Switch sections without the former header navigation", async () => {
          const header = page.locator("[data-cui-app-header]");
          await expect(
            header.getByRole("button", { name: "Back", exact: true }),
          ).toHaveCount(0);
          await expect(
            header.getByRole("navigation", { name: "breadcrumb" }),
          ).toHaveCount(0);
          await page
            .getByRole("tab", { name: "Overview", exact: true })
            .click();
          await expect(page).toHaveURL(
            (url) =>
              url.pathname.endsWith("/updates") &&
              url.searchParams.get("selectedEncounter") === pastEncounterId,
          );
          await page.getByRole("tab", { name: "Notes", exact: true }).click();
          await expect(page).toHaveURL(
            (url) =>
              url.pathname.endsWith("/notes") &&
              url.searchParams.get("selectedEncounter") === pastEncounterId,
          );
          await expect(historicalContext).toBeVisible();
        });

        await test.step("Return to the current encounter while staying on Notes", async () => {
          await returnToCurrent.click();
          await expect(page).toHaveURL(
            (url) =>
              url.pathname.endsWith(`/encounter/${primaryEncounterId}/notes`) &&
              !url.searchParams.has("selectedEncounter"),
          );
          await expect(
            page.getByRole("tab", { name: "Notes" }),
          ).toHaveAttribute("aria-selected", "true");
          await expect(historicalContext).not.toBeVisible();
          await expect(returnToCurrent).not.toBeVisible();
          await expect(updateEncounter).toBeVisible();
        });
      });

      test("hosts appointment actions in the app header and clears them after navigation", async ({
        page,
      }) => {
        const facilityId = getFacilityId();
        const appointmentId = faker.string.uuid();
        const resourceId = faker.string.uuid();
        const tokenId = faker.string.uuid();
        const queueId = faker.string.uuid();
        const writes: Request[] = [];
        let batchResponse = Promise.resolve();
        let releaseBatchResponse: (() => void) | undefined;
        let facilityName = "";
        const planned = layout === "desktop";
        const encounterPath = `/api/v1/encounter/${primaryEncounterId}/`;

        await page.route(
          (url) => url.pathname === encounterPath,
          async (route) => {
            if (route.request().method() !== "GET") {
              writes.push(route.request());
              // Capture the frontend write boundary without changing clinical data.
              await route.fulfill({ json: {} });
              return;
            }
            const response = await route.fetch();
            const encounter: EncounterRead = await response.json();
            facilityName = encounter.facility.name;
            const appointment: AppointmentRead = {
              id: appointmentId,
              facility: encounter.facility,
              patient: encounter.patient,
              resource_type: "practitioner" as SchedulableResourceType,
              resource: { ...encounter.created_by, id: resourceId },
              status: "in_consultation" as AppointmentStatus,
              note: "Header action boundary fixture",
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
                  name: faker.word.words(2),
                  tokens_per_slot: 1,
                  schedule: {
                    id: faker.string.uuid(),
                    name: faker.word.words(2),
                  },
                },
              },
              token: planned
                ? null
                : {
                    id: tokenId,
                    number: 7,
                    note: "Token fixture",
                    status: "IN_PROGRESS" as TokenStatus,
                    category: {
                      id: faker.string.uuid(),
                      name: faker.word.words(2),
                      shorthand: "OP",
                      default: true,
                      resource_type: "practitioner" as SchedulableResourceType,
                    },
                    queue: {
                      id: queueId,
                      name: faker.word.words(2),
                      date: "2026-09-27",
                      is_primary: true,
                      system_generated: false,
                    },
                  },
            };
            await route.fulfill({
              response,
              json: {
                ...encounter,
                encounter_class: "amb",
                status: planned ? "planned" : "in_progress",
                period: { start: "2026-09-27T10:00:00Z" },
                appointment,
              },
            });
          },
        );
        await page.route("**/api/v1/batch_requests/", async (route) => {
          writes.push(route.request());
          await batchResponse;
          await route.fulfill({ json: { results: [] } });
        });

        await page.goto(
          `/facility/${facilityId}/patient/${patientId}/encounter/${primaryEncounterId}/updates`,
        );
        const header = page.locator("[data-cui-app-header]");
        const appointmentGroup = header.getByRole("group", {
          name: "Appointment",
          exact: true,
        });
        await expect(appointmentGroup).toBeVisible();
        await expect(
          page.getByRole("group", { name: "Appointment", exact: true }),
        ).toHaveCount(1);
        await expect(
          header.getByRole("button", { name: "Back", exact: true }),
        ).toHaveCount(0);
        await expect(
          header.getByRole("navigation", { name: "breadcrumb" }),
        ).toHaveCount(0);
        const actionSurface =
          layout === "mobile"
            ? page.getByRole("menu", {
                name: "More Actions",
                exact: true,
              })
            : header;
        if (layout === "mobile") {
          await test.step("Keep the mobile header on one line", async () => {
            for (const mobileWidth of [390, 320]) {
              await page.setViewportSize({ width: mobileWidth, height: 900 });
              await expect
                .poll(() =>
                  header.evaluate(
                    (element) => element.getBoundingClientRect().height,
                  ),
                )
                .toBeLessThanOrEqual(64);
              await expect
                .poll(() =>
                  header.getByRole("button").evaluateAll((buttons) => {
                    const centers = buttons.map((button) => {
                      const { y, height } = button.getBoundingClientRect();
                      return y + height / 2;
                    });
                    return centers.length
                      ? Math.max(...centers) - Math.min(...centers)
                      : Infinity;
                  }),
                )
                .toBeLessThanOrEqual(4);
            }
          });
          await header
            .getByRole("button", { name: "More Actions", exact: true })
            .click();
          await expect(actionSurface).toBeVisible();
        }
        await expect(
          actionSurface.getByRole(layout === "mobile" ? "menuitem" : "link", {
            name: planned ? "View" : "View Appointment OP-007",
            exact: true,
          }),
        ).toHaveAttribute(
          "href",
          `/facility/${facilityId}/patient/${patientId}/appointments/${appointmentId}`,
        );
        if (!planned) {
          await expect(
            actionSurface.getByRole(layout === "mobile" ? "menuitem" : "link", {
              name: "Queue",
              exact: true,
            }),
          ).toHaveAttribute(
            "href",
            `/facility/${facilityId}/practitioner/${resourceId}/queues/${queueId}`,
          );
        }
        await expect
          .poll(() =>
            page.evaluate(
              () => document.documentElement.scrollWidth - window.innerWidth,
            ),
          )
          .toBeLessThanOrEqual(0);

        if (layout === "mobile") {
          await page.keyboard.press("Escape");
          await expect(actionSurface).not.toBeVisible();
        }

        await test.step("Activate the portaled Scan control with Enter", async () => {
          await header
            .getByRole("button", { name: "Scan the QR code", exact: true })
            .focus();
          await page.keyboard.press("Enter");
          await expect(
            page.getByRole("dialog", { name: "Scan Patient QR Code" }),
          ).toBeVisible();
          expect(writes).toHaveLength(0);
          await page.keyboard.press("Escape");
          await expect(page.getByRole("dialog")).not.toBeVisible();
        });

        await test.step("Send the header action to the intended request boundary", async () => {
          if (layout === "mobile") {
            await header
              .getByRole("button", { name: "More Actions", exact: true })
              .focus();
            await page.keyboard.press("Enter");
            await expect(actionSurface).toBeVisible();
          }
          if (!planned) {
            await expect(
              actionSurface.getByRole("menuitem", {
                name: /^Close Appointment/,
              }),
            ).toBeVisible();
          }
          const action = actionSurface.getByRole(
            layout === "mobile" ? "menuitem" : "button",
            {
              name: planned ? "Start Encounter" : "Complete",
              exact: true,
            },
          );
          if (layout === "mobile") {
            batchResponse = new Promise<void>((resolve) => {
              releaseBatchResponse = resolve;
            });
          }
          try {
            await action.focus();
            await page.keyboard.press("Enter");
            await expect.poll(() => writes.length).toBe(1);
            if (layout === "mobile") {
              await expect(actionSurface).not.toBeVisible();
              await header
                .getByRole("button", { name: "More Actions", exact: true })
                .focus();
              await page.keyboard.press("Enter");
              await expect(actionSurface).toBeVisible();
              await expect(action).toBeDisabled();
              await page.keyboard.press("Escape");
              await expect(actionSurface).not.toBeVisible();
              await header
                .getByRole("button", { name: "More Actions", exact: true })
                .focus();
              await page.keyboard.press("Enter");
              await expect(actionSurface).toBeVisible();
              await expect(action).toBeDisabled();
            }
          } finally {
            releaseBatchResponse?.();
          }
          await expect(action).toBeEnabled();
          const request = writes[0];
          if (planned) {
            expect(new URL(request.url()).pathname).toBe(encounterPath);
            expect(request.method()).toBe("PUT");
            expect(request.postDataJSON()).toMatchObject({
              id: primaryEncounterId,
              status: "in_progress",
              encounter_class: "amb",
            });
          } else {
            expect(new URL(request.url()).pathname).toBe(
              "/api/v1/batch_requests/",
            );
            expect(request.method()).toBe("POST");
            const requests = request.postDataJSON().requests;
            expect(requests).toHaveLength(3);
            expect(requests).toEqual(
              expect.arrayContaining([
                expect.objectContaining({
                  url: encounterPath,
                  method: "PUT",
                  body: expect.objectContaining({ status: "completed" }),
                }),
                expect.objectContaining({
                  url: `/api/v1/facility/${facilityId}/appointments/${appointmentId}/`,
                  method: "PUT",
                  body: {
                    status: "fulfilled",
                    note: "Header action boundary fixture",
                  },
                }),
                expect.objectContaining({
                  url: `/api/v1/facility/${facilityId}/token/queue/${queueId}/token/${tokenId}/`,
                  method: "PUT",
                  body: expect.objectContaining({
                    status: "FULFILLED",
                    sub_queue: null,
                    note: "Token fixture",
                  }),
                }),
              ]),
            );
          }
        });

        await test.step("Open appointments and release the page header", async () => {
          const list = actionSurface.getByRole(
            layout === "mobile" ? "menuitem" : "link",
            {
              name: layout === "mobile" ? "Appointments" : "List",
              exact: true,
            },
          );
          await expect(list).toHaveAttribute(
            "href",
            `/facility/${facilityId}/appointments?practitioners=${resourceId}&date_from=2026-09-27&date_to=2026-09-27`,
          );
          await list.focus();
          await page.keyboard.press("Enter");
          await expect(page).toHaveURL(
            (url) => url.pathname === `/facility/${facilityId}/appointments`,
          );
          await expect(
            page.getByRole("group", { name: "Appointment", exact: true }),
          ).toHaveCount(0);
          await expect(
            header.getByRole("group", {
              name: "Encounter Actions",
              exact: true,
            }),
          ).toHaveCount(0);
          await expect(
            header.getByText(facilityName, { exact: true }),
          ).toBeVisible();
        });
      });
    });
  }
});
