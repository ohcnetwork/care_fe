import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { createQuestionnaireEncounter } from "tests/helper/questionnaire";
import { clickTabOrMenuItem, expectToast } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

import { createServiceRequest } from "./serviceRequest";

test.use({ storageState: "tests/.auth/user.json" });

test("marks a service request as completed from the actions menu", async ({
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

  await test.step("Open the new request, which has no report yet", async () => {
    await clickTabOrMenuItem(page, /service requests/i);
    await page
      .locator('[data-slot="table-body"] [data-slot="table-row"]')
      .filter({ hasText: activityDefinition })
      .first()
      .getByRole("button", { name: "See Details" })
      .click();
    await expect(request.getByText("Active", { exact: true })).toBeVisible();
  });

  await test.step("Complete it from the actions menu with a note", async () => {
    await page.getByRole("button", { name: "More Actions" }).click();
    await page.getByRole("menuitem", { name: "Mark as Completed" }).click();
    const dialog = page.getByRole("dialog", { name: "Add Completion Note" });
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
