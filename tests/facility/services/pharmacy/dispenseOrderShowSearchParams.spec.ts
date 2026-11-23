import { expect, test } from "@playwright/test";
import { openServiceLocation } from "tests/helper/healthcareService";
import {
  addDispenseMedicationViaUi,
  billSelectedMedicationsViaUi,
} from "tests/helper/inventory";
import { createQuestionnaireEncounter } from "tests/helper/questionnaire";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

// After billing, the bill medications page opens the new dispense order with
// `autoAdvanceStatus=true` and `collectPayment=<invoice id>`. The order page
// reads them with a typed search schema (`src/lib/router/search/pharmacy.ts`),
// acts on each once and removes it from the URL.

test(
  "a billed order moves to in progress and opens its payment sheet",
  { tag: ["@atomic", "@cap:inventory.medication.dispense"] },
  async ({ page }) => {
    const facilityId = getFacilityId();
    const pharmacyPath = await openServiceLocation(
      page,
      facilityId,
      "Main Pharmacy",
      "Pharmacy",
    );
    const { patientId, encounterId } =
      await createQuestionnaireEncounter(facilityId);

    // Each run dispenses one unit of the Pharmacy's Ibuprofen stock.
    await test.step("Bill a stocked medicine", async () => {
      await addDispenseMedicationViaUi(page, {
        facilityId,
        locationId: pharmacyPath.split("/locations/")[1],
        patientId,
        encounterId,
        medicationName: "Ibuprofen",
      });
    });

    await test.step("Open the order with the billing keys in the URL", async () => {
      const orderUrls: string[] = [];
      page.on("framenavigated", (frame) => {
        if (frame === page.mainFrame() && frame.url().includes("/order/"))
          orderUrls.push(frame.url());
      });
      const advanced = page.waitForResponse(
        (response) =>
          response.request().method() === "POST" &&
          response.url().endsWith("/api/v1/batch_requests/") &&
          (response.request().postData() ?? "").includes("/order/dispense/") &&
          (response.request().postData() ?? "").includes('"in_progress"'),
      );
      // Clicks "Bill Selected" and waits for the dispense order page.
      await billSelectedMedicationsViaUi(page);

      expect((await advanced).ok()).toBe(true);
      await expect(
        page.getByRole("dialog", { name: "Collect Payment" }),
      ).toBeVisible();
      await expect(page).not.toHaveURL(/autoAdvanceStatus|collectPayment/);
      expect(orderUrls.join("\n")).toMatch(
        /autoAdvanceStatus=true&collectPayment=[0-9a-f-]+/,
      );
    });
  },
);
