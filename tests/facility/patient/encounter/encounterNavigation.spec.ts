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
        const historicalContext = page.getByText("Viewing another encounter", {
          exact: true,
        });
        const returnToCurrent = page.getByRole("button", {
          name: "Back to current encounter",
          exact: true,
        });

        await page.goto(
          `/facility/${getFacilityId()}/patient/${patientId}/encounter/${primaryEncounterId}/updates`,
        );
        await expect(
          page.getByRole("button", { name: /Encounter History/i }),
        ).toBeVisible();
        await expect(historicalContext).not.toBeVisible();
        await expect(returnToCurrent).not.toBeVisible();

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
        });
      });
    });
  }
});
