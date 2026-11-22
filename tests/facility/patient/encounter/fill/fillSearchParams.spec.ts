import { expect, test } from "@playwright/test";

import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

// The fill page reads its query string with a typed search schema
// (`questionnaireFillSearch` in `src/lib/router/search/questionnaire.ts`).

test.describe("Questionnaire fill search params", () => {
  let encounterPath: string;

  test.beforeAll(() => {
    encounterPath = `/facility/${getFacilityId()}/patient/${getPatientId()}/encounter/${getEncounterId()}`;
  });

  const pickerUrl = (returnPage: string) =>
    `${encounterPath}/questionnaire?${new URLSearchParams({ return_page: returnPage })}`;

  test("closes to the encounter page in return_page", async ({ page }) => {
    await page.goto(pickerUrl("files"));
    await expect(
      page.getByRole("heading", { name: "Select a questionnaire to fill" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Close", exact: true }).click();

    await expect(page).toHaveURL(`${encounterPath}/files`);
  });

  test("closes to the updates page for an invalid return_page", async ({
    page,
  }) => {
    await page.goto(pickerUrl("../bogus"));
    await expect(
      page.getByRole("heading", { name: "Select a questionnaire to fill" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Close", exact: true }).click();

    await expect(page).toHaveURL(`${encounterPath}/updates`);
  });
});
