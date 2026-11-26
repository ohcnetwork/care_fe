import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { createQuestionnaireEncounter } from "tests/helper/questionnaire";
import { adminApiHeaders, apiBaseUrl } from "tests/helper/questionnaireV2";
import { clickTabOrMenuItem, expectToast } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

import { createServiceRequest } from "./serviceRequest";

test.use({ storageState: "tests/.auth/user.json" });

test("marks a service request with a pending report as completed from the actions menu", async ({
  page,
}) => {
  const facilityId = getFacilityId();
  const { patientId, encounterId } =
    await createQuestionnaireEncounter(facilityId);
  const { activityDefinition } = await createServiceRequest(
    page,
    facilityId,
    patientId,
    encounterId,
    false,
    { activityDefinition: "Urinalysis" },
  );
  const request = page.getByRole("region", {
    name: activityDefinition,
    exact: true,
  });
  const note = faker.lorem.sentence();

  await test.step("Open the new request", async () => {
    await clickTabOrMenuItem(page, /service requests/i);
    await page
      .locator('[data-slot="table-body"] [data-slot="table-row"]')
      .filter({ hasText: activityDefinition })
      .first()
      .getByRole("button", { name: "See Details" })
      .click();
    await expect(request.getByText("Active", { exact: true })).toBeVisible();
  });

  const dialog = page.getByRole("dialog", { name: "Add Completion Note" });
  const openCompleteDialog = async () => {
    await page.getByRole("button", { name: "More Actions" }).click();
    await page.getByRole("menuitem", { name: "Mark as Completed" }).click();
    await expect(dialog).toBeVisible();
  };

  await test.step("With no report, completing shows no warning", async () => {
    await openCompleteDialog();
    await expect(dialog.getByRole("note")).toHaveCount(0);
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toBeHidden();
  });

  await test.step("Leave a report pending final review", async () => {
    const serviceRequestId = new URL(page.url()).pathname.split("/").at(-1);
    // Seeded through the API: specimen and report entry have their own specs
    const response = await fetch(
      `${apiBaseUrl()}/api/v1/patient/${patientId}/diagnostic_report/`,
      {
        method: "POST",
        headers: adminApiHeaders(),
        body: JSON.stringify({
          status: "preliminary",
          category: {
            code: "LAB",
            display: "Laboratory",
            system: "http://terminology.hl7.org/CodeSystem/v2-0074",
          },
          service_request: serviceRequestId,
        }),
      },
    );
    expect(response.ok, await response.text()).toBe(true);
    await page.reload();
    await expect(request.getByText("Active", { exact: true })).toBeVisible();
  });

  await test.step("Complete it from the actions menu despite the warning", async () => {
    await openCompleteDialog();
    const warning = dialog.getByRole("note");
    await expect(warning).toContainText("1 report is pending final review");
    await expect(warning).toContainText(
      "Pending reports can't be approved or edited after the request is completed.",
    );
    await dialog
      .getByRole("textbox", { name: "Completion Note", exact: true })
      .fill(note);
    const completion = page.waitForRequest(
      (req) =>
        req.method() === "PATCH" &&
        /\/service_request\/[^/]+\/$/.test(new URL(req.url()).pathname),
    );
    await dialog.getByRole("button", { name: "Save & Complete" }).click();
    expect((await completion).postDataJSON()).toMatchObject({
      status: "completed",
      note,
    });
  });

  await test.step("The request shows as completed", async () => {
    await expectToast(page, "Service request marked as completed");
    await expect(request.getByText("Completed", { exact: true })).toBeVisible();
    // A completed request has no actions left in the menu
    await expect(
      page.getByRole("button", { name: "More Actions" }),
    ).toBeHidden();
  });
});
