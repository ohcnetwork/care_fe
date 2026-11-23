import { addStructuredChargeItemViaUi } from "tests/helper/structuredQuestions";
import { test } from "tests/support/test";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Charge Item Questionnaire", () => {
  test(
    "Create a Medication Charge Item",
    { tag: ["@atomic", "@cap:questionnaire.structured.chargeitem.create"] },
    async ({ page, facilityId, isolatedEncounter }) => {
      // Waits for the "Questionnaire submitted" toast.
      await addStructuredChargeItemViaUi(page, {
        facilityId,
        ...isolatedEncounter,
        category: "Medications",
      });
    },
  );
});
