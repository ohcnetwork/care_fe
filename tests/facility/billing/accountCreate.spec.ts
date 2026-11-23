import { faker } from "@faker-js/faker";
import { createAccountViaUi } from "tests/helper/billing";
import { getFieldErrorMessage } from "tests/helper/error";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";
import { expect, test } from "tests/support/test";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Account create", () => {
  test(
    "should reject whitespace-only input in required text fields",
    { tag: ["@atomic", "@cap:billing.account.create"] },
    async ({ page }) => {
      await page.goto(
        `/facility/${getFacilityId()}/patient/${getPatientId()}/accounts`,
      );
      await page.getByRole("button", { name: "Create Account" }).click();

      const sheet = page.getByRole("dialog", { name: "Create Account" });
      const nameField = sheet.getByRole("textbox", { name: "Name *" });
      await nameField.fill("   ");

      await sheet.getByRole("button", { name: "Create", exact: true }).click();

      const errorMessage = getFieldErrorMessage(nameField);
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toHaveText("Name is required");
    },
  );

  test(
    "should create an account for a patient",
    { tag: ["@atomic", "@cap:billing.account.create"] },
    async ({ page, facilityId, isolatedPatient }) => {
      // A patient may have only one active, open account, so the account goes
      // on a patient of this test's own.
      const name = `E2E Account ${faker.string.alphanumeric(10)}`;
      const { accountId } = await createAccountViaUi(page, {
        facilityId,
        patientId: isolatedPatient.patientId,
        name,
      });

      await test.step("The patient's accounts list the new account", async () => {
        await expect(page.getByText(name)).toBeVisible();
      });

      await test.step("The account page opens with its name", async () => {
        await page.goto(`/facility/${facilityId}/billing/account/${accountId}`);
        await expect(page.getByText(name)).toBeVisible();
      });
    },
  );
});
