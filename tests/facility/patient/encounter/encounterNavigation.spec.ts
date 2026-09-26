import { expect, test } from "@playwright/test";
import { createQuestionnaireEncounter } from "tests/helper/questionnaire";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { getFacilityId } from "tests/support/facilityId";

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
          `**/api/v1/encounter/${primaryEncounterId}/`,
          async (route) => {
            const response = await route.fetch();
            const encounter = await response.json();
            currentFacilityName = encounter.facility.name;
            await route.fulfill({
              response,
              json: { ...encounter, period: {} },
            });
          },
        );

        await page.goto(
          `/facility/${getFacilityId()}/patient/${patientId}/encounter/${primaryEncounterId}/updates`,
        );
        await expect(
          page.getByRole("button", { name: /Encounter History/i }),
        ).toBeVisible();
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

        await test.step("Use header navigation without changing the historical encounter", async () => {
          const back = page.getByRole("button", {
            name: "Back",
            exact: true,
          });

          if (layout === "desktop") {
            await page
              .getByRole("navigation", { name: "breadcrumb" })
              .getByRole("link", { name: "Encounter", exact: true })
              .focus();
          } else {
            await back.focus();
          }
          await page.keyboard.press("Enter");
          await expect(page).toHaveURL(
            (url) =>
              url.pathname.endsWith("/updates") &&
              url.searchParams.get("selectedEncounter") === pastEncounterId,
          );

          if (layout === "desktop") {
            await back.focus();
            await page.keyboard.press("Enter");
          } else {
            await page.getByRole("tab", { name: "Notes" }).click();
          }
          await expect(page).toHaveURL(
            (url) =>
              url.pathname.endsWith("/notes") &&
              url.searchParams.get("selectedEncounter") === pastEncounterId,
          );
          await expect(
            page.getByRole("tab", { name: "Notes" }),
          ).toHaveAttribute("aria-selected", "true");
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
    });
  }
});
