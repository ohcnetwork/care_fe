import { expect, test } from "@playwright/test";
import { createQuestionnaireEncounter } from "tests/helper/questionnaire";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test("Bill Selected dispenses a stocked medicine and issues exactly one invoice", async ({
  page,
  request,
}) => {
  const facilityId = getFacilityId();
  const headers = getApiHeaders();
  const locationsResponse = await request.get(
    `${getApiUrl()}/api/v1/facility/${facilityId}/location/?mode=kind&limit=100`,
    { headers },
  );
  expect(locationsResponse.ok()).toBe(true);
  const locations = (await locationsResponse.json()) as {
    results: { id: string; name: string }[];
  };
  const pharmacy = locations.results.find(
    (location) => location.name === "Pharmacy",
  );
  expect(pharmacy, "The seeded facility must have a Pharmacy").toBeDefined();
  const { patientId, encounterId } =
    await createQuestionnaireEncounter(facilityId);
  await page.goto(
    `/facility/${facilityId}/locations/${pharmacy!.id}/medication_requests/patient/${patientId}/bill/dispense/${encounterId}`,
  );
  await page
    .getByRole("combobox")
    .filter({ hasText: "Add Medication" })
    .click();
  await page.getByRole("option", { name: "Medications", exact: true }).click();
  await page.getByRole("option", { name: "Paracetamol", exact: true }).click();
  const sheet = page.getByRole("dialog");
  await expect(sheet.getByRole("spinbutton")).toHaveValue("1");
  await sheet.getByRole("button", { name: /^Add Medication/ }).click();
  await expect(sheet).toHaveCount(0);
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
      response.request().postData()?.includes("/medication/dispense/"),
  );
  const issued = page.waitForResponse(
    (response) =>
      response.request().method() === "PUT" &&
      response.url().includes(`/facility/${facilityId}/invoice/`) &&
      response.request().postDataJSON().status === "issued",
  );
  await page.getByRole("button", { name: /^Bill Selected/ }).click();
  const dispenseResponse = await dispensed;
  expect(dispenseResponse.ok(), await dispenseResponse.text()).toBe(true);
  const invoiceResponse = await issued;
  expect(invoiceResponse.ok(), await invoiceResponse.text()).toBe(true);
  await expect(page).toHaveURL(/medication_dispense\/order\//);
  expect(invoiceCreates).toHaveLength(1);
});
