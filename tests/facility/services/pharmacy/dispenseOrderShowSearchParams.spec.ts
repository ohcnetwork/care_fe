import { expect, test } from "@playwright/test";
import { openServiceLocation } from "tests/facility/services/helpers";
import { createQuestionnaireEncounter } from "tests/helper/questionnaire";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

// After billing, the bill medications page opens the new dispense order with
// `autoAdvanceStatus=true` and `collectPayment=<invoice id>`. The order page
// reads them with a typed search schema (`src/lib/router/search/pharmacy.ts`),
// acts on each once and removes it from the URL.

test("a billed order moves to in progress and opens its payment sheet", async ({
  page,
}) => {
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
    await page.goto(
      `${pharmacyPath}/medication_requests/patient/${patientId}/bill/dispense/${encounterId}`,
    );
    await page
      .getByRole("combobox")
      .filter({ hasText: "Add Medication" })
      .click();
    await page
      .getByRole("option", { name: "Medications", exact: true })
      .click();
    await page.getByRole("option", { name: "Ibuprofen", exact: true }).click();
    const sheet = page.getByRole("dialog");
    await expect(sheet.getByRole("spinbutton")).toHaveValue("1");
    await sheet.getByRole("button", { name: /^Add Medication/ }).click();
    await expect(sheet).toHaveCount(0);
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
    await page.getByRole("button", { name: /^Bill Selected/ }).click();

    await expect(page).toHaveURL(/medication_dispense\/order\//);
    expect((await advanced).ok()).toBe(true);
    await expect(
      page.getByRole("dialog", { name: "Collect Payment" }),
    ).toBeVisible();
    await expect(page).not.toHaveURL(/autoAdvanceStatus|collectPayment/);
    expect(orderUrls.join("\n")).toMatch(
      /autoAdvanceStatus=true&collectPayment=[0-9a-f-]+/,
    );
  });
});
