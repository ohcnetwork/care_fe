import { expect, test } from "@playwright/test";
import { createResourceRequestViaUi } from "tests/helper/patient";
import { createQuestionnaireEncounter } from "tests/helper/questionnaire";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Resource Request Creation", () => {
  let facilityId: string;
  let patientId: string;

  test.beforeEach(async () => {
    // A patient of this test's own, not the first encounter in a shared list
    // that parallel tests keep changing.
    facilityId = getFacilityId();
    ({ patientId } = await createQuestionnaireEncounter(facilityId));
  });

  test(
    "Create a new resource request and verify it in patient resources tab",
    { tag: ["@atomic", "@cap:patient.request.create"] },
    async ({ page }) => {
      const { title, reason, category } = await createResourceRequestViaUi(
        page,
        { facilityId, patientId, category: "Medicines" },
      );

      await test.step("Verify resource request in patient resources tab", async () => {
        await page.goto(`/facility/${facilityId}/resource`);

        const resourceCard = page
          .locator('[data-slot="card"]')
          .filter({ hasText: title });

        await expect(
          resourceCard.locator('[data-slot="card-title"]'),
        ).toContainText(title);
        await expect(
          resourceCard.locator('[data-slot="card-description"]'),
        ).toContainText(reason);
        await expect(
          resourceCard
            .locator('[data-slot="badge"]')
            .filter({ hasText: category }),
        ).toBeVisible();
      });
    },
  );
});
