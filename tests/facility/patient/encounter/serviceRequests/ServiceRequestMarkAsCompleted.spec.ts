import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { clickTabOrMenuItem, expectToast } from "tests/helper/ui";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

import { createServiceRequest, reportTypeCombobox } from "./serviceRequest";

test.use({ storageState: "tests/.auth/user.json" });

test("marks a service request with a pending report as completed from the actions menu", async ({
  page,
}) => {
  const { activityDefinition } = await createServiceRequest(
    page,
    getFacilityId(),
    getPatientId(),
    getEncounterId(),
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
    // Newest first, so the first match is the request just created
    await page
      .locator('[data-slot="table-body"] [data-slot="table-row"]')
      .filter({ hasText: activityDefinition })
      .first()
      .getByRole("button", { name: "See Details" })
      .click();
    await expect(request.getByText("Active", { exact: true })).toBeVisible();
  });

  await test.step("Start a report and leave it pending", async () => {
    await page.getByRole("button", { name: "Collect Specimen" }).click();
    await expect(
      page.getByText("QR code generated successfully"),
    ).toBeVisible();
    await page.getByPlaceholder("Value", { exact: true }).fill("2");
    const collectButton = page.getByRole("button", {
      name: "Mark as collected",
    });
    await expect(collectButton).toBeEnabled();
    await Promise.all([
      collectButton.click(),
      expectToast(page, /specimen collected/i),
    ]);
    await reportTypeCombobox(page).click();
    await page.getByRole("option").first().click();
    await page
      .getByRole("button", { name: "Create Report", exact: true })
      .click();
    await expect(page.getByPlaceholder("Result value").first()).toBeVisible();
  });

  await test.step("Complete it from the actions menu despite the warning", async () => {
    await page.getByRole("button", { name: "More Actions" }).click();
    await page
      .getByRole("menuitem", { name: "Mark as Complete", exact: true })
      .click();
    const dialog = page.getByRole("dialog", { name: "Add Completion Note" });
    const warning = dialog.getByRole("note");
    await expect(warning).toContainText(
      "1 of 1 reports is pending final review",
    );
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

  await test.step("The request is completed and its report is locked", async () => {
    await expectToast(page, "Service request marked as completed");
    await expect(request.getByText("Completed", { exact: true })).toBeVisible();
    // A completed request has no actions left in the menu
    await expect(
      page.getByRole("button", { name: "More Actions" }),
    ).toBeHidden();
    await expect(page.getByPlaceholder("Result value")).toBeDisabled();
  });
});
