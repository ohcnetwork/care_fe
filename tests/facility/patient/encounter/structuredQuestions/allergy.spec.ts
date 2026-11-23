import { expect, test } from "@playwright/test";
import { createQuestionnaireEncounter } from "tests/helper/questionnaire";
import { addAllergyViaUi } from "tests/helper/structuredQuestions";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Allergy in Encounter", () => {
  test(
    "should add allergy in encounter and verify it appears in patient overview",
    { tag: ["@atomic", "@cap:questionnaire.structured.allergy.create"] },
    async ({ page }) => {
      const facilityId = getFacilityId();
      const { patientId, encounterId } =
        await createQuestionnaireEncounter(facilityId);

      const { allergyName } = await addAllergyViaUi(page, {
        facilityId,
        patientId,
        encounterId,
      });

      await expect(page.getByText(allergyName).first()).toBeVisible();
    },
  );
});
