import { expect, test } from "@playwright/test";
import {
  addDispenseMedicationViaUi,
  billSelectedMedicationsViaUi,
} from "tests/helper/inventory";
import { findLocationViaApi } from "tests/helper/locations";
import { createQuestionnaireEncounter } from "tests/helper/questionnaire";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test(
  "Bill Selected dispenses a stocked medicine and issues exactly one invoice",
  { tag: ["@atomic", "@cap:inventory.medication.dispense"] },
  async ({ page }) => {
    const facilityId = getFacilityId();
    const pharmacy = await findLocationViaApi({ facilityId, name: "Pharmacy" });
    const { patientId, encounterId } =
      await createQuestionnaireEncounter(facilityId);
    await addDispenseMedicationViaUi(page, {
      facilityId,
      locationId: pharmacy.id,
      patientId,
      encounterId,
      medicationName: "Paracetamol",
    });
    await expect(page.getByRole("spinbutton")).toHaveValue("1");
    const invoiceCreates: string[] = [];
    page.on("request", (request) => {
      if (
        request.method() === "POST" &&
        request.url().endsWith(`/facility/${facilityId}/invoice/`)
      )
        invoiceCreates.push(request.url());
    });
    const dispensed = page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        response.url().endsWith("/api/v1/batch_requests/") &&
        (response.request().postData() ?? "").includes("/medication/dispense/"),
    );
    const issued = page.waitForResponse(
      (response) =>
        response.request().method() === "PUT" &&
        response.url().includes(`/facility/${facilityId}/invoice/`) &&
        response.request().postDataJSON().status === "issued",
    );
    // Clicks "Bill Selected" and waits for the new dispense order page.
    await billSelectedMedicationsViaUi(page);
    const dispenseResponse = await dispensed;
    expect(dispenseResponse.ok(), await dispenseResponse.text()).toBe(true);
    const invoiceResponse = await issued;
    expect(invoiceResponse.ok(), await invoiceResponse.text()).toBe(true);
    await expect(page).toHaveURL(/medication_dispense\/order\//);
    expect(invoiceCreates).toHaveLength(1);
  },
);
